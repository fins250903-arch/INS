import type { APIRoute } from 'astro';
import { isAuthorizedRequest } from '../../../../lib/admin-auth';
import { publishBlogImage } from '../../../../lib/blog-publish';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthorizedRequest(request, cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!allowed.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await publishBlogImage(file.name, buffer);

    return new Response(
      JSON.stringify({
        ok: true,
        path: result.path,
        mode: result.mode,
        message:
          result.mode === 'github'
            ? '画像をアップロードし、本番サイトへの反映を開始しました'
            : '画像をローカルに保存しました'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
