import type { APIRoute } from 'astro';
import { isAuthorizedRequest } from '../../../../lib/admin-auth';
import { saveMdPost, type BlogMdPost } from '../../../../lib/blog-md-store';

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

    const success = saveMdPost(post, previousSlug);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to save post' }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        slug: post.urlSlug || post.slug,
        region: post.region
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Save post error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
};
