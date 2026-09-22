/**
 * Reads blog posts for the admin manager through the `blog` content collection.
 *
 * The collection is compiled into the build output, so this works identically on the Cloudflare
 * Workers runtime, where the repository files are not available on disk.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { toBlogMdPost, type BlogMdPost, type BlogRegionSlug } from './blog-md-store';

type BlogEntry = CollectionEntry<'blog'>;

function entrySlug(entry: BlogEntry): string {
  return (entry.id.split('/').pop() || entry.id).replace(/\.md$/, '');
}

function toPost(entry: BlogEntry): BlogMdPost {
  const { date, ...rest } = entry.data;
  return toBlogMdPost(
    entry.data.region as BlogRegionSlug,
    entrySlug(entry),
    entry.filePath ?? '',
    { ...rest, date: date instanceof Date ? date.toISOString().slice(0, 10) : date },
    entry.body ?? ''
  );
}

export async function getAllMdPosts(): Promise<BlogMdPost[]> {
  const entries = await getCollection('blog');
  return entries.map(toPost);
}

export async function getMdPost(region: string, slug: string): Promise<BlogMdPost | null> {
  const entries = await getCollection('blog');
  const match = entries.find(
    (entry) => entry.data.region === region && entrySlug(entry) === slug
  );
  return match ? toPost(match) : null;
}
