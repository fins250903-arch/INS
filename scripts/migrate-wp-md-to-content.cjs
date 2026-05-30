/**
 * WordPress 変換 MD（wp-convert1〜4）を Astro Content Collection へ移行する。
 *
 * Usage: node scripts/migrate-wp-md-to-content.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'src', 'content', 'blog');

const REGIONS = [
  {
    slug: 'fukuoka',
    regionFull: '福岡県',
    areaLabel: '福岡・九州エリア',
    sourceDir: 'wp-convert1'
  },
  {
    slug: 'osaka',
    regionFull: '大阪府',
    areaLabel: '大阪・近畿エリア',
    sourceDir: 'wp-convert2'
  },
  {
    slug: 'hyougo',
    regionFull: '兵庫県',
    areaLabel: '兵庫・近畿エリア',
    sourceDir: 'wp-convert3'
  },
  {
    slug: 'siga',
    regionFull: '滋賀県',
    areaLabel: '滋賀・近畿エリア',
    sourceDir: 'wp-convert4'
  }
];

function extractSlug(filePath) {
  const folderName = path.basename(path.dirname(filePath));
  const dateSlugMatch = folderName.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  if (dateSlugMatch) return dateSlugMatch[1];
  return folderName;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: raw.trim() };
  }

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let currentKey = null;
  let listValues = null;

  for (const line of lines) {
    const listItem = line.match(/^\s+-\s+"(.*)"\s*$/);
    if (listItem && currentKey && listValues) {
      listValues.push(listItem[1]);
      continue;
    }

    if (listValues && currentKey) {
      data[currentKey] = listValues;
      listValues = null;
      currentKey = null;
    }

    const scalar = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!scalar) continue;

    const [, key, valueRaw] = scalar;
    const value = valueRaw.trim();

    if (value === '') {
      currentKey = key;
      listValues = [];
      continue;
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      data[key] = value.slice(1, -1);
      continue;
    }

    data[key] = value;
  }

  if (listValues && currentKey) {
    data[currentKey] = listValues;
  }

  return { data, body: match[2].trim() };
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatDateValue(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text;
}

function serializeFrontmatter(data) {
  const lines = ['---'];

  const orderedKeys = [
    'title',
    'date',
    'region',
    'regionFull',
    'areaLabel',
    'thumbnail',
    'images',
    'draft',
    'categories',
    'tags',
    'canonicalUrl'
  ];

  for (const key of orderedKeys) {
    const value = data[key];
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${yamlQuote(item)}`);
      }
      continue;
    }

    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
      continue;
    }

    lines.push(`${key}: ${yamlQuote(value)}`);
  }

  lines.push('---');
  return lines.join('\n');
}

function findPostFiles(sourceRoot) {
  const postsRoot = path.join(sourceRoot, 'output', 'posts');
  if (!fs.existsSync(postsRoot)) return [];

  const results = [];
  const stack = [postsRoot];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '_drafts') continue;
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name === 'index.md') {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function normalizeThumbnail(data) {
  const candidate = data.thumbnail || data.coverImage || data.cover || '';
  if (!candidate) return '';
  const trimmed = String(candidate).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.replace(/^blog-images\//, '');
}

function normalizeBodyImages(body) {
  return body.replace(/(\]\(|!\[\]\()images\//g, '$1/blog-images/');
}

function migrateRegion(region) {
  const sourceRoot = path.join(ROOT, region.sourceDir);
  const files = findPostFiles(sourceRoot);
  const regionOutDir = path.join(OUTPUT_DIR, region.slug);
  fs.mkdirSync(regionOutDir, { recursive: true });

  let count = 0;

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = extractSlug(filePath);
    const outPath = path.join(regionOutDir, `${slug}.md`);

    const nextData = {
      title: data.title || slug,
      date: formatDateValue(data.date),
      region: region.slug,
      regionFull: region.regionFull,
      areaLabel: region.areaLabel,
      thumbnail: normalizeThumbnail(data),
      draft: false,
      categories: Array.isArray(data.categories) ? data.categories : [],
      tags: Array.isArray(data.tags) ? data.tags : []
    };

    if (Array.isArray(data.images) && data.images.length > 0) {
      nextData.images = data.images;
    }

    const content = `${serializeFrontmatter(nextData)}\n\n${normalizeBodyImages(body)}\n`;
    fs.writeFileSync(outPath, content, 'utf8');
    count += 1;
  }

  return count;
}

function main() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let total = 0;
  for (const region of REGIONS) {
    const count = migrateRegion(region);
    console.log(`${region.slug}: ${count} posts`);
    total += count;
  }

  console.log(`Done. Migrated ${total} posts to ${OUTPUT_DIR}`);
}

main();
