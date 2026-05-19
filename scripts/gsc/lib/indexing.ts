import type { indexing_v3 } from 'googleapis';
import type { GscConfig } from './config.js';
import { parseGoogleError } from './errors.js';
import { info, success, warn } from './logger.js';
import { sleep, withRetry } from './rate-limit.js';

type Indexing = indexing_v3.Indexing;

export type IndexNotificationType = 'URL_UPDATED' | 'URL_DELETED';

/**
 * Indexing API で URL の更新または削除を通知
 * @see https://developers.google.com/search/apis/indexing-api/v3/using-api
 */
export async function publishUrlNotification(
  indexing: Indexing,
  url: string,
  type: IndexNotificationType
): Promise<void> {
  await withRetry(() =>
    indexing.urlNotifications.publish({
      requestBody: { url, type }
    })
  );
}

/**
 * URL 一覧をインデックス登録（URL_UPDATED）— 日次上限・間隔を守る
 */
export async function requestIndexingBatch(
  indexing: Indexing,
  gsc: GscConfig,
  urls: string[],
  options: { dryRun?: boolean } = {}
): Promise<{ ok: string[]; failed: string[] }> {
  const limit = gsc.indexing.dailyLimit;
  const batch = urls.slice(0, limit);
  if (urls.length > limit) {
    warn(`Indexing API: ${urls.length} 件中 ${limit} 件のみ送信（dailyLimit）。残りは翌日に実行してください。`);
  }

  const ok: string[] = [];
  const failed: string[] = [];

  for (const url of batch) {
    if (options.dryRun) {
      info(`[dry-run] インデックス登録: ${url}`);
      ok.push(url);
      continue;
    }

    try {
      await publishUrlNotification(indexing, url, 'URL_UPDATED');
      ok.push(url);
      info(`インデックス登録リクエスト: ${url}`);
    } catch (err) {
      failed.push(url);
      warn(`失敗: ${url} — ${parseGoogleError(err).message}`);
    }
    await sleep(gsc.indexing.delayMs);
  }

  success(`Indexing 完了: 成功 ${ok.length} / 失敗 ${failed.length}`);
  return { ok, failed };
}

/**
 * URL 一覧のインデックス削除通知（URL_DELETED）
 */
export async function requestDeindexBatch(
  indexing: Indexing,
  gsc: GscConfig,
  urls: string[],
  options: { dryRun?: boolean } = {}
): Promise<{ ok: string[]; failed: string[] }> {
  const ok: string[] = [];
  const failed: string[] = [];

  for (const url of urls) {
    if (options.dryRun) {
      info(`[dry-run] インデックス削除通知: ${url}`);
      ok.push(url);
      continue;
    }

    try {
      await publishUrlNotification(indexing, url, 'URL_DELETED');
      ok.push(url);
      info(`削除通知: ${url}`);
    } catch (err) {
      failed.push(url);
      warn(`失敗: ${url} — ${parseGoogleError(err).message}`);
    }
    await sleep(gsc.indexing.delayMs);
  }

  success(`Deindex 完了: 成功 ${ok.length} / 失敗 ${failed.length}`);
  return { ok, failed };
}
