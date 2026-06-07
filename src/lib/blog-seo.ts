import type { BlogEntry } from './blog-content';
import { resolveBlogCanonical, resolveBlogImage } from './blog-content';
import { canonicalUrl } from './canonical-url';
import { SITE_CANONICAL_ORIGIN } from '../data/site';

const SITE_TITLE_SUFFIX = '｜アイエヌエス車内清掃';

export type BlogSeoMeta = {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  noindex: boolean;
  ogImage?: string;
  ogType: 'article' | 'website';
};

export function resolveAbsoluteBlogImageUrl(src?: string | null): string {
  const relative = resolveBlogImage(src);
  if (!relative) return '';
  if (/^https?:\/\//i.test(relative)) return relative;
  const origin = SITE_CANONICAL_ORIGIN.replace(/\/$/, '');
  return `${origin}${relative.startsWith('/') ? relative : `/${relative}`}`;
}

/** Resolve head meta from Decap CMS seo / ogp frontmatter with sensible fallbacks. */
export function resolveBlogSeoMeta(entry: BlogEntry, pagePath: string): BlogSeoMeta {
  const seo = entry.data.seo;
  const ogp = entry.data.ogp;

  const title = seo?.meta_title?.trim() || `${entry.data.title}${SITE_TITLE_SUFFIX}`;
  const description =
    seo?.meta_description?.trim() ||
    `${entry.data.title}（${entry.data.regionFull}）${SITE_TITLE_SUFFIX}`;

  const ogImageSrc = ogp?.og_image?.trim() || entry.data.thumbnail?.trim() || '';
  const ogImage = ogImageSrc ? resolveAbsoluteBlogImageUrl(ogImageSrc) : undefined;

  return {
    title,
    description,
    canonical: resolveBlogCanonical(entry, pagePath),
    keywords: seo?.keywords?.trim() || undefined,
    noindex: seo?.noindex === true,
    ogImage,
    ogType: ogp?.og_type ?? 'article'
  };
}
