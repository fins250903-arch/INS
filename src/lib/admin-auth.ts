import type { AstroCookies } from 'astro';

const ADMIN_COOKIE = 'admin_auth';

export function getAdminPassword(): string {
  return import.meta.env.ADMIN_PASSWORD || 'admin123';
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
