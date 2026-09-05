import type { BlogEntry } from './blog-content';
import { getBlogPath, getBlogSlug } from './blog-content';
import { getBlogTopic, BLOG_TOPICS, FEATURED_LP_SLUGS, type BlogTopic } from '../data/blog-topics';
import {
  replaceRegionPlaceholder,
  buildAnswerFirstMarkdown,
  upsertAnswerFirstBlock,
  hasAnswerFirstBlock,
  resolveLpHeadingHref
} from './blog-aio-text';

export type AioRelatedLink = {
  href: string;
  label: string;
  kind: 'blog' | 'lp';
};

export {
  replaceRegionPlaceholder,
  buildAnswerFirstMarkdown,
  upsertAnswerFirstBlock,
  hasAnswerFirstBlock,
  resolveLpHeadingHref
};

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item.href || seen.has(item.href)) continue;
    seen.add(item.href);
    result.push(item);
  }
  return result;
}

export function collectRelatedBlogLinks(input: {
  current: BlogEntry;
  allPosts: BlogEntry[];
  limit?: number;
}): AioRelatedLink[] {
  const limit = input.limit ?? 5;
  const currentSlug = getBlogSlug(input.current);
  const topic = getBlogTopic(currentSlug, input.current.data.title, input.current.data.categories);
  const currentPath = getBlogPath(input.current);

  const candidates: AioRelatedLink[] = [];

  for (const relatedSlug of topic.relatedSlugs) {
    if (relatedSlug === currentSlug) continue;
    const sameRegion = input.allPosts.find(
      (post) => getBlogSlug(post) === relatedSlug && post.data.region === input.current.data.region
    );
    const anyRegion = input.allPosts.find((post) => getBlogSlug(post) === relatedSlug);
    const hit = sameRegion || anyRegion;
    if (!hit) continue;
    const href = getBlogPath(hit);
    if (href === currentPath) continue;
    candidates.push({
      href,
      label: hit.data.title,
      kind: 'blog'
    });
  }

  if (candidates.length < limit) {
    const sameRegionOthers = input.allPosts
      .filter(
        (post) =>
          post.data.region === input.current.data.region && getBlogPath(post) !== currentPath
      )
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    for (const post of sameRegionOthers) {
      if (candidates.length >= limit) break;
      candidates.push({
        href: getBlogPath(post),
        label: post.data.title,
        kind: 'blog'
      });
    }
  }

  return uniqueByHref(candidates).slice(0, limit);
}

export function collectLpHeadingLinks(input: {
  slug: string;
  title?: string;
  categories?: string[];
  regionSlug: string;
  regionFull: string;
}): AioRelatedLink[] {
  const topic = getBlogTopic(input.slug, input.title, input.categories);
  return topic.lpHeadings.map((heading) => ({
    href: resolveLpHeadingHref(input.regionSlug, input.regionFull, heading),
    label: `${input.regionFull}「${heading.label}」`,
    kind: 'lp' as const
  }));
}

export function topicKeywords(topic: BlogTopic, regionFull: string): string {
  return [...topic.keywords, regionFull, '出張車内清掃'].join(',');
}

export function featuredFallbackSlugs(): string[] {
  return [...FEATURED_LP_SLUGS];
}

export { getBlogTopic, BLOG_TOPICS };
