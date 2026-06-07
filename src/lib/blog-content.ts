import { getCollection, type CollectionEntry } from 'astro:content';
import { BLOG_REGION_BY_SLUG, type BlogRegion } from '../data/blog-regions';
import { canonicalUrl } from './canonical-url';

export type BlogEntry = CollectionEntry<'blog'>;

export function getBlogSlug(entry: BlogEntry): string {
  const fileName = entry.id.split('/').pop() || entry.id;
  return fileName.replace(/\.md$/, '');
}

export function getBlogPath(entry: BlogEntry): string {
  const region = entry.data.region;
  const slug = getBlogSlug(entry);
  return `/blog/${region}/${slug}/`;
}

export function resolveBlogImage(src?: string | null): string {
  const trimmed = String(src || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/blog-images/')) return trimmed;
  if (trimmed.startsWith('blog-images/')) return `/${trimmed}`;
  if (trimmed.startsWith('/')) {
    const name = trimmed.split('/').pop() || trimmed;
    return `/blog-images/${name}`;
  }
  return `/blog-images/${trimmed.replace(/^blog-images\//, '')}`;
}

export function resolveBlogCanonical(entry: BlogEntry, pathname?: string): string {
  if (entry.data.canonicalUrl) return entry.data.canonicalUrl;
  if (pathname) return canonicalUrl(pathname);
  return canonicalUrl(getBlogPath(entry));
}

export function formatBlogDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
}

export function formatBlogDateLong(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export async function getPublishedBlogPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection('blog');
  return posts
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function groupPostsByRegion(posts: BlogEntry[]): Map<string, BlogEntry[]> {
  const grouped = new Map<string, BlogEntry[]>();
  for (const post of posts) {
    const key = post.data.region;
    const list = grouped.get(key) || [];
    list.push(post);
    grouped.set(key, list);
  }
  return grouped;
}

export function getRegionMeta(entry: BlogEntry): BlogRegion {
  return BLOG_REGION_BY_SLUG[entry.data.region];
}

export function getAreaLabel(entry: BlogEntry): string {
  return entry.data.areaLabel || entry.data.regionFull;
}

export async function getPostsForRegion(regionSlug: string): Promise<BlogEntry[]> {
  const posts = await getPublishedBlogPosts();
  return posts.filter((entry) => entry.data.region === regionSlug);
}

export async function getPostsForCategory(category: string): Promise<BlogEntry[]> {
  const posts = await getPublishedBlogPosts();
  return posts.filter((entry) => entry.data.categories.includes(category));
}

export function getAllBlogCategories(posts: BlogEntry[]): string[] {
  return Array.from(new Set(posts.flatMap((entry) => entry.data.categories))).sort();
}

export async function findPostsBySlug(slug: string): Promise<BlogEntry[]> {
  const posts = await getPublishedBlogPosts();
  return posts.filter((entry) => getBlogSlug(entry) === slug);
}
