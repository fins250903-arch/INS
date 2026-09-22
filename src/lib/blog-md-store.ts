/**
 * Runtime-agnostic helpers for the markdown blog posts in src/content/blog.
 *
 * This module must stay free of Node built-ins so it can be bundled for the Cloudflare Workers
 * runtime. Reads go through blog-md-collection.ts, writes through blog-publish.ts.
 */
export type BlogRegionSlug = 'fukuoka' | 'osaka' | 'hyougo' | 'siga' | 'aiti' | 'saitama';

export interface BlogMdPost {
  region: BlogRegionSlug;
  slug: string;
  filePath: string;
  title: string;
  date: string;
  regionFull: string;
  areaLabel?: string;
  urlSlug?: string;
  thumbnail?: string;
  images?: string[];
  draft: boolean;
  categories: string[];
  tags: string[];
  body: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string;
    noindex?: boolean;
  };
  ogp?: {
    og_image?: string;
    og_type?: 'article' | 'website';
  };
  canonicalUrl?: string;
}

export function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: raw.trim() };
  }

  const data: Record<string, unknown> = {};
  const lines = match[1].split(/\r?\n/);
  let currentKey: string | null = null;
  let listValues: string[] | null = null;
  let nestedKey: string | null = null;
  let nestedObject: Record<string, unknown> | null = null;

  for (const line of lines) {
    const nestedScalar = line.match(/^\s{2}([A-Za-z0-9_]+):\s*(.*)$/);
    if (nestedScalar && nestedKey && nestedObject) {
      const [, key, valueRaw] = nestedScalar;
      nestedObject[key] = parseScalar(valueRaw.trim());
      continue;
    }

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentKey && listValues) {
      listValues.push(parseScalar(listItem[1]));
      continue;
    }

    if (listValues && currentKey) {
      data[currentKey] = listValues;
      listValues = null;
      currentKey = null;
    }

    if (nestedObject && nestedKey) {
      data[nestedKey] = nestedObject;
      nestedObject = null;
      nestedKey = null;
    }

    const objectStart = line.match(/^([A-Za-z0-9_]+):\s*$/);
    if (objectStart) {
      nestedKey = objectStart[1];
      nestedObject = {};
      continue;
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

    data[key] = parseScalar(value);
  }

  if (listValues && currentKey) {
    data[currentKey] = listValues;
  }
  if (nestedObject && nestedKey) {
    data[nestedKey] = nestedObject;
  }

  return { data, body: match[2].trim() };
}

function parseScalar(value: string): string | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return value;
}

function yamlQuote(value: string): string {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatDateValue(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text;
}

export function buildPostMarkdown(post: BlogMdPost): string {
  const slug = post.urlSlug || post.slug;
  return `${serializeFrontmatter({ ...post, urlSlug: slug, slug })}\n\n${post.body.trim()}\n`;
}

function serializeFrontmatter(data: BlogMdPost): string {
  const lines = ['---'];

  const pushScalar = (key: string, value: string | boolean | undefined) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
      return;
    }
    lines.push(`${key}: ${yamlQuote(value)}`);
  };

  const pushList = (key: string, values?: string[]) => {
    if (!values || values.length === 0) return;
    lines.push(`${key}:`);
    for (const item of values) {
      lines.push(`  - ${yamlQuote(item)}`);
    }
  };

  pushScalar('title', data.title);
  if (data.urlSlug) pushScalar('urlSlug', data.urlSlug);
  pushScalar('date', formatDateValue(data.date));
  pushScalar('region', data.region);
  pushScalar('regionFull', data.regionFull);
  if (data.areaLabel) pushScalar('areaLabel', data.areaLabel);
  if (data.thumbnail) pushScalar('thumbnail', data.thumbnail);
  pushList('images', data.images);
  pushScalar('draft', data.draft);
  pushList('categories', data.categories);
  pushList('tags', data.tags);
  if (data.canonicalUrl) pushScalar('canonicalUrl', data.canonicalUrl);

  if (data.seo && Object.keys(data.seo).length > 0) {
    lines.push('seo:');
    if (data.seo.meta_title) lines.push(`  meta_title: ${yamlQuote(data.seo.meta_title)}`);
    if (data.seo.meta_description) lines.push(`  meta_description: ${yamlQuote(data.seo.meta_description)}`);
    if (data.seo.keywords) lines.push(`  keywords: ${yamlQuote(data.seo.keywords)}`);
    if (data.seo.noindex !== undefined) lines.push(`  noindex: ${data.seo.noindex}`);
  }

  if (data.ogp && Object.keys(data.ogp).length > 0) {
    lines.push('ogp:');
    if (data.ogp.og_image) lines.push(`  og_image: ${yamlQuote(data.ogp.og_image)}`);
    if (data.ogp.og_type) lines.push(`  og_type: ${data.ogp.og_type}`);
  }

  lines.push('---');
  return lines.join('\n');
}

export function toBlogMdPost(
  region: BlogRegionSlug,
  slug: string,
  filePath: string,
  data: Record<string, unknown>,
  body: string
): BlogMdPost {
  return {
    region,
    slug,
    filePath,
    title: String(data.title || slug),
    date: formatDateValue(data.date),
    regionFull: String(data.regionFull || ''),
    areaLabel: data.areaLabel ? String(data.areaLabel) : undefined,
    urlSlug: data.urlSlug ? String(data.urlSlug) : slug,
    thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
    images: Array.isArray(data.images) ? data.images.map(String) : undefined,
    draft: data.draft === true,
    categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    body,
    seo: data.seo as BlogMdPost['seo'],
    ogp: data.ogp as BlogMdPost['ogp'],
    canonicalUrl: data.canonicalUrl ? String(data.canonicalUrl) : undefined
  };
}

export function sortMdPosts(
  posts: BlogMdPost[],
  order: 'desc' | 'asc' = 'desc'
): BlogMdPost[] {
  return [...posts].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return order === 'desc' ? diff : -diff;
  });
}

export function resolvePostThumbnail(post: BlogMdPost): string {
  const src = post.thumbnail || post.images?.[0] || '';
  const trimmed = String(src).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/blog-images/')) return trimmed;
  if (trimmed.startsWith('blog-images/')) return `/${trimmed}`;
  return `/blog-images/${trimmed.replace(/^\/+/, '')}`;
}
