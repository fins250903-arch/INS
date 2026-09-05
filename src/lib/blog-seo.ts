import type { BlogEntry } from './blog-content';
import { getBlogSlug, resolveBlogCanonical, resolveBlogImage } from './blog-content';
import { SITE_CANONICAL_ORIGIN } from '../data/site';
import { getBlogTopic } from '../data/blog-topics';
import { replaceRegionPlaceholder } from './blog-aio-text';

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

function topicFallbackDescription(entry: BlogEntry): string {
  const topic = getBlogTopic(getBlogSlug(entry), entry.data.title, entry.data.categories);
  return replaceRegionPlaceholder(topic.answer, entry.data.regionFull);
}

/** Resolve head meta from Decap CMS seo / ogp frontmatter with sensible fallbacks. */
export function resolveBlogSeoMeta(entry: BlogEntry, pagePath: string): BlogSeoMeta {
  const seo = entry.data.seo;
  const ogp = entry.data.ogp;
  const topic = getBlogTopic(getBlogSlug(entry), entry.data.title, entry.data.categories);

  const title = seo?.meta_title?.trim() || `${entry.data.title}${SITE_TITLE_SUFFIX}`;
  const description = seo?.meta_description?.trim() || topicFallbackDescription(entry);

  const ogImageSrc = ogp?.og_image?.trim() || entry.data.thumbnail?.trim() || '';
  const ogImage = ogImageSrc ? resolveAbsoluteBlogImageUrl(ogImageSrc) : undefined;

  return {
    title,
    description,
    canonical: resolveBlogCanonical(entry, pagePath),
    keywords: seo?.keywords?.trim() || [...topic.keywords, entry.data.regionFull].join(','),
    noindex: seo?.noindex === true,
    ogImage,
    ogType: ogp?.og_type ?? 'article'
  };
}
