#!/usr/bin/env node
/**
 * End-to-end verification of a deployed (or locally previewed) build.
 *
 * For every page in dist/client it checks that the deployment answers 200, that the served markup
 * matches the built artifact byte for byte (ignoring content-hash filenames), and that every asset
 * the page references resolves. It then replays the whole redirect table from redirects.config.json.
 *
 * Usage:
 *   node scripts/verify-deployment.mjs http://localhost:8787
 *   node scripts/verify-deployment.mjs https://insbs.net --out /tmp/report.json
 *   node scripts/verify-deployment.mjs http://localhost:8787 --shard 3/10
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');

function parseArgs(argv) {
  const positional = [];
  const options = { concurrency: 16, out: null, shard: null, skipRedirects: false, skipAssets: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') options.out = argv[++i];
    else if (arg === '--concurrency') options.concurrency = Number(argv[++i]);
    else if (arg === '--shard') options.shard = argv[++i];
    else if (arg === '--skip-redirects') options.skipRedirects = true;
    else if (arg === '--skip-assets') options.skipAssets = true;
    else positional.push(arg);
  }
  return { baseUrl: positional[0], options };
}

/** Content-hash filenames differ per build; compare markup without them. */
const normalizeHtml = (html) =>
  html.replace(
    /(\/_astro\/[^"'\s)]+?)\.[A-Za-z0-9_-]{6,}(_[A-Za-z0-9_-]+)?\.(webp|png|jpg|jpeg|avif|svg|css|js)/g,
    '$1.$3'
  );

async function collectPages(dir, pages = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collectPages(full, pages);
    else if (entry.name === 'index.html') {
      const rel = relative(CLIENT_DIR, full).replaceAll('\\', '/');
      pages.push('/' + rel.replace(/index\.html$/, ''));
    } else if (entry.name.endsWith('.html')) {
      const rel = relative(CLIENT_DIR, full).replaceAll('\\', '/');
      pages.push('/' + rel);
    }
  }
  return pages;
}

const LOCAL_ASSET = /(?:src|href)="(\/[^"]+\.(?:webp|png|jpe?g|avif|svg|css|js|ico|xml))"/g;

function extractAssets(html) {
  const assets = new Set();
  for (const [, url] of html.matchAll(LOCAL_ASSET)) assets.add(url);
  for (const [, srcset] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/')) assets.add(url);
    }
  }
  return assets;
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function fetchWithRetry(url, init, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
  throw lastError;
}

