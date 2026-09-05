/**
 * Prepend / refresh Answer-First AIO blocks and rewrite legacy WordPress URLs.
 * Idempotent: existing <!-- aio-answer-first --> blocks are replaced in place.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getBlogTopic } from '../src/data/blog-topics.ts';
import {
  buildAnswerFirstMarkdown,
  rewriteInternalBlogHrefs,
  rewriteLegacyUrls,
  upsertAnswerFirstBlock,
  type RelatedPostLink
} from '../src/lib/blog-aio-text.ts';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');

function listMarkdownFiles(dir: string, base = dir): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(full, base));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return files;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  categories: string[];
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, categories: [], body: raw };

  const data: Record<string, string> = {};
  const categories: string[] = [];
  let inCategories = false;

  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && inCategories) {
      categories.push(unquote(listItem[1]));
      continue;
    }
    const scalar = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!scalar) continue;
    inCategories = scalar[1] === 'categories';
    if (scalar[2].trim()) data[scalar[1]] = unquote(scalar[2]);
  }

  return { data, categories, body: match[2] };
}

function indexPosts(files: string[]): Map<string, { region: string; slug: string; title: string }[]> {
  const bySlug = new Map<string, { region: string; slug: string; title: string }[]>();
  for (const rel of files) {
    const parts = rel.split('/');
    const slug = (parts[parts.length - 1] || '').replace(/\.md$/, '');
    if (!slug) continue;
    const raw = fs.readFileSync(path.join(BLOG_ROOT, rel), 'utf8');
    const { data } = parseFrontmatter(raw);
    const region = data.region || parts[0];
    const title = data.title || slug;
    const list = bySlug.get(slug) || [];
    list.push({ region, slug, title });
    bySlug.set(slug, list);
  }
  return bySlug;
}

function relatedFor(
  slug: string,
  region: string,
  title: string | undefined,
  categories: string[],
  index: Map<string, { region: string; slug: string; title: string }[]>
): RelatedPostLink[] {
  const topic = getBlogTopic(slug, title, categories);
  const links: RelatedPostLink[] = [];
  const used = new Set<string>();

  const push = (item: { region: string; slug: string; title: string }) => {
    const href = `/blog/${item.region}/${item.slug}/`;
    if (item.slug === slug || used.has(href)) return false;
    used.add(href);
    links.push({ href, label: item.title });
    return true;
  };

  for (const relatedSlug of topic.relatedSlugs) {
    if (links.length >= 4) break;
    const matches = index.get(relatedSlug) || [];
    const hit = matches.find((item) => item.region === region) || matches[0];
    if (hit) push(hit);
  }

  if (links.length < 3) {
    for (const matches of index.values()) {
      for (const item of matches) {
        if (item.region !== region) continue;
        push(item);
        if (links.length >= 4) break;
      }
      if (links.length >= 4) break;
    }
  }

  if (links.length < 3) {
    for (const matches of index.values()) {
      for (const item of matches) {
        push(item);
        if (links.length >= 4) break;
      }
      if (links.length >= 4) break;
    }
  }

  return links;
}

const files = listMarkdownFiles(BLOG_ROOT);
const index = indexPosts(files);

let updated = 0;
let skipped = 0;

for (const rel of files) {
  const parts = rel.split('/');
  const fileName = parts[parts.length - 1];
  const slug = fileName.replace(/\.md$/, '');
  if (!slug) {
    skipped += 1;
    continue;
  }

  const full = path.join(BLOG_ROOT, rel);
  const raw = fs.readFileSync(full, 'utf8');
  const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!fmMatch) {
    skipped += 1;
    continue;
  }

  const { data, categories, body } = parseFrontmatter(raw);
  const region = data.region || parts[0];
  const regionFull = data.regionFull || '';
  const topicSlug = data.urlSlug || slug;
  const block = buildAnswerFirstMarkdown({
    slug: topicSlug,
    title: data.title,
    categories,
    regionFull,
    regionSlug: region,
    relatedPosts: relatedFor(slug, region, data.title, categories, index)
  });
  const withAnswer = upsertAnswerFirstBlock(body, block);
  const withLegacy = rewriteLegacyUrls(withAnswer, region);
  const nextBody = rewriteInternalBlogHrefs(withLegacy, (relatedSlug, preferredRegion) => {
    const matches = index.get(relatedSlug) || [];
    if (matches.length === 0) return null;
    const preferred = ['osaka', 'fukuoka', 'hyougo', 'siga', 'saitama', 'aiti'];
    const hit =
      matches.find((item) => item.region === preferredRegion) ||
      preferred.map((item) => matches.find((entry) => entry.region === item)).find(Boolean) ||
      matches[0];
    return hit ? { region: hit.region, slug: hit.slug } : null;
  });
  const next = `${fmMatch[0].replace(/\r?\n$/, '\n\n')}${nextBody}`;
  if (next !== raw) {
    fs.writeFileSync(full, next);
    updated += 1;
  }
}

console.log(`blog:aio updated ${updated} files, skipped ${skipped}`);
