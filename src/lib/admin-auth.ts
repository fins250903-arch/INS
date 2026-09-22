import type { AstroCookies } from 'astro';
import { getSecret } from 'astro:env/server';

const ADMIN_COOKIE = 'admin_auth';

export function getAdminPassword(): string {
  // `getSecret` reads the Worker binding at request time; `import.meta.env` is inlined at build time
  // and therefore empty on Cloudflare.
  return getSecret('ADMIN_PASSWORD') || 'admin123';
}

export function isAdminAuthenticated(cookies: AstroCookies): boolean {
  return cookies.get(ADMIN_COOKIE)?.value === getAdminPassword();
}

export function setAdminAuthCookie(cookies: AstroCookies): void {
  cookies.set(ADMIN_COOKIE, getAdminPassword(), {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax'
  });
}

export function clearAdminAuthCookie(cookies: AstroCookies): void {
  cookies.delete(ADMIN_COOKIE, { path: '/' });
}

export function isAuthorizedRequest(request: Request, cookies: AstroCookies): boolean {
  if (isAdminAuthenticated(cookies)) return true;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${getAdminPassword()}`;
}
