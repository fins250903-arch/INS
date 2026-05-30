/**
 * WordPress image URL helpers for blog thumbnails and content.
 */

const SUBDOMAIN_TO_REGION: Record<string, string> = {
  osak: 'osaka',
  hyg: 'hyougo',
  siga: 'siga'
};

export function normalizeWpImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  return trimmed;
}

/** Block only the known duplicate placeholder art. */
export function isBlockedPlaceholder(url?: string | null): boolean {
  const normalized = normalizeWpImageUrl(url);
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  return lower.includes('illust4847') || lower.includes('hikakutenpo');
}

/**
 * Map legacy WordPress hosts to paths that exist on insbs.net (see vercel.json redirects).
 * e.g. osak.insbs.net/wp1/wp-content/... -> https://insbs.net/osaka/wp-content/...
 */
export function resolveInsbsImageUrl(url?: string | null): string {
  const normalized = normalizeWpImageUrl(url);
  if (!normalized || !/^https?:\/\//i.test(normalized)) return normalized;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return normalized;
  }

  const host = parsed.hostname.toLowerCase();
  let pathname = parsed.pathname;

  if (host === 'insbs.net' || host === 'www.insbs.net') {
    if (pathname.startsWith('/ok2/')) {
      pathname = `/fukuoka${pathname.slice('/ok2'.length)}`;
    }
    return `https://insbs.net${pathname}${parsed.search}`;
  }

  const subMatch = host.match(/^([a-z0-9-]+)\.insbs\.net$/);
  if (subMatch && pathname.startsWith('/wp1/')) {
    const region = SUBDOMAIN_TO_REGION[subMatch[1]] || subMatch[1];
    pathname = pathname.slice('/wp1'.length);
    return `https://insbs.net/${region}${pathname}${parsed.search}`;
  }

  return normalized;
}

export function toDisplayImageUrl(url?: string | null): string {
  const normalized = normalizeWpImageUrl(url);
  if (!normalized) return '';
  if (normalized.startsWith('/')) return normalized;
  return resolveInsbsImageUrl(normalized);
}

/** @deprecated Use toDisplayImageUrl */
export function toProxyImageUrl(url?: string | null): string {
  return toDisplayImageUrl(url);
}

export function normalizeWpContentImageUrls(html?: string | null): string {
  if (!html) return '';
  return html.replace(/(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi, (_m, p1, src, p3) => {
    return `${p1}${toDisplayImageUrl(src)}${p3}`;
  });
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function extractContentImageCandidates(html?: string | null): string[] {
  const source = String(html || '');
  if (!source) return [];

  const fromImgTags: string[] = [];
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = imgTagRegex.exec(source)) !== null) {
    const src = normalizeWpImageUrl(match[1]);
    if (src) fromImgTags.push(src);
  }

  const fromDirectUrls: string[] = [];
  const uploadUrlRegex = /https?:\/\/[^"' \n)]+\/wp-content\/uploads\/[^"' \n)]+/gi;
  while ((match = uploadUrlRegex.exec(source)) !== null) {
    const src = normalizeWpImageUrl(match[0]);
    if (src) fromDirectUrls.push(src);
  }

  return unique([...fromImgTags, ...fromDirectUrls]);
}

export function pickBestPostImage(post: {
  thumbnail?: string;
  content?: string;
  localImage?: string;
}): string {
  const localImage = normalizeWpImageUrl(post.localImage);
  if (localImage) return localImage;
  return '';
}
