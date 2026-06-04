import { createDecapCallbackRoute } from '../lib/decap-oauth-handlers';

export const prerender = false;
export const GET = createDecapCallbackRoute('/callback').GET;
