import { SITE_CANONICAL_ORIGIN } from '../data/site';

/**
 * 正規 URL（trailing slash 付き）を生成する。
 * path が空または `/` のときはサイトトップ。
 */
export function canonicalUrl(path: string): string {
  const origin = SITE_CANONICAL_ORIGIN.replace(/\/$/, '');
  if (path === '/' || path === '') return `${origin}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return `${origin}${withSlash}`;
}

/** JSON-LD @id 用（末尾スラッシュなしのページ URL） */
export function pageId(path: string): string {
  return canonicalUrl(path).replace(/\/$/, '');
}

export const SITE_WEBSITE_ID = `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/#website`;
export const SITE_ORGANIZATION_ID = `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/#organization`;
