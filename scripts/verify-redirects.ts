#!/usr/bin/env tsx
/**
 * Regression check for the redirect table migrated from Vercel to Cloudflare.
 *
 * The expectations below were captured from the live Vercel deployment before the migration, so a
 * passing run means the Cloudflare rules answer the legacy URLs the same way.
 *
 * Run with: npm run cf:redirects:verify
 */
import { readFileSync } from 'node:fs';
import { createMatcher, type RedirectRule } from '../workers/legacy-redirects/src/match';

const config = JSON.parse(readFileSync('redirects.config.json', 'utf-8')) as {
  rules: RedirectRule[];
};
const match = createMatcher(config.rules);

/** `null` means "no redirect rule applies", i.e. the request is served by assets or the Worker. */
type Expectation = [host: string, pathname: string, destination: string | null];

const CASES: Expectation[] = [
  // Apex domain: rules compiled into public/_redirects.
  ['insbs.net', '/', '/osaka/'],
  ['insbs.net', '/osaka/', null],
  ['insbs.net', '/contact/', null],
  ['insbs.net', '/blog/chiiki/osaka/', null],
  ['insbs.net', '/hirosima', '/'],
  ['insbs.net', '/hirosima/', '/'],
  ['insbs.net', '/hirosima/x/y', '/'],
  ['insbs.net', '/blog/osaka/shanai-seiso-ranking', '/blog/osaka/ranking-osaka-carclean/'],
  ['insbs.net', '/blog/osaka/shanai-seiso-ranking/', '/blog/osaka/ranking-osaka-carclean/'],
  ['insbs.net', '/blog/aiti/shanai-seiso-ranking', '/aiti/'],
  ['insbs.net', '/blog/osaka', '/blog/chiiki/osaka/'],
  ['insbs.net', '/blog/osaka/', '/blog/chiiki/osaka/'],
  // Region-prefixed article URLs stay on the trailing-slash form and redirect without it.
  ['insbs.net', '/blog/osaka/cupmen1', '/blog/cupmen1'],
  ['insbs.net', '/blog/osaka/cupmen1/', null],
  ['insbs.net', '/blog/mie/foo', '/blog/foo'],
  ['insbs.net', '/wp1/osaka', '/osaka/'],
  ['insbs.net', '/wp1/osaka/test', '/osaka/test'],
  ['insbs.net', '/wp1/osaka/a/b', '/osaka/a/b'],
  ['insbs.net', '/wp1/mie/blog/foo', '/blog/foo'],
  ['insbs.net', '/wp1/hirosima/anything', '/'],
  ['insbs.net', '/ok2', '/fukuoka/'],
  ['insbs.net', '/ok2/x', '/fukuoka/x'],
  ['insbs.net', '/ok2/blog/foo', '/blog/foo'],
  ['insbs.net', '/ok2/saitama/blog/foo', '/blog/foo'],

  // Legacy WordPress subdomains: handled by workers/legacy-redirects.
  ['osak.insbs.net', '/', '/osaka/'],
  ['osak.insbs.net', '/wp1', '/osaka/'],
  ['osak.insbs.net', '/wp1/', '/osaka/'],
  ['osak.insbs.net', '/wp1/blog', '/blog/chiiki/osaka/'],
  ['osak.insbs.net', '/wp1/blog/abc', '/blog/abc'],
  ['osak.insbs.net', '/wp1/wp-content/uploads/a.jpg', '/osaka/wp-content/uploads/a.jpg'],
  // The subdomain's own `/wp1/*` rule outranks the apex `/wp1/<region>/blog` rules, as on Vercel.
  ['osak.insbs.net', '/wp1/kumamoto/blog', '/osaka/kumamoto/blog'],
  ['osak.insbs.net', '/foo/bar', '/osaka/foo/bar'],
  ['osak.insbs.net', '/hirosima/x', '/'],
  // Paths that already exist on the apex must not be prefixed a second time.
  ['osak.insbs.net', '/osaka/', '/osaka/'],
  ['osak.insbs.net', '/blog/osaka/cupmen1/', '/blog/osaka/cupmen1/'],
  ['hyg.insbs.net', '/wp1/blog', '/blog/chiiki/hyougo/'],
  ['hyg.insbs.net', '/wp1/x', '/hyougo/x'],
  ['hyg.insbs.net', '/foo', '/hyougo/foo'],
  ['hyg.insbs.net', '/hyougo/', '/hyougo/'],
  ['siga.insbs.net', '/wp1', '/siga/'],
  ['siga.insbs.net', '/wp1/blog', '/blog/chiiki/siga/'],
  ['siga.insbs.net', '/foo', '/siga/foo'],

  // www is a redirect-only hostname.
  ['www.insbs.net', '/contact/', '/contact/'],
  ['www.insbs.net', '/blog/osaka/cupmen1/', '/blog/osaka/cupmen1/']
];

let failures = 0;
for (const [host, pathname, expected] of CASES) {
  const hit = match(host, pathname);
  const actual = hit?.to ?? null;
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${host}${pathname}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

console.log(`${CASES.length - failures}/${CASES.length} redirect expectations passed.`);
if (failures > 0) process.exit(1);
