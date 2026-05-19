/**
 * API 連続呼び出しの間隔制御
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 指数バックオフ付きリトライ（429 / 5xx 向け）
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { code?: number; response?: { status?: number } }).response?.status ??
        (err as { code?: number }).code;
      const retriable = status === 429 || (typeof status === 'number' && status >= 500);
      if (!retriable || attempt === maxAttempts) break;
      const wait = baseDelayMs * 2 ** (attempt - 1);
      await sleep(wait);
    }
  }

  throw lastError;
}
