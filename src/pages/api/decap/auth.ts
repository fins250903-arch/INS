import type { APIRoute } from 'astro';
import { buildGitHubAuthorizeUrl, getDecapOAuthConfig } from '../../../lib/decap-oauth';

export const GET: APIRoute = async ({ request }) => {
  const config = getDecapOAuthConfig(request);
  if (!config) {
    return new Response('Decap OAuth is not configured. Set DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET.', {
      status: 503
    });
  }

  const state = crypto.randomUUID();
  const authorizeUrl = buildGitHubAuthorizeUrl(config, state);

  return Response.redirect(authorizeUrl, 302);
};
