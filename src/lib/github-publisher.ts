import { getSecret } from 'astro:env/server';
import {
  contentsApiPath,
  contentsApiUrl,
  githubRestHeaders,
  normalizeGithubToken,
  summarizeGithubFailure
} from './github-rest';

type GitHubContentResponse = {
  content?: { sha?: string };
  sha?: string;
};

function readSecret(key: string): string | undefined {
  const value = getSecret(key);
  if (typeof value !== 'string') return undefined;
  // Secrets pasted into the dashboard often include a trailing newline or a copied "Bearer " prefix.
  // Either value makes the Authorization header illegal and GitHub never sees the token.
  const trimmed = normalizeGithubToken(value);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isGitHubPublishConfigured(): boolean {
  return Boolean(readSecret('BLOG_PUBLISH_GITHUB_TOKEN'));
}

export function getGitHubPublishConfig() {
  const token = readSecret('BLOG_PUBLISH_GITHUB_TOKEN');
  if (!token) return null;

  const repo = readSecret('BLOG_PUBLISH_GITHUB_REPO') || 'fins250903-arch/INS';
  const branch = readSecret('BLOG_PUBLISH_GITHUB_BRANCH') || 'main';
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) return null;

  return { token, owner, repoName, branch };
}

async function githubFetch(path: string, init?: RequestInit) {
  const config = getGitHubPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      ...githubRestHeaders(config.token),
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(summarizeGithubFailure(response.status, body));
  }

  return response;
}

async function getFileSha(filePath: string): Promise<string | null> {
  const config = getGitHubPublishConfig();
  if (!config) return null;

  const response = await fetch(contentsApiUrl(config.owner, config.repoName, filePath, config.branch), {
    headers: githubRestHeaders(config.token)
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(summarizeGithubFailure(response.status, body));
  }

  const data = (await response.json()) as GitHubContentResponse;
  return data.sha || data.content?.sha || null;
}

export async function publishTextFile(
  filePath: string,
  content: string,
  message: string
): Promise<{ commitSha: string }> {
  const config = getGitHubPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  const sha = await getFileSha(filePath);
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch: config.branch
  };
  if (sha) body.sha = sha;

  const response = await githubFetch(contentsApiPath(config.owner, config.repoName, filePath), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as { commit?: { sha?: string } };
  return { commitSha: data.commit?.sha || '' };
}

export async function publishBinaryFile(
  filePath: string,
  buffer: Buffer,
  message: string
): Promise<{ commitSha: string }> {
  const config = getGitHubPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  const sha = await getFileSha(filePath);
  const body: Record<string, string> = {
    message,
    content: buffer.toString('base64'),
    branch: config.branch
  };
  if (sha) body.sha = sha;

  const response = await githubFetch(contentsApiPath(config.owner, config.repoName, filePath), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as { commit?: { sha?: string } };
  return { commitSha: data.commit?.sha || '' };
}

export async function deleteRepoFile(filePath: string, message: string): Promise<void> {
  const sha = await getFileSha(filePath);
  if (!sha) return;

  const config = getGitHubPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  await githubFetch(contentsApiPath(config.owner, config.repoName, filePath), {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      sha,
      branch: config.branch
    })
  });
}
