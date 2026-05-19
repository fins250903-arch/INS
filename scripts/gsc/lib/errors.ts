/**
 * API エラーを判別して、初心者向けの日本語メッセージに変換する
 */

export class GscError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'GscError';
  }
}

/** googleapis のエラー形状（一部） */
interface GoogleApiErrorShape {
  code?: number;
  message?: string;
  errors?: Array<{ reason?: string; message?: string }>;
}

export function parseGoogleError(err: unknown): GscError {
  const anyErr = err as GoogleApiErrorShape & { response?: { status?: number; data?: GoogleApiErrorShape } };
  const status = anyErr.response?.status ?? anyErr.code;
  const message =
    anyErr.response?.data?.message ??
    anyErr.message ??
    (err instanceof Error ? err.message : String(err));
  const reason = anyErr.response?.data?.errors?.[0]?.reason ?? anyErr.errors?.[0]?.reason;

  if (status === 401 || status === 403) {
    return new GscError(
      `認証または権限エラー (${status}): ${message}\n` +
        '→ サービスアカウントを Search Console の「所有者」として追加したか、.env の鍵パスを確認してください。',
      reason,
      status
    );
  }

  if (status === 429) {
    return new GscError(
      `API レート制限 (${status}): ${message}\n` +
        '→ gsc.config.json の delayMs を大きくするか、明日再実行してください。',
      reason,
      status
    );
  }

  if (status === 404) {
    return new GscError(
      `リソースが見つかりません (${status}): ${message}\n` +
        '→ プロパティ URL の末尾スラッシュや、Search Console への登録・確認状態を確認してください。',
      reason,
      status
    );
  }

  return new GscError(message, reason, status);
}
