/**
 * Rewrite curated LP case-study hrefs from /blog/{slug}/ to /blog/{region}/{slug}/.
 */
import fs from 'node:fs';
import path from 'node:path';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');
const TARGET = path.join(process.cwd(), 'src/data/lp-region-case-studies.ts');
const PREFERRED = ['osaka', 'fukuoka', 'hyougo', 'siga', 'saitama', 'aiti'];
const ALIASES: Record<string, string> = { gorudendog: 'gorudendog1' };

function listMarkdownFiles(dir: string, base = dir): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(full, base));
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return files;
}

const bySlug = new Map<string, { region: string; folder: string }[]>();
for (const rel of listMarkdownFiles(BLOG_ROOT)) {
  const [folder, file] = rel.split('/');
  const slug = (file || '').replace(/\.md$/, '');
  if (!slug) continue;
  const raw = fs.readFileSync(path.join(BLOG_ROOT, rel), 'utf8');
  const quoted = raw.match(/^region:\s*["']([a-z]+)["']/m)?.[1];
  const bare = raw.match(/^region:\s*([a-z]+)\s*$/m)?.[1];
  const region = quoted || bare || folder;
  const list = bySlug.get(slug) || [];
  list.push({ region, folder });
  bySlug.set(slug, list);
}

function canonicalHref(rawSlug: string, preferredRegion?: string): string {
  const slug = ALIASES[rawSlug] || rawSlug;
  const hits = bySlug.get(slug) || [];
  const preferredHit = preferredRegion
    ? hits.find((item) => item.region === preferredRegion || item.folder === preferredRegion)
    : undefined;
  const globalPref = PREFERRED.find((item) => hits.some((hit) => hit.region === item || hit.folder === item));
  const hit =
    preferredHit ||
    hits.find((item) => item.region === globalPref || item.folder === globalPref) ||
    hits[0];
  if (!hit) return `/blog/${slug}/`;
  return `/blog/${hit.region}/${slug}/`;
}

const KEY_REGION: Record<string, string> = {
  osaka: 'osaka',
  nara: 'osaka',
  wakayama: 'osaka',
  mie: 'osaka',
  kyouto: 'osaka',
  fukuoka: 'fukuoka',
  hyougo: 'hyougo',
  siga: 'siga',
  aiti: 'aiti',
  saitama: 'saitama',
  index: 'osaka',
  okinawa: 'osaka',
  tokyou: 'osaka',
  kanagawa: 'saitama',
  tiba: 'saitama',
  gifu: 'aiti',
  sizuoka: 'aiti',
  miyagi: 'osaka',
  hirosima: 'osaka',
  kumamoto: 'fukuoka',
  saga: 'fukuoka',
  fukui: 'siga',
  fukusima: 'osaka',
  gunnma: 'saitama',
  ibaraki: 'saitama'
};

let currentKey = '';
const original = fs.readFileSync(TARGET, 'utf8');
const next = original
  .split('\n')
  .map((line) => {
    const constMatch = line.match(/^const ([a-z]+)CaseStudyItems/);
    if (constMatch) currentKey = constMatch[1];
    const keyMatch = line.match(/^  ([a-z]+): \{/);
    if (keyMatch) currentKey = keyMatch[1];
    return line.replace(/href: '\/blog\/(?:([a-z]+)\/)?([^'/]+)\/'/g, (_match, maybeRegion: string, maybeSlug?: string) => {
      const preferred = KEY_REGION[currentKey];
      if (maybeSlug) return `href: '${canonicalHref(maybeSlug, preferred)}'`;
      return `href: '${canonicalHref(maybeRegion, preferred)}'`;
    });
  })
  .join('\n');

if (next === original) {
  console.log('case-study hrefs already canonical');
} else {
  fs.writeFileSync(TARGET, next);
  const count = (original.match(/href: '\/blog\/(?:[a-z]+\/)?[^'/]+\/'/g) || []).length;
  console.log(`rewrote ${count} case-study hrefs`);
}
