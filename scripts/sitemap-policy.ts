/**
 * Build-time sitemap rules. Imported from astro.config only (uses node:fs).
 * Keeps redirected URLs and retired Hiroshima pages out of the sitemap, and
 * stamps blog URLs with the article date instead of the build clock.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createMatcher, type RedirectRule } from '../workers/legacy-redirects/src/match';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ORIGIN = 'https://insbs.net';
const APEX_HOST = 'insbs.net';

const redirectRules = (
  JSON.parse(readFileSync(path.join(ROOT, 'redirects.config.json'), 'utf8')) as {
    rules: RedirectRule[];
  }
).rules.filter((rule) => !rule.host);

const matchApexRedirect = createMatcher(redirectRules);

function isLegacyBlogSlugPage(pathname: string): boolean {
  // `/blog/{slug}/` is a redirect to `/blog/{region}/{slug}/`. Real posts have two segments.
  return /^\/blog\/[^/]+\/$/.test(pathname);
}

export function includeInSitemap(pageUrl: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(pageUrl).pathname;
  } catch {
    return false;
  }

  if (
    pathname.includes('/admin') ||
    pathname.includes('/thanks') ||
    pathname.includes('/compare') ||
    pathname.includes('/okayama') ||
    pathname.toLowerCase().includes('hirosima')
  ) {
    return false;
  }

  if (isLegacyBlogSlugPage(pathname)) return false;
  if (matchApexRedirect(APEX_HOST, pathname)) return false;
  return true;
}

function frontmatterValue(block: string, key: string): string | undefined {
  const matched = block.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)`, 'm'));
  return matched?.[1]?.trim();
}

function walkMarkdown(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(full, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function loadBlogLastmod(): Map<string, string> {
  const dates = new Map<string, string>();
  const root = path.join(ROOT, 'src/content/blog');
  for (const file of walkMarkdown(root)) {
    const raw = readFileSync(file, 'utf8');
    const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;
    const block = frontmatter[1];
    if (frontmatterValue(block, 'draft') === 'true') continue;
    const region = frontmatterValue(block, 'region');
    const published = frontmatterValue(block, 'date')?.slice(0, 10);
    const updated = frontmatterValue(block, 'updatedDate')?.slice(0, 10);
    const stamp = updated && /^\d{4}-\d{2}-\d{2}$/.test(updated) ? updated : published;
    if (!region || !stamp || !/^\d{4}-\d{2}-\d{2}$/.test(stamp)) continue;
    const slug = path.basename(file, '.md');
    dates.set(`${SITE_ORIGIN}/blog/${region}/${slug}/`, stamp);
  }
  return dates;
}

const blogLastmod = loadBlogLastmod();

export function sitemapLastmod(pageUrl: string): string | undefined {
  return blogLastmod.get(pageUrl);
}
