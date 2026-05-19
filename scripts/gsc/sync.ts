#!/usr/bin/env node
/**
 * Google Search Console / Indexing API 同期 CLI
 *
 * 使用例:
 *   npm run gsc -- register-props
 *   npm run gsc -- delete-props
 *   npm run gsc -- submit-sitemap
 *   npm run gsc -- index
 *   npm run gsc -- deindex
 *   npm run gsc -- sync
 *   npm run gsc -- list-sites
 */

import { loadRuntimeConfig } from './lib/config.js';
import {
  collectUrlsFromLocalSitemaps,
  collectUrlsFromRemoteSitemap,
  readPropertiesFile,
  readUrlListFile
} from './lib/urls.js';
import {
  deleteProperties,
  listSites,
  registerProperties,
  submitSitemap
} from './lib/search-console.js';
import { requestDeindexBatch, requestIndexingBatch } from './lib/indexing.js';
import { parseGoogleError, GscError } from './lib/errors.js';
import { info, error } from './lib/logger.js';

const HELP = `
Google Search Console 同期ツール（INS サイト用）

コマンド:
  list-sites        登録済みプロパティ一覧
  register-props    gsc.config.json + gsc/properties-register.json を登録
  delete-props      gsc/properties-delete.json のプロパティを削除
  submit-sitemap    サイトマップを Search Console に送信
  index             サイトマップの URL を Indexing API で登録（URL_UPDATED）
  deindex           gsc/urls-to-remove.txt の URL を削除通知（URL_DELETED）
  sync              submit-sitemap + index（ビルド後の dist サイトマップ使用）

オプション:
  --dry-run         API を呼ばず表示のみ
  --remote          サイトマップを本番 URL から取得（ビルド不要）
  --file=<path>     URL / プロパティリストのファイル指定

例:
  npm run build && npm run gsc -- sync
  npm run gsc -- index --remote --dry-run
`.trim();

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const remote = argv.includes('--remote');
  const fileArg = argv.find((a) => a.startsWith('--file='));
  const file = fileArg?.split('=')[1];
  const command = argv.find((a) => !a.startsWith('--')) ?? 'help';
  return { command, dryRun, remote, file };
}

async function main(): Promise<void> {
  const { command, dryRun, remote, file } = parseArgs(process.argv.slice(2));

  if (command === 'help' || command === '-h' || command === '--help') {
    console.log(HELP);
    return;
  }

  const { gsc, env } = loadRuntimeConfig();
  const { createIndexingClient, createSearchConsoleClient } = await import('./lib/auth.js');
  const sc = createSearchConsoleClient(env);
  const indexing = createIndexingClient(env);

  info(`コマンド: ${command}${dryRun ? ' (dry-run)' : ''}`);

  switch (command) {
    case 'list-sites': {
      const sites = await listSites(sc);
      console.log(sites.join('\n') || '(登録プロパティなし)');
      break;
    }

    case 'register-props': {
      const extra = readPropertiesFile('gsc/properties-register.json');
      const targets = [...new Set([...gsc.properties, ...extra])];
      const result = await registerProperties(sc, targets, { dryRun });
      info(`登録 ${result.added.length} / スキップ ${result.skipped.length} / 失敗 ${result.failed.length}`);
      break;
    }

    case 'delete-props': {
      const targets = file
        ? readUrlListFile(file)
        : readPropertiesFile('gsc/properties-delete.json');
      if (targets.length === 0) {
        throw new GscError('削除対象がありません。gsc/properties-delete.json を用意してください。');
      }
      const result = await deleteProperties(sc, targets, { dryRun });
      info(`削除 ${result.deleted.length} / スキップ ${result.skipped.length} / 失敗 ${result.failed.length}`);
      break;
    }

    case 'submit-sitemap': {
      await submitSitemap(sc, gsc, { dryRun });
      break;
    }

    case 'index': {
      if (!gsc.indexing.enabled) {
        info('gsc.config.json で indexing.enabled が false のためスキップ');
        break;
      }
      const urls = remote
        ? await collectUrlsFromRemoteSitemap(gsc)
        : collectUrlsFromLocalSitemaps(gsc);
      info(`対象 URL: ${urls.length} 件`);
      await requestIndexingBatch(indexing, gsc, urls, { dryRun });
      break;
    }

    case 'deindex': {
      const listPath = file ?? 'gsc/urls-to-remove.txt';
      const urls = readUrlListFile(listPath);
      info(`削除通知 URL: ${urls.length} 件`);
      await requestDeindexBatch(indexing, gsc, urls, { dryRun });
      break;
    }

    case 'sync': {
      await registerProperties(sc, gsc.properties, { dryRun });
      await submitSitemap(sc, gsc, { dryRun });
      if (gsc.indexing.enabled) {
        const urls = remote
          ? await collectUrlsFromRemoteSitemap(gsc)
          : collectUrlsFromLocalSitemaps(gsc);
        await requestIndexingBatch(indexing, gsc, urls, { dryRun });
      }
      break;
    }

    default:
      throw new GscError(`不明なコマンド: ${command}\n\n${HELP}`);
  }
}

main().catch((err) => {
  const message = err instanceof GscError ? err.message : parseGoogleError(err).message;
  error(message);
  process.exit(1);
});
