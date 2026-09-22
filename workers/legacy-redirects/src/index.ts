/**
 * Redirect-only Worker for the hostnames that never served content themselves:
 * the legacy WordPress subdomains (osak/hyg/siga.insbs.net) and www.insbs.net.
 *
 * It replaces the host-scoped `redirects` entries of the former vercel.json plus the
 * "redirect to insbs.net" domain setting that used to live in the Vercel dashboard.
 */
import config from '../../../redirects.config.json';
import { createMatcher, type RedirectRule } from './match';

const CANONICAL_ORIGIN = 'https://insbs.net';

const match = createMatcher(config.rules as RedirectRule[]);

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    const hit = match(url.hostname.toLowerCase(), url.pathname);

    // Every hostname routed to this Worker is non-canonical, so an unmatched path still belongs on
    // the apex domain rather than returning an error.
    const target = new URL(hit?.to ?? url.pathname, CANONICAL_ORIGIN);
    target.search = url.search;

    return Response.redirect(target.toString(), hit?.status ?? 308);
  }
};
