import type { APIRoute } from 'astro';
import { isAuthorizedRequest } from '../../../../lib/admin-auth';
import { uploadBlogImage } from '../../../../lib/blog-md-store';

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
    const path = uploadBlogImage(file.name, buffer);

    return new Response(JSON.stringify({ ok: true, path }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 });
  }
};
