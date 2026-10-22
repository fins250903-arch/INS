/** Headers and URLs for the GitHub Contents API. */

export const GITHUB_USER_AGENT = 'ins-blog-publisher';

/** Drop a trailing newline or a copied "Bearer " prefix from a dashboard secret. */
export function normalizeGithubToken(value: string): string {
  return value.trim().replace(/^Bearer\s+/i, '');
}

/**
 * GitHub rejects REST calls that omit User-Agent with a plain-text 403.
 * Cloudflare Workers `fetch` does not set one, so every call must.
 */
export function githubRestHeaders(token: string): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'user-agent': GITHUB_USER_AGENT,
    'x-github-api-version': '2022-11-28'
  };
}

export function contentsApiPath(owner: string, repo: string, filePath: string): string {
  const encodedPath = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
}

export function contentsApiUrl(owner: string, repo: string, filePath: string, branch: string): string {
  return `https://api.github.com${contentsApiPath(owner, repo, filePath)}?ref=${encodeURIComponent(branch)}`;
}

export function summarizeGithubFailure(status: number, body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim().slice(0, 300);
  return `GitHub API error (${status}): ${compact}`;
}
