import { createHash } from 'node:crypto';
import { isAdminAuthenticated } from './admin-auth';
import type { AstroCookies } from 'astro';
import {
  deleteRepoFile,
  getGitHubPublishConfig,
  publishBinaryFile,
  publishTextFile
} from './github-publisher';

const BLOG_ROOT = 'src/content/blog/';
const MEDIA_ROOT = 'public/blog-images/';

const rawPosts = import.meta.glob('/src/content/blog/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

export type DecapEntry = {
  data: string;
  file: { path: string; id: string };
};

type ProxyBody = {
  action?: string;
  branch?: string;
  params?: Record<string, unknown>;
};

type DataFile = {
  path?: string;
  newPath?: string;
  raw?: string;
};

type AssetFile = {
  path?: string;
  content?: string;
  encoding?: string;
};

const memoryOverrides = new Map<string, string>();

function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function isSafePath(filePath: string, root: string): boolean {
  const normalized = normalizeRepoPath(filePath);
  return (
    normalized.startsWith(root) &&
    !normalized.split('/').includes('..') &&
    !normalized.includes('\0')
  );
}

function entryId(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function bundledBlogEntries(): DecapEntry[] {
  return Object.entries(rawPosts).map(([filePath, data]) => {
    const path = normalizeRepoPath(filePath);
    const content = memoryOverrides.get(path) ?? data;
    return { data: content, file: { path, id: entryId(content) } };
  });
}

export function filterEntries(
  entries: DecapEntry[],
  folder: string,
  extension: string,
  depth: number
): DecapEntry[] {
  const prefix = normalizeRepoPath(folder).replace(/\/$/, '');
  const ext = extension.replace(/^\./, '').toLowerCase();
  const maxDepth = Number.isFinite(depth) && depth > 0 ? depth : 10;

  return entries.filter((entry) => {
    const path = normalizeRepoPath(entry.file.path);
    if (path !== prefix && !path.startsWith(`${prefix}/`)) return false;
    if (ext && !path.toLowerCase().endsWith(`.${ext}`)) return false;
    const rest = path.slice(prefix.length).replace(/^\//, '');
    if (!rest) return false;
    return rest.split('/').length <= maxDepth;
  });
}

function remember(path: string, content: string) {
  memoryOverrides.set(normalizeRepoPath(path), content);
}

function forget(path: string) {
  memoryOverrides.delete(normalizeRepoPath(path));
}

async function fetchBlogEntriesFromGitHub(): Promise<DecapEntry[] | null> {
  const config = getGitHubPublishConfig();
  if (!config) return null;

  const query = `
    query BlogFiles($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  text
                  oid
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        text
                        oid
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
      'user-agent': 'ins-decap-proxy'
    },
    body: JSON.stringify({
      query,
      variables: {
        owner: config.owner,
        name: config.repoName,
        expression: `${config.branch}:src/content/blog`
      }
    })
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    errors?: unknown[];
    data?: {
      repository?: {
        object?: {
          entries?: GitHubTreeEntry[];
        } | null;
      } | null;
    };
  };

  const entries = payload.data?.repository?.object?.entries;
  if (!entries) return null;

  const files: DecapEntry[] = [];
  for (const entry of entries) {
    if (entry.type === 'blob' && entry.name.endsWith('.md') && entry.object?.text) {
      const path = `src/content/blog/${entry.name}`;
      const data = memoryOverrides.get(path) ?? entry.object.text;
      files.push({ data, file: { path, id: entry.object.oid || entryId(data) } });
      continue;
    }

    if (entry.type !== 'tree' || !entry.object?.entries) continue;
    for (const child of entry.object.entries) {
      if (child.type !== 'blob' || !child.name.endsWith('.md') || !child.object?.text) continue;
      const path = `src/content/blog/${entry.name}/${child.name}`;
      const data = memoryOverrides.get(path) ?? child.object.text;
      files.push({ data, file: { path, id: child.object.oid || entryId(data) } });
    }
  }

  return files.length > 0 ? files : null;
}

type GitHubTreeEntry = {
  name: string;
  type: string;
  object?: {
    text?: string | null;
    oid?: string;
    entries?: GitHubTreeEntry[];
  } | null;
};

async function listMedia(): Promise<
  { id: string; content: string; encoding: 'base64'; path: string; name: string }[]
> {
  const config = getGitHubPublishConfig();
  const ref = config?.branch || 'main';
  const owner = config?.owner || 'fins250903-arch';
  const repoName = config?.repoName || 'INS';
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'ins-decap-proxy'
  };
  if (config?.token) headers.authorization = `Bearer ${config.token}`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees/${encodeURIComponent(ref)}:public/blog-images`,
    { headers }
  );
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    tree?: { path?: string; type?: string; sha?: string }[];
  };
  return (payload.tree || [])
    .filter((item) => item.type === 'blob' && item.path)
    .map((item) => {
      const name = item.path!.split('/').pop() || item.path!;
      return {
        id: item.sha || name,
        content: '',
        encoding: 'base64' as const,
        path: `public/blog-images/${item.path}`,
        name
      };
    });
}

async function listBlogEntries(): Promise<DecapEntry[]> {
  const local = bundledBlogEntries();
  const remote = await fetchBlogEntriesFromGitHub().catch(() => null);
  if (!remote) return local;

  // Keep bundled posts if GitHub returns a partial page, and let GitHub win per path.
  const merged = new Map(local.map((entry) => [entry.file.path, entry]));
  for (const entry of remote) merged.set(entry.file.path, entry);
  return [...merged.values()];
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function commitMessage(params: Record<string, unknown> | undefined, fallback: string): string {
  const options = params?.options;
  if (options && typeof options === 'object' && 'commitMessage' in options) {
    const message = (options as { commitMessage?: unknown }).commitMessage;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export async function handleDecapProxy(request: Request, cookies: AstroCookies): Promise<Response> {
  if (!isAdminAuthenticated(cookies)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: ProxyBody;
  try {
    body = (await request.json()) as ProxyBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const action = body.action || '';
  const params = body.params || {};

  try {
    switch (action) {
      case 'info':
        return json({
          repo: 'fins250903-arch/INS',
          publish_modes: ['simple'],
          type: 'github'
        });
      case 'entriesByFolder': {
        const folder = normalizeRepoPath(String(params.folder || '')).replace(/\/$/, '');
        const extension = String(params.extension || 'md');
        const depth = Number(params.depth || 2);
        const blogFolder = BLOG_ROOT.replace(/\/$/, '');
        if (folder !== blogFolder && !isSafePath(`${folder}/`, BLOG_ROOT)) {
          return json({ error: 'Invalid folder' }, 400);
        }
        const entries = filterEntries(await listBlogEntries(), folder, extension, depth);
        return json(entries);
      }
      case 'entriesByFiles': {
        const files = Array.isArray(params.files) ? params.files : [];
        const all = await listBlogEntries();
        const byPath = new Map(all.map((entry) => [entry.file.path, entry]));
        const result = files.map((file) => {
          const path = normalizeRepoPath(String((file as { path?: string }).path || ''));
          return byPath.get(path) || { data: null, file: { path, id: null } };
        });
        return json(result);
      }
      case 'getEntry': {
        const path = normalizeRepoPath(String(params.path || ''));
        if (!isSafePath(path, BLOG_ROOT)) return json({ error: 'Invalid path' }, 400);
        const all = await listBlogEntries();
        const entry = all.find((item) => item.file.path === path);
        if (!entry) return json({ error: 'Not found' }, 404);
        return json(entry);
      }
      case 'getMedia':
        return json(await listMedia());
      case 'getMediaFile': {
        const path = normalizeRepoPath(String(params.path || ''));
        if (!isSafePath(path, MEDIA_ROOT)) return json({ error: 'Invalid path' }, 400);
        const config = getGitHubPublishConfig();
        const ref = config?.branch || 'main';
        const owner = config?.owner || 'fins250903-arch';
        const repoName = config?.repoName || 'INS';
        const url = `https://raw.githubusercontent.com/${owner}/${repoName}/${ref}/${path
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`;
        const response = await fetch(url, { headers: { 'user-agent': 'ins-decap-proxy' } });
        if (!response.ok) return json({ error: 'Media not found' }, 404);
        const buffer = Buffer.from(await response.arrayBuffer());
        return json({
          id: entryId(buffer.toString('base64')),
          content: buffer.toString('base64'),
          encoding: 'base64',
          path,
          name: path.split('/').pop() || path
        });
      }
      case 'persistEntry':
        // Await so a GitHub rejection is caught here. A bare `return promise`
        // leaves the try/catch and Astro answers with an empty 500, which
        // Decap reports as "Failed to execute 'json' on 'Response'".
        return await persistEntry(params);
      case 'persistMedia':
        return await persistMedia(params);
      case 'deleteFile':
      case 'deleteFiles':
        return await deleteFiles(action, params);
      case 'unpublishedEntries':
        return json([]);
      case 'getDeployPreview':
        return json(null);
      default:
        return json({ error: `Unknown action ${action}` }, 422);
    }
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Proxy request failed';
    const message = raw.replace(/\s+/g, ' ').trim().slice(0, 500) || 'Proxy request failed';
    return json({ error: message }, 500);
  }
}

async function persistEntry(params: Record<string, unknown>): Promise<Response> {
  if (!getGitHubPublishConfig()) {
    return json(
      {
        error:
          '記事の保存には Worker ins の「ランタイム変数とシークレット」にある BLOG_PUBLISH_GITHUB_TOKEN が必要です。ビルド変数には置かないでください。'
      },
      503
    );
  }

  const dataFiles = (Array.isArray(params.dataFiles) ? params.dataFiles : []) as DataFile[];
  const single = params.entry as DataFile | undefined;
  const files = dataFiles.length > 0 ? dataFiles : single ? [single] : [];
  const assets = (Array.isArray(params.assets) ? params.assets : []) as AssetFile[];
  const message = commitMessage(params, 'Update blog entry');

  for (const file of files) {
    const path = normalizeRepoPath(String(file.path || ''));
    const newPath = file.newPath ? normalizeRepoPath(String(file.newPath)) : '';
    const target = newPath && newPath !== path ? newPath : path;
    if (!isSafePath(path, BLOG_ROOT) || !isSafePath(target, BLOG_ROOT)) {
      return json({ error: 'Invalid path' }, 400);
    }
    if (typeof file.raw !== 'string') return json({ error: 'Missing file contents' }, 400);
    await publishTextFile(target, file.raw, message);
    remember(target, file.raw);
    if (target !== path) {
      await deleteRepoFile(path, message);
      forget(path);
    }
  }

  for (const asset of assets) {
    const path = normalizeRepoPath(String(asset.path || ''));
    if (!isSafePath(path, MEDIA_ROOT)) return json({ error: 'Invalid media path' }, 400);
    if (typeof asset.content !== 'string') return json({ error: 'Missing media contents' }, 400);
    await publishBinaryFile(path, Buffer.from(asset.content, 'base64'), message);
  }

  return json({ message: 'entry persisted' });
}

async function persistMedia(params: Record<string, unknown>): Promise<Response> {
  if (!getGitHubPublishConfig()) {
    return json(
      {
        error:
          '画像の保存には Worker ins の「ランタイム変数とシークレット」にある BLOG_PUBLISH_GITHUB_TOKEN が必要です。ビルド変数には置かないでください。'
      },
      503
    );
  }

  const asset = (params.asset || {}) as AssetFile;
  const path = normalizeRepoPath(String(asset.path || ''));
  if (!isSafePath(path, MEDIA_ROOT) || typeof asset.content !== 'string') {
    return json({ error: 'Invalid media' }, 400);
  }

  const message = commitMessage(params, 'Add blog image');
  await publishBinaryFile(path, Buffer.from(asset.content, 'base64'), message);
  return json({
    id: entryId(asset.content),
    content: asset.content,
    encoding: 'base64',
    path,
    name: path.split('/').pop() || path
  });
}

async function deleteFiles(action: string, params: Record<string, unknown>): Promise<Response> {
  if (!getGitHubPublishConfig()) {
    return json(
      {
        error:
          '削除には Worker ins の「ランタイム変数とシークレット」にある BLOG_PUBLISH_GITHUB_TOKEN が必要です。ビルド変数には置かないでください。'
      },
      503
    );
  }

  const paths =
    action === 'deleteFiles'
      ? ((params.paths as unknown[]) || []).map((path) => normalizeRepoPath(String(path)))
      : [normalizeRepoPath(String(params.path || ''))];
  const message = commitMessage(params, 'Delete blog file');

  for (const path of paths) {
    if (!isSafePath(path, BLOG_ROOT) && !isSafePath(path, MEDIA_ROOT)) {
      return json({ error: 'Invalid path' }, 400);
    }
    await deleteRepoFile(path, message);
    forget(path);
  }

  return json({ message: `deleted files ${paths.join(', ')}` });
}
