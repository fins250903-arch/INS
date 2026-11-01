import { defineMiddleware } from 'astro:middleware';

/**
 * Admin HTML is not linked for indexing. Keep the header on every /admin response,
 * including login redirects, in addition to each page's robots meta.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.url.pathname === '/admin' || context.url.pathname.startsWith('/admin/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
