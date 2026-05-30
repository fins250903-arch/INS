/** WordPress 移行元サイト（地域別ブログ）の定義 */
export type BlogRegion = {
  slug: string;
  /** 画面表示用の地域名（例: 大阪） */
  name: string;
  /** 正式名称（例: 大阪府） */
  regionFull: string;
  /** Pages CMS / フロントマター用の識別子 */
  id: string;
  /** 移行元フォルダ名 */
  sourceDir: string;
  /** 旧 WordPress の代表 URL（canonical 未指定時の参考） */
  legacyBase: string;
};

export const BLOG_REGIONS: BlogRegion[] = [
  {
    id: 'fukuoka',
    slug: 'fukuoka',
    name: '福岡',
    regionFull: '福岡県',
    sourceDir: 'wp-convert1',
    legacyBase: 'https://insbs.net/ok2'
  },
  {
    id: 'osaka',
    slug: 'osaka',
    name: '大阪',
    regionFull: '大阪府',
    sourceDir: 'wp-convert2',
    legacyBase: 'https://osak.insbs.net/wp1'
  },
  {
    id: 'hyougo',
    slug: 'hyougo',
    name: '兵庫',
    regionFull: '兵庫県',
    sourceDir: 'wp-convert3',
    legacyBase: 'https://hyg.insbs.net/wp1'
  },
  {
    id: 'siga',
    slug: 'siga',
    name: '滋賀',
    regionFull: '滋賀県',
    sourceDir: 'wp-convert4',
    legacyBase: 'https://siga.insbs.net/wp1'
  }
];

export const BLOG_REGION_BY_SLUG = Object.fromEntries(
  BLOG_REGIONS.map((region) => [region.slug, region])
) as Record<string, BlogRegion>;

export const BLOG_REGION_SLUGS = BLOG_REGIONS.map((region) => region.slug);
