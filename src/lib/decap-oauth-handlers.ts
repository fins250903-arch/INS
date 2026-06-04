import type { APIRoute } from 'astro';
import {
  buildGitHubAuthorizeUrl,
  exchangeGitHubCode,
  getDecapOAuthConfig,
  renderDecapOAuthCallbackHtml
} from './decap-oauth';

export function createDecapAuthRoute(callbackPath: string): APIRoute {
  return {
    prerender: false,
    GET: async ({ request }) => {
      const config = getDecapOAuthConfig(request, callbackPath);
      if (!config) {
        return new Response(
          'Decap OAuth is not configured. Set DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET on Vercel.',
          { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }
        );
      }

      const state = crypto.randomUUID();
      const authorizeUrl = buildGitHubAuthorizeUrl(config, state);

      return new Response(null, {
        status: 302,
        headers: { Location: authorizeUrl }
      });
    }
  };
}

export function createDecapCallbackRoute(callbackPath: string): APIRoute {
  return {
    prerender: false,
    GET: async ({ request, url }) => {
      const config = getDecapOAuthConfig(request, callbackPath);
      if (!config) {
        return new Response('Decap OAuth is not configured.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        const html = renderDecapOAuthCallbackHtml('error', error);
        return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }

      if (!code) {
        const html = renderDecapOAuthCallbackHtml('error', 'Missing authorization code');
        return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }

      const result = await exchangeGitHubCode(config, code);
      if ('error' in result) {
        const html = renderDecapOAuthCallbackHtml('error', result.error);
        return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }

      const html = renderDecapOAuthCallbackHtml('success', {
        token: result.accessToken,
        provider: 'github'
      });

      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
  };
}
