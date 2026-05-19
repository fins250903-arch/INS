/** コンソール出力（将来ログファイルへ拡張しやすい薄いラッパー） */

export function info(message: string): void {
  console.log(`[gsc] ${message}`);
}

export function warn(message: string): void {
  console.warn(`[gsc:warn] ${message}`);
}

export function error(message: string): void {
  console.error(`[gsc:error] ${message}`);
}

export function success(message: string): void {
  console.log(`[gsc:ok] ${message}`);
}
