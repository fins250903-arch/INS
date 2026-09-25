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

const expected = {
  ins: domains.workers.ins.hostnames,
  'ins-legacy-redirects': domains.workers['ins-legacy-redirects'].hostnames
};

const actual = {
  ins: (site.routes ?? []).filter((r) => r.custom_domain).map((r) => r.pattern),
  'ins-legacy-redirects': (legacy.routes ?? []).filter((r) => r.custom_domain).map((r) => r.pattern)
};

let failed = 0;
for (const name of Object.keys(expected)) {
  const want = [...expected[name]].sort().join(',');
  const got = [...actual[name]].sort().join(',');
  if (want !== got) {
    failed += 1;
    console.error(`${name} custom domains\n  expected: ${want}\n  actual:   ${got}`);
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
console.log(
  `Cloudflare custom domains match cloudflare/domains.json (${expected.ins.length} on ins, ${expected['ins-legacy-redirects'].length} on ins-legacy-redirects; ${domains.dns_preserve.length} extra DNS records in BIND import).`
);
