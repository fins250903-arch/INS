/** ブログ「都道府県別」一覧用（WPの categories 文字列と突き合わせ） */
export type ChiikiRegion = {
  slug: string;
  /** 画面表示名 */
  name: string;
  /** `wp-posts.json` の `categories` に含まれる都道府県名（無い場合は該当記事0件） */
  categoryLabel: string;
};

export const CHIIKI_REGIONS: ChiikiRegion[] = [
  { slug: 'hokkaidou', name: '北海道', categoryLabel: '北海道' },
  { slug: 'miyagi', name: '宮城県', categoryLabel: '宮城' },
  { slug: 'fukusima', name: '福島県', categoryLabel: '福島' },
  { slug: 'ibaraki', name: '茨城県', categoryLabel: '茨城' },
  { slug: 'totigi', name: '栃木県', categoryLabel: '栃木' },
  { slug: 'gunnma', name: '群馬県', categoryLabel: '群馬' },
  { slug: 'saitama', name: '埼玉県', categoryLabel: '埼玉' },
  { slug: 'tokyou', name: '東京都', categoryLabel: '東京' },
  { slug: 'tiba', name: '千葉県', categoryLabel: '千葉' },
  { slug: 'kanagawa', name: '神奈川県', categoryLabel: '神奈川' },
  { slug: 'sizuoka', name: '静岡県', categoryLabel: '静岡' },
  { slug: 'aiti', name: '愛知県', categoryLabel: '愛知' },
  { slug: 'isikawa', name: '石川県', categoryLabel: '石川' },
  { slug: 'fukui', name: '福井県', categoryLabel: '福井' },
  { slug: 'siga', name: '滋賀県', categoryLabel: '滋賀' },
  { slug: 'kyouto', name: '京都府', categoryLabel: '京都' },
  { slug: 'oosaka', name: '大阪府', categoryLabel: '大阪' },
  { slug: 'nara', name: '奈良県', categoryLabel: '奈良' },
  { slug: 'mie', name: '三重県', categoryLabel: '三重' },
  { slug: 'wakayama', name: '和歌山県', categoryLabel: '和歌山' },
  { slug: 'hyougo', name: '兵庫県', categoryLabel: '兵庫' },
  { slug: 'okayama', name: '岡山県', categoryLabel: '岡山' },
  { slug: 'hirosima', name: '広島県', categoryLabel: '広島' },
  { slug: 'kagawa', name: '香川県', categoryLabel: '香川' },
  { slug: 'tokushima', name: '徳島県', categoryLabel: '徳島' },
  { slug: 'fukuoka', name: '福岡県', categoryLabel: '福岡' },
  { slug: 'ooit', name: '大分県', categoryLabel: '大分' },
  { slug: 'miyazaki', name: '宮崎県', categoryLabel: '宮崎' },
  { slug: 'kagoshima', name: '鹿児島県', categoryLabel: '鹿児島' },
  { slug: 'kumamoto', name: '熊本県', categoryLabel: '熊本' },
  { slug: 'saga', name: '佐賀県', categoryLabel: '佐賀' },
  { slug: 'okinawa', name: '沖縄県', categoryLabel: '沖縄' }
];
