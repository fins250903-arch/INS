import assert from 'node:assert/strict';
import {
  GITHUB_USER_AGENT,
  contentsApiUrl,
  githubRestHeaders,
  normalizeGithubToken,
  summarizeGithubFailure
} from '../src/lib/github-rest.ts';

assert.equal(normalizeGithubToken('  Bearer github_pat_example\n'), 'github_pat_example');
assert.equal(normalizeGithubToken('\n'), '');

const headers = githubRestHeaders('github_pat_example');
assert.equal(headers['user-agent'], GITHUB_USER_AGENT);
assert.equal(headers.authorization, 'Bearer github_pat_example');
assert.equal(headers.accept, 'application/vnd.github+json');
assert.equal(headers['x-github-api-version'], '2022-11-28');

const url = contentsApiUrl('fins250903-arch', 'INS', 'src/content/blog/osaka/my slug.md', 'main');
assert.equal(
  url,
  'https://api.github.com/repos/fins250903-arch/INS/contents/src/content/blog/osaka/my%20slug.md?ref=main'
);

const summary = summarizeGithubFailure(403, 'Request forbidden\nby administrative rules. '.repeat(40));
assert.match(summary, /^GitHub API error \(403\): Request forbidden by administrative rules\./);
assert.ok(summary.length <= 'GitHub API error (403): '.length + 300);

const response = await fetch(
  contentsApiUrl('fins250903-arch', 'INS', 'src/content/blog/__no_such_probe__.md', 'main'),
  { headers: githubRestHeaders('github_pat_invalid') }
);
const body = await response.text();
assert.equal(response.status, 401, body);
assert.match(body, /Bad credentials/);
assert.equal(response.headers.get('content-type')?.includes('application/json'), true);

console.log('github-rest ok');
