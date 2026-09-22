/**
 * Filesystem fallback used when GitHub publishing is not configured, i.e. during local development.
 *
 * Node built-ins are unavailable on the Cloudflare Workers runtime, so this module must only ever be
 * imported dynamically from blog-publish.ts after `isGitHubPublishConfigured()` returned false.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildPostMarkdown, type BlogMdPost } from './blog-md-store';

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'blog-images');

export function saveMdPost(post: BlogMdPost, previousSlug?: string): boolean {
  try {
    const slug = post.urlSlug || post.slug;
    const regionDir = path.join(BLOG_DIR, post.region);
    fs.mkdirSync(regionDir, { recursive: true });

    const newPath = path.join(regionDir, `${slug}.md`);
    fs.writeFileSync(newPath, buildPostMarkdown(post), 'utf-8');

    if (previousSlug && previousSlug !== slug) {
      const oldPath = path.join(regionDir, `${previousSlug}.md`);
      if (fs.existsSync(oldPath) && oldPath !== newPath) {
        fs.unlinkSync(oldPath);
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving post:', error);
    return false;
  }
}

export function deleteMdPost(region: string, slug: string): boolean {
  try {
    const filePath = path.join(BLOG_DIR, region, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

export function uploadBlogImage(fileName: string, buffer: Buffer): string {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const destPath = path.join(IMAGES_DIR, safeName);
  fs.writeFileSync(destPath, buffer);
  return `/blog-images/${safeName}`;
}
