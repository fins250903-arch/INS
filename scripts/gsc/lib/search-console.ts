import type { searchconsole_v1 } from 'googleapis';
import type { GscConfig } from './config.js';
import { normalizePropertyUrl } from './config.js';
import { parseGoogleError } from './errors.js';
import { info, success, warn } from './logger.js';
import { withRetry, sleep } from './rate-limit.js';

type SearchConsole = searchconsole_v1.Searchconsole;

/**
 * Search Console に登録済みプロパティ一覧を取得
 */
export async function listSites(sc: SearchConsole): Promise<string[]> {
  const res = await withRetry(() => sc.sites.list());
  const entries = res.data.siteEntry ?? [];
  return entries.map((e) => e.siteUrl).filter((u): u is string => Boolean(u));
}

/**
 * プロパティを一括登録（sites.add）
 * ※ 所有権の「確認」は Search Console 上で別途必要な場合があります
 */
export async function registerProperties(
  sc: SearchConsole,
  properties: string[],
  options: { dryRun?: boolean } = {}
): Promise<{ added: string[]; skipped: string[]; failed: string[] }> {
  const normalized = properties.map(normalizePropertyUrl);
  const existing = new Set((await listSites(sc)).map(normalizePropertyUrl));

  const added: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const siteUrl of normalized) {
    if (existing.has(siteUrl)) {
      skipped.push(siteUrl);
      info(`スキップ（登録済み）: ${siteUrl}`);
      continue;
    }

    if (options.dryRun) {
      info(`[dry-run] 登録予定: ${siteUrl}`);
      added.push(siteUrl);
      continue;
    }

    try {
      await withRetry(() => sc.sites.add({ siteUrl }));
      added.push(siteUrl);
      success(`プロパティ登録: ${siteUrl}`);
      await sleep(300);
    } catch (err) {
      failed.push(siteUrl);
      warn(`登録失敗: ${siteUrl} — ${parseGoogleError(err).message}`);
    }
  }

  return { added, skipped, failed };
}

/**
 * プロパティを一括削除（sites.delete）
 */
export async function deleteProperties(
  sc: SearchConsole,
  properties: string[],
  options: { dryRun?: boolean } = {}
): Promise<{ deleted: string[]; skipped: string[]; failed: string[] }> {
  const normalized = properties.map(normalizePropertyUrl);
  const existing = new Set((await listSites(sc)).map(normalizePropertyUrl));

  const deleted: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const siteUrl of normalized) {
    if (!existing.has(siteUrl)) {
      skipped.push(siteUrl);
      info(`スキップ（未登録）: ${siteUrl}`);
      continue;
    }

    if (options.dryRun) {
      info(`[dry-run] 削除予定: ${siteUrl}`);
      deleted.push(siteUrl);
      continue;
    }

    try {
      await withRetry(() => sc.sites.delete({ siteUrl }));
      deleted.push(siteUrl);
      success(`プロパティ削除: ${siteUrl}`);
      await sleep(300);
    } catch (err) {
      failed.push(siteUrl);
      warn(`削除失敗: ${siteUrl} — ${parseGoogleError(err).message}`);
    }
  }

  return { deleted, skipped, failed };
}

/**
 * サイトマップを送信（sitemaps.submit）
 * @param feedpath 例: https://insbs.net/sitemap-index.xml
 */
export async function submitSitemap(
  sc: SearchConsole,
  gsc: GscConfig,
  options: { dryRun?: boolean } = {}
): Promise<void> {
  const siteUrl = normalizePropertyUrl(gsc.primaryProperty);
  const feedpath = gsc.sitemapUrl;

  if (options.dryRun) {
    info(`[dry-run] サイトマップ送信: siteUrl=${siteUrl} feedpath=${feedpath}`);
    return;
  }

  await withRetry(() =>
    sc.sitemaps.submit({
      siteUrl,
      feedpath
    })
  );
  success(`サイトマップ送信完了: ${feedpath}`);
}

/**
 * サイトマップを削除（sitemaps.delete）
 */
export async function deleteSitemap(
  sc: SearchConsole,
  gsc: GscConfig,
  feedpath: string,
  options: { dryRun?: boolean } = {}
): Promise<void> {
  const siteUrl = normalizePropertyUrl(gsc.primaryProperty);

  if (options.dryRun) {
    info(`[dry-run] サイトマップ削除: ${feedpath}`);
    return;
  }

  await withRetry(() => sc.sitemaps.delete({ siteUrl, feedpath }));
  success(`サイトマップ削除: ${feedpath}`);
}
