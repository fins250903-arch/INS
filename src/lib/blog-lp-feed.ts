import type { CaseStudiesBlock } from '../data/lp-region-case-studies';
import { BLOG_REGION_BY_SLUG, BLOG_REGION_SLUGS } from '../data/blog-regions';
import { FEATURED_LP_SLUGS } from '../data/blog-topics';

type FeedPost = {
  id: string;
  data: {
    title: string;
    date: Date;
    region: string;
    regionFull: string;
    categories?: string[];
  };
};

function entrySlug(post: FeedPost): string {
  return (post.id.split('/').pop() || post.id).replace(/\.md$/, '');
}

function entryPath(post: FeedPost): string {
  return `/blog/${post.data.region}/${entrySlug(post)}/`;
}

const CHIIKI_CATEGORY_ALIASES: Record<string, string[]> = {
  osaka: ['osaka', 'oosaka', '大阪', '大阪府'],
  fukuoka: ['fukuoka', '福岡', '福岡県'],
  hyougo: ['hyougo', 'hyogo', '兵庫', '兵庫県'],
  siga: ['siga', 'shiga', '滋賀', '滋賀県'],
  aiti: ['aiti', 'aichi', '愛知', '愛知県', '名古屋'],
  saitama: ['saitama', '埼玉', '埼玉県'],
  tokyou: ['tokyou', 'tokyo', '東京', '東京都'],
  kanagawa: ['kanagawa', '神奈川', '神奈川県'],
  tiba: ['tiba', 'chiba', '千葉', '千葉県'],
  kyouto: ['kyouto', 'kyoto', '京都', '京都府'],
  nara: ['nara', '奈良', '奈良県'],
  mie: ['mie', '三重', '三重県'],
  gifu: ['gifu', '岐阜', '岐阜県'],
  sizuoka: ['sizuoka', 'shizuoka', '静岡', '静岡県'],
  okinawa: ['okinawa', '沖縄', '沖縄県'],
  ibaraki: ['ibaraki', '茨城', '茨城県'],
  gunnma: ['gunnma', 'gunma', '群馬', '群馬県']
};

export type LpBlogMatchReason = 'region' | 'regionFull' | 'category' | 'featured';

export type LpBlogFeedItem = {
  post: FeedPost;
  href: string;
  reason: LpBlogMatchReason;
  score: number;
};

function categoryHaystack(post: FeedPost): string {
  return (post.data.categories || []).join(' ').toLowerCase();
}

function scorePostForRegion(
  post: FeedPost,
  opts: { regionSlug?: string; regionName: string; regionFull: string }
): { score: number; reason: LpBlogMatchReason } | null {
  const regionSlug = opts.regionSlug || '';
  const aliases = CHIIKI_CATEGORY_ALIASES[regionSlug] || [];
  const cats = categoryHaystack(post);
  const regionFull = opts.regionFull.trim();
  const regionName = opts.regionName.trim();

  const hostPrefecture = BLOG_REGION_BY_SLUG[post.data.region]?.regionFull;
  const postPrefecture = post.data.regionFull.trim();
  const strip = (value: string) => value.replace(/[都道府県]$/, '');

  if (regionFull && postPrefecture === regionFull) {
    return { score: 100, reason: 'regionFull' };
  }
  if (regionName && postPrefecture && strip(postPrefecture) === strip(regionName)) {
    return { score: 95, reason: 'regionFull' };
  }
  if (regionSlug && post.data.region === regionSlug) {
    if (!postPrefecture || postPrefecture === hostPrefecture || postPrefecture === regionFull) {
      return { score: 90, reason: 'region' };
    }
  }
  if (aliases.some((alias) => cats.includes(alias.toLowerCase()) || post.data.regionFull.includes(alias))) {
    return { score: 50, reason: 'category' };
  }
  return null;
}

function pickFeatured(posts: FeedPost[], regionSlug?: string): FeedPost[] {
  const result: FeedPost[] = [];
  for (const slug of FEATURED_LP_SLUGS) {
    const matches = posts.filter((post) => entrySlug(post) === slug);
    const preferred =
      matches.find((post) => post.data.region === regionSlug) ||
      matches.find((post) => post.data.region === 'osaka') ||
      matches.find((post) => post.data.region === 'fukuoka') ||
      matches[0];
    if (preferred) result.push(preferred);
  }
  return result;
}

export function selectPostsForRegionLp(
  posts: FeedPost[],
  opts: { regionSlug?: string; regionName: string; regionFull: string; limit?: number }
): LpBlogFeedItem[] {
  const limit = opts.limit ?? 8;
  const scored: LpBlogFeedItem[] = [];

  for (const post of posts) {
    const hit = scorePostForRegion(post, opts);
    if (!hit) continue;
    scored.push({
      post,
      href: entryPath(post),
      reason: hit.reason,
      score: hit.score
    });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return b.post.data.date.getTime() - a.post.data.date.getTime();
  });

  const seen = new Set<string>();
  const selected: LpBlogFeedItem[] = [];
  for (const item of scored) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    selected.push(item);
  }

  if (selected.length < 4) {
    for (const post of pickFeatured(posts, opts.regionSlug)) {
      const href = entryPath(post);
      if (seen.has(href)) continue;
      seen.add(href);
      selected.push({ post, href, reason: 'featured', score: 10 });
    }
  }

  return selected.slice(0, limit);
}

export async function prepareRegionLpContent(opts: {
  regionSlug?: string;
  regionName: string;
  regionFull: string;
  caseStudies?: CaseStudiesBlock;
  limit?: number;
}): Promise<{
  feed: LpBlogFeedItem[];
  caseStudies?: CaseStudiesBlock;
}> {
  const { getPublishedBlogPosts } = await import('./blog-content');
  const posts = await getPublishedBlogPosts();
  const feed = selectPostsForRegionLp(posts, opts);
  const caseStudies = opts.caseStudies
    ? mergeLatestPostsIntoCaseStudies(opts.caseStudies, feed)
    : undefined;
  return { feed, caseStudies };
}

export function mergeLatestPostsIntoCaseStudies(
  block: CaseStudiesBlock,
  feed: LpBlogFeedItem[],
  limit = 3
): CaseStudiesBlock {
  const existing = new Set(block.items.map((item) => item.href.replace(/\/$/, '')));
  const extras = feed
    .filter((item) => item.reason !== 'featured')
    .filter((item) => {
      const href = item.href.replace(/\/$/, '');
      const slugOnly = `/blog/${entrySlug(item.post)}`;
      return !existing.has(href) && !existing.has(slugOnly);
    })
    .slice(0, limit)
    .map((item) => ({
      body: `${item.post.data.regionFull}の最新ブログです。公開後の地区LPに自動掲載しています。`,
      linkLabel: item.post.data.title,
      href: item.href
    }));

  if (extras.length === 0) return block;

  return {
    ...block,
    items: [...extras, ...block.items]
  };
}

export function isBlogHostRegion(regionSlug?: string): boolean {
  return Boolean(regionSlug && (BLOG_REGION_SLUGS as string[]).includes(regionSlug));
}
