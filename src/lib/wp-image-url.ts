const WP_UPLOADS_PATH = '/wp1/wp-content/uploads/';
const INSBS_UPLOADS_BASE = `https://insbs.net${WP_UPLOADS_PATH}`;

/**
 * Normalize legacy regional WP image URLs to insbs.net.
 * Example: https://hyg.insbs.net/wp1/wp-content/uploads/... -> https://insbs.net/wp1/wp-content/uploads/...
 */
export function normalizeWpImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const idx = trimmed.indexOf(WP_UPLOADS_PATH);
  if (idx === -1) return trimmed;

  const relative = trimmed.slice(idx + WP_UPLOADS_PATH.length);
  return `${INSBS_UPLOADS_BASE}${relative}`;
}

/**
 * Normalize src/href values in HTML content that point to legacy WP uploads hosts.
 */
export function normalizeWpContentImageUrls(html?: string | null): string {
  if (!html) return '';
  return html.replace(
    /https?:\/\/[a-z0-9.-]*insbs\.net\/wp1\/wp-content\/uploads\//gi,
    INSBS_UPLOADS_BASE
  );
}
