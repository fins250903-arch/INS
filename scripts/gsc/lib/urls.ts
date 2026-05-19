import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GscConfig } from './config.js';
import { GscError } from './errors.js';

const ROOT = resolve(process.cwd());

/**
 * サイトマップ XML から <loc> URL を抽出（依存を増やさない簡易パーサー）
 */
export function parseUrlsFromSitemapXml(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return [...new Set(urls)];
}

/**
 * dist/ 以下の sitemap*.xml から URL 一覧を収集
 */
export function collectUrlsFromLocalSitemaps(gsc: GscConfig): string[] {
  const candidateDirs = [
    resolve(ROOT, 'dist/client'),
    resolve(ROOT, 'dist'),
    resolve(ROOT, '.vercel/output/static')
  ];
  const dir = candidateDirs.find((d) => existsSync(d));
  if (!dir) {
    throw new GscError(
      'サイトマップ用の dist/ が見つかりません。先に `npm run build` を実行するか、`--remote` で本番サイトマップを取得してください。'
    );
  }

  const files = readdirSync(dir)
    .filter((name) => /^sitemap.*\.xml$/i.test(name))
    .map((name) => resolve(dir, name));
  if (files.length === 0) {
    throw new GscError(`サイトマップ XML が見つかりません: ${dir}/sitemap*.xml`);
  }

  const all: string[] = [];
  for (const file of files) {
    const xml = readFileSync(file, 'utf8');
    all.push(...parseUrlsFromSitemapXml(xml));
  }

  return filterUrls(all, gsc);
}

/**
 * 本番 URL のサイトマップを HTTP で取得（ビルド不要）
 */
export async function collectUrlsFromRemoteSitemap(gsc: GscConfig): Promise<string[]> {
  const res = await fetch(gsc.sitemapUrl);
  if (!res.ok) {
    throw new GscError(`サイトマップ取得失敗 (${res.status}): ${gsc.sitemapUrl}`);
  }
  const xml = await res.text();
  let urls = parseUrlsFromSitemapXml(xml);

  // sitemap-index の場合は子サイトマップを辿る
  if (xml.includes('<sitemapindex')) {
    const childMaps = urls;
    urls = [];
    for (const mapUrl of childMaps) {
      const childRes = await fetch(mapUrl);
      if (!childRes.ok) continue;
      const childXml = await childRes.text();
      urls.push(...parseUrlsFromSitemapXml(childXml));
    }
  }

  return filterUrls([...new Set(urls)], gsc);
}

/** 除外パターン・オリジン外を除去 */
export function filterUrls(urls: string[], gsc: GscConfig): string[] {
  const origin = gsc.siteOrigin.replace(/\/$/, '');
  const patterns = gsc.excludeUrlPatterns.map((p) => new RegExp(p));

  return [...new Set(urls)]
    .filter((u) => u.startsWith(origin))
    .filter((u) => !patterns.some((re) => re.test(new URL(u).pathname)));
}

/**
 * 1 行 1 URL のテキストファイルを読み込む（削除用リスト等）
 */
export function readUrlListFile(relativePath: string): string[] {
  const file = resolve(ROOT, relativePath);
  if (!existsSync(file)) {
    throw new GscError(`URL リストが見つかりません: ${relativePath}`);
  }
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/**
 * gsc/properties.json からプロパティ URL 一覧（任意）
 */
export function readPropertiesFile(relativePath: string): string[] {
  const file = resolve(ROOT, relativePath);
  if (!existsSync(file)) return [];
  const data = JSON.parse(readFileSync(file, 'utf8')) as { properties?: string[] };
  return data.properties ?? [];
}
