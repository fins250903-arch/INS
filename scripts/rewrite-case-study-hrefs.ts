/**
 * Rewrite curated LP case-study hrefs from /blog/{slug}/ to /blog/{region}/{slug}/.
 */
import fs from 'node:fs';
import path from 'node:path';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');
const TARGET = path.join(process.cwd(), 'src/data/lp-region-case-studies.ts');
const PREFERRED = ['osaka', 'fukuoka', 'hyougo', 'siga', 'saitama', 'aiti'];
const ALIASES: Record<string, string> = { gorudendog: 'gorudendog1', outo3: 'outo3-2' };

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

function canonicalHref(rawSlug: string): string {
  const slug = ALIASES[rawSlug] || rawSlug;
  const hits = bySlug.get(slug) || [];
  const preferred = PREFERRED.find((item) => hits.some((hit) => hit.region === item || hit.folder === item));
  const hit = hits.find((item) => item.region === preferred || item.folder === preferred) || hits[0];
  if (!hit) return `/blog/${slug}/`;
  return `/blog/${hit.region}/${slug}/`;
}

const original = fs.readFileSync(TARGET, 'utf8');
const next = original.replace(/href: '\/blog\/([^'/]+)\/'/g, (_match, slug) => {
  return `href: '${canonicalHref(slug)}'`;
});

if (next === original) {
  console.log('case-study hrefs already canonical');
} else {
  fs.writeFileSync(TARGET, next);
  const count = (original.match(/href: '\/blog\/[^'/]+\/'/g) || []).length;
  console.log(`rewrote ${count} case-study hrefs`);
}
