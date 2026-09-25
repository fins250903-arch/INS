#!/usr/bin/env node
/**
 * Fetch every region / keyword LP through a Cloudflare anycast IP and
 * report status, cf-ray, title, and h1 (for title/body mismatch review).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CF_IP = process.env.CF_IP || '104.21.95.3';
const HOST = 'insbs.net';
const REGION_LINKS = [
  'mie', 'kyouto', 'wakayama', 'osaka', 'nara', 'gunnma', 'ibaraki', 'tiba',
  'saitama', 'tokyou', 'okinawa', 'kanagawa', 'fukuoka', 'hyougo', 'miyagi',
  'kumamoto', 'saga', 'aiti', 'siga', 'fukui', 'sizuoka', 'gifu'
];
const EXTRA_REGIONS = [
  'fukusima', 'hokkaidou', 'isikawa', 'kagawa', 'kagoshima', 'miyazaki',
  'okayama', 'ooit', 'tokushima', 'totigi'
];
const KEYWORDS = [
  'shanai-outo', 'seat-senjo', 'omorashi', 'unko', 'shanai-nioi', 'ac-nioi',
  'kareisyu', 'pet-nioi', 'tabako-yani', 'chuko-tabako', 'touyu-kobosi', 'pet-ke'
];
const STATIC_PAGES = ['/', '/osaka/', '/contact/', '/privacy/', '/terms/', '/compare/', '/blog/'];

const paths = [
  ...STATIC_PAGES,
  ...[...REGION_LINKS, ...EXTRA_REGIONS].map((s) => `/${s}/`),
  ...REGION_LINKS.flatMap((r) => KEYWORDS.map((k) => `/${r}/${k}/`))
];
const unique = [...new Set(paths)];

function curl(path) {
  const url = `https://${HOST}${path}`;
  const args = [
    '-sS', '--max-time', '25', '--resolve', `${HOST}:443:${CF_IP}`,
    '-D', '-', '-o', '-', url
  ];
  let raw = '';
  try {
    raw = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  } catch (error) {
    return { path, url, ok: false, error: String(error.stderr || error.message) };
  }
  const split = raw.indexOf('\r\n\r\n');
  const header = split === -1 ? raw : raw.slice(0, split);
  const body = split === -1 ? '' : raw.slice(split + 4);
  const status = (header.match(/^HTTP\/\S+\s+(\d+)/m) || [])[1] || '';
  const server = (header.match(/^server:\s*(.+)$/im) || [])[1] || '';
  const cfRay = (header.match(/^cf-ray:\s*(.+)$/im) || [])[1] || '';
  const location = (header.match(/^location:\s*(.+)$/im) || [])[1] || '';
  const title = ((body.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '')
    .replace(/\s+/g, ' ')
    .trim();
  const h1 = ((body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    path,
    url,
    status: Number(status) || 0,
    server,
    cfRay: Boolean(cfRay),
    location,
    title,
    h1,
    cloudflare: /cloudflare/i.test(server) && Boolean(cfRay)
  };
}

const rows = [];
for (const path of unique) {
  rows.push(curl(path));
  process.stdout.write('.');
}
process.stdout.write('\n');

const failed = rows.filter((r) => !r.cloudflare || r.status >= 400 || r.status === 0);
const redirects = rows.filter((r) => r.status >= 300 && r.status < 400);
const ok = rows.filter((r) => r.cloudflare && r.status === 200);

const report = {
  checked: rows.length,
  ok200: ok.length,
  redirects: redirects.length,
  failed: failed.length,
  failedRows: failed,
  samples: ok.slice(0, 5)
};
writeFileSync('/opt/cursor/artifacts/lp_cloudflare_audit.json', JSON.stringify({ report, rows }, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`ok200=${ok.length} redirects=${redirects.length} failed=${failed.length} total=${rows.length}`);
