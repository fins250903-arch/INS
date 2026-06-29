import {
  buildPostMarkdown,
  saveMdPost,
  uploadBlogImage,
  type BlogMdPost
} from './blog-md-store';
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

export function canAutoPublish(): boolean {
  return isGitHubPublishConfigured();
}

export async function publishBlogPost(
  post: BlogMdPost,
  previousSlug?: string
): Promise<PublishResult> {
  const slug = post.urlSlug || post.slug;
  const filePath = `src/content/blog/${post.region}/${slug}.md`;
  const message = `Update ブログ記事 "${post.region}/${slug}"`;

  if (isGitHubPublishConfigured()) {
    const { commitSha } = await publishTextFile(filePath, buildPostMarkdown(post), message);

    if (previousSlug && previousSlug !== slug) {
      const oldPath = `src/content/blog/${post.region}/${previousSlug}.md`;
      await deleteRepoFile(oldPath, `Remove renamed blog post "${post.region}/${previousSlug}"`);
    }

    return {
      mode: 'github',
      slug,
      region: post.region,
      commitSha,
      published: !post.draft
    };
  }

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

  const path = uploadBlogImage(fileName, buffer);
  return { path, mode: 'local' };
}
