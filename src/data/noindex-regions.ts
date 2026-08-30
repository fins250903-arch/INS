/**
 * 検索エンジンにインデックスさせない地域スラッグの一元管理。
 *
 * ここに登録した地域の LP（地域 LP・地域×キーワード LP）は
 * `<meta name="robots" content="noindex, nofollow">` を出力し、
 * さらに `astro.config.mjs` のサイトマップ生成からも除外する。
 *
 * ※ robots.txt での Disallow は行わない。クロール自体を止めると
 *   Google が noindex タグを読み取れず、逆にインデックスが残る恐れがあるため。
 */
export const NOINDEX_REGION_SLUGS = new Set<string>(['okayama']);

/** 指定した地域スラッグが noindex 対象かどうかを返す。 */
export function isNoindexRegion(slug: string): boolean {
  return NOINDEX_REGION_SLUGS.has(slug);
}
