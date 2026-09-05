/**
 * Repeat corpus apply + audit until the score stays at 100.
 * Default: 20 rounds (AIO regression loop).
 */
import { spawnSync } from 'node:child_process';

const rounds = Number(process.argv[2] || 20);
const results: { round: number; score: number; failed: string[] }[] = [];

function run(script: string): { status: number; stdout: string } {
  const result = spawnSync('npx', ['tsx', script], {
    encoding: 'utf8',
    cwd: process.cwd()
  });
  return { status: result.status ?? 1, stdout: `${result.stdout || ''}${result.stderr || ''}` };
}

const apply = run('scripts/apply-blog-aio.ts');
console.log(apply.stdout.trim());
const hrefs = run('scripts/rewrite-case-study-hrefs.ts');
console.log(hrefs.stdout.trim());

for (let round = 1; round <= rounds; round += 1) {
  const audit = run('scripts/audit-blog-aio.ts');
  let parsed: { score?: number; failedChecks?: string[] } = {};
  try {
    parsed = JSON.parse(audit.stdout.slice(audit.stdout.indexOf('{')));
  } catch {
    parsed = { score: 0, failedChecks: ['parse-error'] };
  }
  const score = parsed.score ?? 0;
  const failed = parsed.failedChecks ?? [];
  results.push({ round, score, failed });
  console.log(`round ${round}/${rounds} score=${score} failed=${failed.join(',') || 'none'}`);
  if (score < 100) {
    console.error(audit.stdout);
    process.exitCode = 1;
    break;
  }
}

const allPerfect = results.length === rounds && results.every((item) => item.score === 100);
console.log(JSON.stringify({ rounds: results.length, allPerfect, results }, null, 2));
if (!allPerfect) process.exitCode = 1;
