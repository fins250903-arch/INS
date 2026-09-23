#!/usr/bin/env tsx
/**
 * Compiles redirects.config.json into vercel.json so Vercel (still the live DNS target) applies
 * the same host-scoped and apex redirects as Cloudflare Workers.
 *
 * Usage:
 *   npm run vercel:redirects           # write vercel.json
 *   npm run vercel:redirects:check     # fail if the file is out of date
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RedirectRule } from '../workers/legacy-redirects/src/match';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'redirects.config.json');
const OUTPUT_PATH = join(ROOT, 'vercel.json');
const CANONICAL_ORIGIN = 'https://insbs.net';

type VercelRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
  has?: { type: 'host'; value: string }[];
};

function toVercelSource(from: string): { source: string; splat: boolean } {
  if (!from.startsWith('/')) throw new Error(`Rule source must start with "/": ${from}`);
  if (from.endsWith('/*')) {
    return { source: `${from.slice(0, -2)}/:path*`, splat: true };
  }
  if (from.includes('*')) {
    throw new Error(`Unsupported splat position in "${from}"`);
  }
  return { source: from, splat: false };
}

function toVercelDestination(to: string, splat: boolean): string {
  let dest = to;
  if (splat) dest = dest.replaceAll(':splat', ':path*');
  else if (dest.includes(':splat')) {
    throw new Error(`Destination uses :splat but source has no *: ${to}`);
  }
  if (dest.startsWith('http://') || dest.startsWith('https://')) return dest;
  if (!dest.startsWith('/')) throw new Error(`Destination must be a path or URL: ${to}`);
  return `${CANONICAL_ORIGIN}${dest}`;
}

function toVercelRedirect(rule: RedirectRule): VercelRedirect {
  const { source, splat } = toVercelSource(rule.from);
  const redirect: VercelRedirect = {
    source,
    destination: toVercelDestination(rule.to, splat),
    permanent: rule.status === 308
  };
  if (rule.host) redirect.has = [{ type: 'host', value: rule.host }];
  return redirect;
}

async function main() {
  const check = process.argv.includes('--check');
  const { rules } = JSON.parse(await readFile(CONFIG_PATH, 'utf-8')) as { rules: RedirectRule[] };
  const redirects = rules.map(toVercelRedirect);
  const content = `${JSON.stringify({ redirects }, null, 2)}\n`;

  const current = await readFile(OUTPUT_PATH, 'utf-8').catch(() => null);
  if (check) {
    if (current !== content) {
      throw new Error('vercel.json is out of date — run `npm run vercel:redirects`');
    }
    console.log(`vercel.json is up to date (${redirects.length} redirects).`);
    return;
  }

  if (current !== content) await writeFile(OUTPUT_PATH, content, 'utf-8');
  console.log(`Wrote vercel.json: ${redirects.length} redirects.`);
}

main().catch((error: Error) => {
  console.error(`[generate-vercel-redirects] ${error.message}`);
  process.exit(1);
});
