import { readFileSync } from 'node:fs';
import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';
import type { RuntimeEnv } from './config.js';

const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters';
const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';

/**
 * サービスアカウント JWT クライアントを生成
 * @see https://cloud.google.com/iam/docs/service-account-overview
 */
export function createAuthClient(env: RuntimeEnv, scopes: string[]): JWT {
  const raw = JSON.parse(readFileSync(env.googleApplicationCredentials, 'utf8')) as {
    client_email: string;
    private_key: string;
  };

  return new google.auth.JWT({
    email: raw.client_email,
    key: raw.private_key,
    scopes
  });
}

/** Search Console API クライアント */
export function createSearchConsoleClient(env: RuntimeEnv) {
  const auth = createAuthClient(env, [SEARCH_CONSOLE_SCOPE]);
  return google.searchconsole({ version: 'v1', auth });
}

/** Web Search Indexing API クライアント */
export function createIndexingClient(env: RuntimeEnv) {
  const auth = createAuthClient(env, [INDEXING_SCOPE]);
  return google.indexing({ version: 'v3', auth });
}
