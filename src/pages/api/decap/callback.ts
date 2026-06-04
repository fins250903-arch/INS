import type { APIRoute } from 'astro';
import {
  exchangeGitHubCode,
  getDecapOAuthConfig,
  renderDecapOAuthCallbackHtml
} from '../../../lib/decap-oauth';

export const GET: APIRoute = async ({ request, url }) => {
  const config = getDecapOAuthConfig(request);
  if (!config) {
    return new Response('Decap OAuth is not configured.', { status: 503 });
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    const html = renderDecapOAuthCallbackHtml('error', { message: error });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  if (!code) {
    const html = renderDecapOAuthCallbackHtml('error', { message: 'Missing authorization code' });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const result = await exchangeGitHubCode(config, code);
  if ('error' in result) {
    const html = renderDecapOAuthCallbackHtml('error', { message: result.error });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const html = renderDecapOAuthCallbackHtml('success', {
    token: result.accessToken,
    provider: 'github'
  });

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
