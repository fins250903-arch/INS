import type { APIRoute } from 'astro';
import { handleDecapProxy } from '../../lib/decap-proxy';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => handleDecapProxy(request, cookies);
