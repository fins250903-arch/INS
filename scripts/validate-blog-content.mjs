/**
 * Validates Astro blog content produced by Decap CMS.
 * Fails CI when paths or frontmatter do not match src/content.config.ts.
 */
import fs from 'fs';
import path from 'path';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');
const REGIONS = new Set(['fukuoka', 'osaka', 'hyougo', 'siga']);
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const REGION_DIR_RE = /^[a-z]+\//;

function listMarkdownFiles(dir, base = dir) {
  const files = [];
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

function listStrayImages(dir, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listStrayImages(full, base, acc);
      continue;
    }
    if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
      acc.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return acc;
}

function parseSimpleFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { error: 'missing frontmatter' };
  const block = match[1];
  const data = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    data[key] = value.trim();
  }
  return { data };
}

const errors = [];

for (const rel of listStrayImages(BLOG_ROOT)) {
  errors.push(`Stray image in blog folder (move to public/blog-images/): ${rel}`);
}

for (const rel of listMarkdownFiles(BLOG_ROOT)) {
  if (rel.includes('/index.md') || rel.endsWith('/index')) {
    errors.push(`Invalid Decap nested path (use region/slug.md): ${rel}`);
  }

  const parts = rel.split('/');
  const region = parts[0];
  if (!REGIONS.has(region)) {
    errors.push(`Invalid region folder "${region}" in ${rel} (expected: ${[...REGIONS].join(', ')})`);
  }

  if (parts.length !== 2) {
    errors.push(`Invalid path depth (expected region/slug.md): ${rel}`);
  }

  if (/^\d{4}\//.test(rel) || /\/\d{4}-\d{2}-\d{2}-/.test(rel)) {
    errors.push(`Date-based path not supported by Astro blog routes: ${rel}`);
  }

  const full = path.join(BLOG_ROOT, rel);
  const raw = fs.readFileSync(full, 'utf8');
  const { data, error } = parseSimpleFrontmatter(raw);
  if (error) {
    errors.push(`${rel}: ${error}`);
    continue;
  }

  if (!data.title) errors.push(`${rel}: missing title`);
  if (!data.date) errors.push(`${rel}: missing date`);
  if (!data.region) errors.push(`${rel}: missing region`);
  else if (!REGIONS.has(data.region)) errors.push(`${rel}: invalid region "${data.region}"`);
  if (!data.regionFull) errors.push(`${rel}: missing regionFull`);
}

if (errors.length) {
  console.error('Blog content validation failed:\n');
  for (const msg of errors) console.error(`  - ${msg}`);
  console.error('\nFix in Decap CMS (/admin) or move images to public/blog-images/.');
  process.exit(1);
}

console.log('Blog content validation passed.');
