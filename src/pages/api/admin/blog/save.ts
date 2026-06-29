import type { APIRoute } from 'astro';
import { isAuthorizedRequest } from '../../../../lib/admin-auth';
import { publishBlogPost } from '../../../../lib/blog-publish';
import type { BlogMdPost } from '../../../../lib/blog-md-store';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorizedRequest(request, cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const payload = (await request.json()) as BlogMdPost & { previousSlug?: string };
    const { previousSlug, ...post } = payload;

    if (!post.title?.trim() || !post.region || !post.slug) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const result = await publishBlogPost(post, previousSlug);

    return new Response(
      JSON.stringify({
        ok: true,
        slug: result.slug,
        region: result.region,
        mode: result.mode,
        published: result.published,
        commitSha: result.commitSha,
        message:
          result.mode === 'github'
            ? result.published
              ? '記事を保存し、本番サイトへの公開を開始しました（1〜3分で反映されます）'
              : '下書きとして保存しました（本番サイトへの反映を開始しました）'
            : '記事をローカルに保存しました（GitHubトークン未設定のため自動公開されません）'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Save post error:', error);
    const message = error instanceof Error ? error.message : 'Save failed';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