async function checkPage(baseUrl, pathname, redirectFor) {
  const failures = [];
  const response = await fetchWithRetry(`${baseUrl}${pathname}`, { redirect: 'manual' });

  // A handful of built pages are deliberately shadowed by a redirect rule (e.g. `/` -> `/osaka/`).
  const expectedRedirect = redirectFor(pathname);
  if (expectedRedirect) {
    const location = response.headers.get('location');
    const actual = location ? new URL(location, baseUrl).pathname : null;
    if (response.status !== expectedRedirect.status || actual !== expectedRedirect.to) {
      failures.push(
        `status ${response.status} -> ${actual} (expected ${expectedRedirect.status} -> ${expectedRedirect.to})`
      );
    }
    return { pathname, failures, assets: new Set() };
  }

  if (response.status !== 200) {
    failures.push(`status ${response.status} (expected 200)`);
    return { pathname, failures, assets: new Set() };
  }

  const html = await response.text();
  const localPath = join(CLIENT_DIR, pathname.replace(/\/$/, '/index.html').replace(/^\//, ''));
  if (existsSync(localPath)) {
    const expected = await readFile(localPath, 'utf-8');
    if (normalizeHtml(expected) !== normalizeHtml(html)) {
      failures.push('served markup differs from the built artifact');
    }
  }

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (!title.trim()) failures.push('missing <title>');
  // Astro emits tiny meta-refresh pages for in-page `Astro.redirect()` on prerendered routes.
  const isMetaRefresh = /<meta http-equiv="refresh"/i.test(html);
  if (!isMetaRefresh && !/<link rel="stylesheet"|<style/.test(html)) {
    failures.push('no stylesheet reference');
  }
  if (/Internal server error|Astro\.glob|\[object Object\]/.test(html)) {
    failures.push('error marker found in markup');
  }

  return { pathname, failures, assets: extractAssets(html) };
}

async function checkAsset(baseUrl, pathname) {
  // Assets referenced by content but absent from the build are a content problem, not a hosting
  // problem, so they are reported separately instead of failing the deployment check.
  const inBuild = existsSync(join(CLIENT_DIR, decodeURIComponent(pathname).replace(/^\//, '')));
  let response = await fetchWithRetry(`${baseUrl}${pathname}`, { method: 'HEAD', redirect: 'manual' });
  if (response.status === 405 || response.status === 501) {
    response = await fetchWithRetry(`${baseUrl}${pathname}`, { redirect: 'manual' });
  }
  if (response.status === 200) return null;
  return { asset: pathname, status: response.status, inBuild };
}

async function loadPathRules() {
  const { rules } = JSON.parse(await readFile(join(ROOT, 'redirects.config.json'), 'utf-8'));
  return rules.filter((rule) => !rule.host);
}

async function checkRedirects(baseUrl) {
  const pathRules = await loadPathRules();
  const failures = [];

  // Only concrete sources can be replayed over HTTP; dynamic ones get a representative sample.
  const cases = pathRules.map((rule) => {
    const from = rule.from.replace('*', 'verify-sample').replace(/:([A-Za-z0-9_]+)/, 'verify-sample');
    const to = rule.to
      .replace(':splat', 'verify-sample')
      .replace(/:([A-Za-z0-9_]+)/, 'verify-sample');
    return { from, to, status: rule.status };
  });

  await mapLimit(cases, 16, async ({ from, to, status }) => {
    const response = await fetchWithRetry(`${baseUrl}${from}`, { redirect: 'manual' });
    const location = response.headers.get('location');
    const expected = new URL(to, baseUrl).toString();
    const actual = location ? new URL(location, baseUrl).toString() : null;
    if (response.status !== status || actual !== expected) {
      failures.push(`${from} -> ${response.status} ${actual} (expected ${status} ${expected})`);
    }
  });

  return { total: cases.length, failures };
}

async function main() {
  const { baseUrl, options } = parseArgs(process.argv.slice(2));
  if (!baseUrl) {
    console.error('Usage: node scripts/verify-deployment.mjs <baseUrl> [--out file] [--shard n/total]');
    process.exit(2);
  }
  if (!existsSync(CLIENT_DIR)) {
    console.error('dist/client not found — run `npm run build` first.');
    process.exit(2);
  }

  let pages = (await collectPages(CLIENT_DIR)).sort();
  if (options.shard) {
    const [index, total] = options.shard.split('/').map(Number);
    pages = pages.filter((_, i) => i % total === index - 1);
  }

  const exactRedirects = new Map(
    (await loadPathRules())
      .filter((rule) => !isDynamicSource(rule.from))
      .map((rule) => [rule.from, rule])
  );
  const redirectFor = (pathname) => exactRedirects.get(pathname);

  const pageResults = await mapLimit(pages, options.concurrency, (pathname) =>
    checkPage(baseUrl, pathname, redirectFor)
  );

  const assets = new Set();
  for (const result of pageResults) for (const asset of result.assets) assets.add(asset);

  const assetIssues = options.skipAssets
    ? []
    : (
        await mapLimit([...assets].sort(), options.concurrency, (asset) => checkAsset(baseUrl, asset))
      ).filter(Boolean);
  const assetFailures = assetIssues.filter((issue) => issue.inBuild);
  const missingFromBuild = assetIssues.filter((issue) => !issue.inBuild);

  const redirects = options.skipRedirects
    ? { total: 0, failures: [] }
    : await checkRedirects(baseUrl);

  const pageFailures = pageResults.filter((result) => result.failures.length > 0);
  const report = {
    baseUrl,
    shard: options.shard,
    checkedAt: new Date().toISOString(),
    pages: { total: pages.length, failed: pageFailures.length },
    assets: { total: assets.size, failed: assetFailures.length },
    redirects: { total: redirects.total, failed: redirects.failures.length },
    /** Referenced by page markup but not present in the build — pre-existing content gaps. */
    missingFromBuild: missingFromBuild.map((issue) => issue.asset),
    failures: {
      pages: pageFailures.map((result) => ({ path: result.pathname, reasons: result.failures })),
      assets: assetFailures.map((issue) => `${issue.asset} -> ${issue.status}`),
      redirects: redirects.failures
    }
  };

  if (options.out) await writeFile(options.out, JSON.stringify(report, null, 2));

  console.log(`base:      ${baseUrl}${options.shard ? ` (shard ${options.shard})` : ''}`);
  console.log(`pages:     ${pages.length - pageFailures.length}/${pages.length} ok`);
  console.log(`assets:    ${assets.size - assetFailures.length}/${assets.size} ok`);
  console.log(`redirects: ${redirects.total - redirects.failures.length}/${redirects.total} ok`);
  if (missingFromBuild.length > 0) {
    console.log(
      `note:      ${missingFromBuild.length} referenced asset(s) are missing from the build itself (pre-existing)`
    );
  }

  for (const failure of report.failures.pages.slice(0, 20)) {
    console.error(`FAIL page ${failure.path}: ${failure.reasons.join('; ')}`);
  }
  for (const failure of report.failures.assets.slice(0, 20)) console.error(`FAIL asset ${failure}`);
  for (const failure of redirects.failures.slice(0, 20)) console.error(`FAIL redirect ${failure}`);

  const failed = pageFailures.length + assetFailures.length + redirects.failures.length;
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
