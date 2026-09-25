#!/usr/bin/env node
/**
 * Fail if wrangler custom-domain routes or the BIND import drift from
 * cloudflare/domains.json (the Vercel → Cloudflare hostname map).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

function loadJsonc(path) {
  const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
  const stripped = raw.replace(/(^|[^:])\/\/.*$/gm, '$1');
  return JSON.parse(stripped);
}

const domains = JSON.parse(readFileSync(join(ROOT, 'cloudflare/domains.json'), 'utf-8'));
const bind = readFileSync(join(ROOT, 'cloudflare/dns-import.bind'), 'utf-8');
const site = loadJsonc(join(ROOT, 'wrangler.jsonc'));
const legacy = loadJsonc(join(ROOT, 'workers/legacy-redirects/wrangler.jsonc'));

const configs = {
  ins: site,
  'ins-legacy-redirects': legacy
};

let failed = 0;
for (const [name, spec] of Object.entries(domains.workers)) {
  const actual = (configs[name].routes ?? []).filter((r) => r.custom_domain).map((r) => r.pattern);
  const bindVia = spec.bind_via ?? 'wrangler';
  const want = bindVia === 'dashboard' ? [] : spec.hostnames;
  const wantKey = [...want].sort().join(',');
  const gotKey = [...actual].sort().join(',');
  if (wantKey !== gotKey) {
    failed += 1;
    console.error(
      `${name} wrangler custom domains (bind_via=${bindVia})\n  expected in wrangler: ${wantKey || '(none — bind in the dashboard)'}\n  actual:               ${gotKey || '(none)'}`
    );
  }
  if (bindVia === 'dashboard' && spec.hostnames.length) {
    console.log(`${name} hostnames for the dashboard: ${spec.hostnames.join(', ')}`);
  }
}

for (const rec of domains.dns_preserve ?? []) {
  let needle;
  if (rec.type === 'MX') needle = `IN MX ${rec.priority} ${rec.content}`;
  else if (rec.type === 'TXT') needle = `IN TXT "${rec.content}"`;
  else if (rec.type === 'CAA') needle = `IN CAA ${rec.flags} ${rec.tag} "${rec.content}"`;
  else needle = rec.content;
  if (!bind.includes(needle)) {
    failed += 1;
    console.error(`dns-import.bind is missing ${rec.type} ${rec.why ?? rec.content}\n  expected to contain: ${needle}`);
  }
}

if (failed) process.exit(1);
const dashboardHosts = Object.values(domains.workers)
  .filter((w) => w.bind_via === 'dashboard')
  .reduce((n, w) => n + w.hostnames.length, 0);
const wranglerHosts = Object.values(domains.workers)
  .filter((w) => (w.bind_via ?? 'wrangler') === 'wrangler')
  .reduce((n, w) => n + w.hostnames.length, 0);
console.log(
  `cloudflare/domains.json is consistent (${wranglerHosts} wrangler custom domains, ${dashboardHosts} dashboard hostnames, ${domains.dns_preserve.length} extra DNS records in BIND import).`
);
