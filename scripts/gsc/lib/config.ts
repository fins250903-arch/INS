import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { GscError } from './errors.js';

/** gsc.config.json の型 */
export interface GscConfig {
  siteOrigin: string;
  /** サイトマップ送信・インデックス登録の基準プロパティ（URL プレフィックス形式） */
  primaryProperty: string;
  /** sites.add / sites.delete で扱うプロパティ一覧 */
  properties: string[];
  /** 本番のサイトマップ URL（submit 用） */
  sitemapUrl: string;
  /** ビルド後にローカルから URL を読む glob（dist/sitemap*.xml） */
  localSitemapGlob: string;
  indexing: {
    enabled: boolean;
    /** 1 日あたりの Indexing API 送信上限（安全マージン込み） */
    dailyLimit: number;
    /** リクエスト間隔（ミリ秒） */
    delayMs: number;
  };
  /** インデックス登録から除外するパス（正規表現文字列） */
  excludeUrlPatterns: string[];
}

export interface RuntimeEnv {
  /** サービスアカウント JSON キーのファイルパス */
  googleApplicationCredentials: string;
  /** 任意: OAuth 利用時（通常はサービスアカウントで十分） */
  googleClientEmail?: string;
}

const ROOT = resolve(process.cwd());

/**
 * .env と gsc.config.json を読み込む
 */
export function loadRuntimeConfig(): { gsc: GscConfig; env: RuntimeEnv } {
  loadEnv({ path: resolve(ROOT, '.env') });

  const configPath = resolve(ROOT, 'gsc.config.json');
  if (!existsSync(configPath)) {
    throw new GscError('gsc.config.json が見つかりません。プロジェクトルートに配置してください。');
  }

  const gsc = JSON.parse(readFileSync(configPath, 'utf8')) as GscConfig;
  validateGscConfig(gsc);

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    throw new GscError(
      '環境変数 GOOGLE_APPLICATION_CREDENTIALS が未設定です。.env.example を参照して .env を作成してください。'
    );
  }

  const absoluteCred = resolve(ROOT, credPath);
  if (!existsSync(absoluteCred)) {
    throw new GscError(`認証 JSON が見つかりません: ${absoluteCred}`);
  }

  return {
    gsc,
    env: {
      googleApplicationCredentials: absoluteCred,
      googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL
    }
  };
}

function validateGscConfig(gsc: GscConfig): void {
  if (!gsc.siteOrigin?.startsWith('https://')) {
    throw new GscError('gsc.config.json: siteOrigin は https:// で始めてください。');
  }
  if (!gsc.primaryProperty?.endsWith('/')) {
    throw new GscError('gsc.config.json: primaryProperty は末尾に / が必要です（例: https://insbs.net/）。');
  }
  if (!Array.isArray(gsc.properties) || gsc.properties.length === 0) {
    throw new GscError('gsc.config.json: properties に 1 件以上の URL を指定してください。');
  }
}

/** Search Console API に渡す siteUrl（URL エンコード済みは API 側で不要な場合が多いが正規化） */
export function normalizePropertyUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('sc-domain:')) return trimmed;
  if (!trimmed.endsWith('/')) return `${trimmed}/`;
  return trimmed;
}
