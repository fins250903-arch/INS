import { getSecret } from 'astro:env/server';

type GitHubContentResponse = {
  content?: { sha?: string };
  sha?: string;
};

function readSecret(key: string): string | undefined {
  const value = getSecret(key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function isGitHubPublishConfigured(): boolean {
  return Boolean(readSecret('BLOG_PUBLISH_GITHUB_TOKEN'));
}

function getPublishConfig() {
  const token = readSecret('BLOG_PUBLISH_GITHUB_TOKEN');
  if (!token) return null;

  const repo = readSecret('BLOG_PUBLISH_GITHUB_REPO') || 'fins250903-arch/INS';
  const branch = readSecret('BLOG_PUBLISH_GITHUB_BRANCH') || 'main';
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) return null;

  return { token, owner, repoName, branch };
}

async function githubFetch(path: string, init?: RequestInit) {
  const config = getPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${config.token}`,
      'x-github-api-version': '2022-11-28',
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body}`);
  }

  return response;
}

async function getFileSha(filePath: string): Promise<string | null> {
  const config = getPublishConfig();
  if (!config) return null;

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repoName}/contents/${filePath}?ref=${encodeURIComponent(config.branch)}`,
    {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${config.token}`,
        'x-github-api-version': '2022-11-28'
      }
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub get file failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as GitHubContentResponse;
  return data.sha || data.content?.sha || null;
}

export async function publishTextFile(
  filePath: string,
  content: string,
  message: string
): Promise<{ commitSha: string }> {
  const config = getPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  const sha = await getFileSha(filePath);
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch: config.branch
  };
  if (sha) body.sha = sha;

  const response = await githubFetch(
    `/repos/${config.owner}/${config.repoName}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  const data = (await response.json()) as { commit?: { sha?: string } };
  return { commitSha: data.commit?.sha || '' };
}

export async function publishBinaryFile(
  filePath: string,
  buffer: Buffer,
  message: string
): Promise<{ commitSha: string }> {
  const config = getPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  const sha = await getFileSha(filePath);
  const body: Record<string, string> = {
    message,
    content: buffer.toString('base64'),
    branch: config.branch
  };
  if (sha) body.sha = sha;

  const response = await githubFetch(
    `/repos/${config.owner}/${config.repoName}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  const data = (await response.json()) as { commit?: { sha?: string } };
  return { commitSha: data.commit?.sha || '' };
}

export async function deleteRepoFile(filePath: string, message: string): Promise<void> {
  const sha = await getFileSha(filePath);
  if (!sha) return;

  const config = getPublishConfig();
  if (!config) throw new Error('GitHub publish is not configured');

  await githubFetch(`/repos/${config.owner}/${config.repoName}/contents/${filePath}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      sha,
      branch: config.branch
    })
  });
}
