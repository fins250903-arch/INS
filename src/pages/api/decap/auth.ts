import { createDecapAuthRoute } from '../../../lib/decap-oauth-handlers';

/** Legacy path — keep for existing GitHub OAuth App callback registrations */
export const prerender = false;
export const GET = createDecapAuthRoute('/api/decap/callback').GET;
