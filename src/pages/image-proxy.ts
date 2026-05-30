import type { APIRoute } from 'astro';

const ALLOWED_HOST_SUFFIX = '.insbs.net';

async function fetchUpstreamImage(urlString: string): Promise<Response> {
  const parsed = new URL(urlString);
  const origin = `${parsed.protocol}//${parsed.host}`;
  return fetch(urlString, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      referer: `${origin}/`
    }
  });
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const source = url.searchParams.get('url');
    if (!source) {
      return new Response('Missing url query', { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(source);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    if (!/^https?:$/.test(parsed.protocol)) {
      return new Response('Unsupported protocol', { status: 400 });
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== 'insbs.net' && !hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
      return new Response('Host not allowed', { status: 403 });
    }

    const candidates = [parsed.toString()];
    if (parsed.protocol === 'https:') {
      const httpUrl = new URL(parsed.toString());
      httpUrl.protocol = 'http:';
      candidates.push(httpUrl.toString());
    }

    let upstream: Response | null = null;
    let lastError: unknown = null;
    for (const candidate of candidates) {
      try {
        const res = await fetchUpstreamImage(candidate);
        if (res.ok) {
          upstream = res;
          break;
        }
        upstream = res;
      } catch (err) {
        lastError = err;
      }
    }

    if (!upstream || !upstream.ok) {
      const msg = lastError instanceof Error ? lastError.message : 'Upstream fetch failed';
      return new Response(msg, { status: upstream?.status || 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const cacheControl = upstream.headers.get('cache-control') || 'public, max-age=86400';
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': cacheControl
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image proxy internal error';
    return new Response(msg, { status: 500 });
  }
};
