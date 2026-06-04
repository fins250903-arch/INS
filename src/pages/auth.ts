import { createDecapAuthRoute } from '../lib/decap-oauth-handlers';

export const prerender = false;
export const GET = createDecapAuthRoute('/callback').GET;
