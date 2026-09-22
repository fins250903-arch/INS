import { buildPostMarkdown, type BlogMdPost } from './blog-md-store';
import {
  deleteRepoFile,
  isGitHubPublishConfigured,
  publishBinaryFile,
  publishTextFile
} from './github-publisher';

export type PublishResult = {
  mode: 'github' | 'local';
  slug: string;
  region: string;
  commitSha?: string;
  published: boolean;
};

const postPath = (region: string, slug: string) => `src/content/blog/${region}/${slug}.md`;

/**
 * Writing straight to the working tree only works under `astro dev`, which runs in Node. The
 * deployed Cloudflare Worker has no writable filesystem, so there publishing needs the GitHub token.
 */
export const canWriteToWorkingTree = import.meta.env.DEV;

function requireWritableTarget(): void {
  if (canWriteToWorkingTree) return;
  throw new Error(
    'ブログの保存先が設定されていません。Cloudflare Worker はリポジトリを直接書き換えられないため、' +
      'シークレット BLOG_PUBLISH_GITHUB_TOKEN を設定してください。'
  );
}

export function canAutoPublish(): boolean {
  return isGitHubPublishConfigured();
}

export async function publishBlogPost(
  post: BlogMdPost,
  previousSlug?: string
): Promise<PublishResult> {
  const slug = post.urlSlug || post.slug;
  const filePath = postPath(post.region, slug);
  const message = `Update ブログ記事 "${post.region}/${slug}"`;

  if (isGitHubPublishConfigured()) {
    const { commitSha } = await publishTextFile(filePath, buildPostMarkdown(post), message);

    if (previousSlug && previousSlug !== slug) {
      await deleteRepoFile(
        postPath(post.region, previousSlug),
        `Remove renamed blog post "${post.region}/${previousSlug}"`
      );
    }

    return {
      mode: 'github',
      slug,
      region: post.region,
      commitSha,
      published: !post.draft
    };
  }

  requireWritableTarget();
  const { saveMdPost } = await import('./blog-md-fs');
  const success = saveMdPost(post, previousSlug);
  if (!success) {
    throw new Error('Failed to save post locally');
  }

  return {
    mode: 'local',
    slug,
    region: post.region,
    published: !post.draft
  };
}

export async function deleteBlogPost(
  region: string,
  slug: string
): Promise<{ mode: 'github' | 'local' }> {
  if (isGitHubPublishConfigured()) {
    await deleteRepoFile(postPath(region, slug), `Delete ブログ記事 "${region}/${slug}"`);
    return { mode: 'github' };
  }

  requireWritableTarget();
  const { deleteMdPost } = await import('./blog-md-fs');
  deleteMdPost(region, slug);
  return { mode: 'local' };
}

export async function publishBlogImage(
  fileName: string,
  buffer: Buffer
): Promise<{ path: string; mode: 'github' | 'local'; commitSha?: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const repoPath = `public/blog-images/${safeName}`;
  const publicPath = `/blog-images/${safeName}`;

  if (isGitHubPublishConfigured()) {
    const { commitSha } = await publishBinaryFile(
      repoPath,
      buffer,
      `Add blog image "${safeName}"`
    );
    return { path: publicPath, mode: 'github', commitSha };
  }

  requireWritableTarget();
  const { uploadBlogImage } = await import('./blog-md-fs');
  return { path: uploadBlogImage(fileName, buffer), mode: 'local' };
}
