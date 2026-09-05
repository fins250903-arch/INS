/**
 * Prepend / refresh Answer-First AIO blocks on all published blog markdown files.
 * Idempotent: existing <!-- aio-answer-first --> blocks are replaced in place.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildAnswerFirstMarkdown, upsertAnswerFirstBlock } from '../src/lib/blog-aio-text.ts';

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

let updated = 0;
let skipped = 0;

for (const rel of listMarkdownFiles(BLOG_ROOT)) {
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
  const block = buildAnswerFirstMarkdown({
    slug: data.urlSlug || slug,
    title: data.title,
    categories,
    regionFull,
    regionSlug: region
  });
  const nextBody = upsertAnswerFirstBlock(body, block);
  const next = `${fmMatch[0].replace(/\r?\n$/, '\n\n')}${nextBody}`;
  if (next !== raw) {
    fs.writeFileSync(full, next);
    updated += 1;
  }
}

console.log(`blog:aio updated ${updated} files, skipped ${skipped}`);
