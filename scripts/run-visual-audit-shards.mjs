#!/usr/bin/env node
/**
 * Fans the layout audit out across many independent worker processes and aggregates their reports.
 *
 * Each worker runs `scripts/visual-audit.mjs` over its own slice of the page list in its own Chrome
 * instance, so a crash or hang is contained to one shard. With `--baseline` the aggregate is diffed
 * against an earlier report — that is how a problem the old host shows too gets separated from one
 * the migration introduced.
 *
 * Usage:
 *   node scripts/run-visual-audit-shards.mjs https://insbs.net --shards 100 --out /tmp/baseline.json
 *   node scripts/run-visual-audit-shards.mjs http://localhost:8787 --shards 100 \
 *     --baseline /tmp/baseline.json --out /tmp/round-1.json
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const AUDIT_SCRIPT = join(import.meta.dirname, 'visual-audit.mjs');

function parseArgs(argv) {
  const positional = [];
  const options = { shards: 100, workers: 8, out: null, baseline: null, passthrough: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--shards') options.shards = Number(argv[++i]);
    else if (arg === '--workers') options.workers = Number(argv[++i]);
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--baseline') options.baseline = argv[++i];
    else if (arg.startsWith('--')) options.passthrough.push(arg, argv[++i]);
    else positional.push(arg);
  }
  return { baseUrl: positional[0], options };
}

function runShard(baseUrl, shard, total, reportPath, passthrough) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [AUDIT_SCRIPT, baseUrl, '--shard', `${shard}/${total}`, '--out', reportPath, ...passthrough],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    child.stderr.setEncoding('utf-8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    // Exit code 1 just means the shard found problems; they are read back from its report.
    child.once('exit', (code) => {
      if (code === 0 || code === 1) resolvePromise();
      else reject(new Error(`shard ${shard} exited with ${code}\n${stderr}`));
    });
  });
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  });
  await Promise.all(runners);
}

const renderKey = (failure) => `${failure.viewport} ${failure.path}`;

/** Problem texts quote absolute URLs, so the origin has to go before two hosts can be compared. */
const problemKeys = (failure, baseUrl) =>
  failure.problems.map((problem) => `${renderKey(failure)} :: ${problem.replaceAll(baseUrl, '')}`);

async function main() {
  const { baseUrl, options } = parseArgs(process.argv.slice(2));
  if (!baseUrl) {
    console.error(
      'Usage: node scripts/run-visual-audit-shards.mjs <baseUrl> [--shards 100] [--workers 8] ' +
        '[--baseline file] [--out file]'
    );
    process.exit(2);
  }

  const reportDir = await mkdtemp(join(tmpdir(), 'visual-audit-shards-'));
  const shards = Array.from({ length: options.shards }, (_, i) => i + 1);
  let completed = 0;

  try {
    await mapLimit(shards, options.workers, async (shard) => {
      await runShard(baseUrl, shard, options.shards, join(reportDir, `${shard}.json`), options.passthrough);
      completed += 1;
      if (completed % 10 === 0 || completed === options.shards) {
        console.log(`  ${completed}/${options.shards} shards done`);
      }
    });

    const failures = [];
    let renders = 0;
    for (const shard of shards) {
      const report = JSON.parse(await readFile(join(reportDir, `${shard}.json`), 'utf-8'));
      renders += report.renders.total;
      failures.push(...report.failures.map((failure) => ({ ...failure, shard })));
    }

    const baseline = options.baseline
      ? JSON.parse(await readFile(resolve(options.baseline), 'utf-8'))
      : null;
    const known = new Set(
      (baseline?.failures ?? []).flatMap((failure) => problemKeys(failure, baseline.baseUrl))
    );
    const regressions = baseline
      ? failures
          .map((failure) => ({
            ...failure,
            problems: failure.problems.filter(
              (problem) => !known.has(`${renderKey(failure)} :: ${problem.replaceAll(baseUrl, '')}`)
            )
          }))
          .filter((failure) => failure.problems.length > 0)
      : [];

    const aggregate = {
      baseUrl,
      shards: options.shards,
      checkedAt: new Date().toISOString(),
      renders: { total: renders, failed: failures.length },
      baseline: options.baseline
        ? { baseUrl: baseline.baseUrl, checkedAt: baseline.checkedAt, failed: baseline.failures.length }
        : null,
      regressions,
      failures
    };
    if (options.out) await writeFile(options.out, JSON.stringify(aggregate, null, 2));

    console.log(
      `${baseUrl}: ${renders - failures.length}/${renders} renders clean across ${options.shards} shards`
    );
    if (baseline) {
      console.log(
        `baseline ${baseline.baseUrl}: ${baseline.failures.length} known problem render(s); ` +
          `${regressions.length} new here`
      );
      for (const regression of regressions.slice(0, 20)) {
        console.error(`REGRESSION ${renderKey(regression)}: ${regression.problems.join('; ')}`);
      }
      if (regressions.length > 0) process.exit(1);
    } else if (failures.length > 0) {
      for (const failure of failures.slice(0, 10)) {
        console.log(`known problem ${renderKey(failure)}: ${failure.problems.join('; ')}`);
      }
    }
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
