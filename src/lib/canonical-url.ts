import { SITE_CANONICAL_ORIGIN } from '../data/site';

/**
 * 正規 URL（trailing slash 付き）を生成する。
 * path が空または `/` のときはサイトトップ。
 */
export function canonicalUrl(path: string): string {
  const origin = SITE_CANONICAL_ORIGIN.replace(/\/$/, '');
  if (path === '/' || path === '') return `${origin}/`;
  const hashIndex = path.indexOf('#');
  const pathname = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex + 1).replace(/\/$/, '') : '';
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return hash ? `${origin}${withSlash}#${hash}` : `${origin}${withSlash}`;
}

/** JSON-LD @id 用（末尾スラッシュなしのページ URL） */
export function pageId(path: string): string {
  return canonicalUrl(path).replace(/\/$/, '');
}

export const SITE_WEBSITE_ID = `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/#website`;
export const SITE_ORGANIZATION_ID = `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/#organization`;

export { SITE_PERSON_IMAI_ID as SITE_PERSON_ID } from '../data/site';
