export type RegionLpLink = {
  slug: string;
  label: string;
};

export const regionLpLinks: RegionLpLink[] = [
  { slug: 'mie', label: '三重' },
  { slug: 'kyouto', label: '京都' },
  { slug: 'wakayama', label: '和歌山' },
  { slug: 'osaka', label: '大阪' },
  { slug: 'nara', label: '奈良' },
  { slug: 'gunnma', label: '群馬' },
  { slug: 'ibaraki', label: '茨城' },
  { slug: 'tiba', label: '千葉' },
  { slug: 'saitama', label: '埼玉' },
  { slug: 'tokyou', label: '東京' },
  { slug: 'okinawa', label: '沖縄' },
  { slug: 'kanagawa', label: '神奈川' },
  { slug: 'fukuoka', label: '福岡' },
  { slug: 'hyougo', label: '兵庫' },
  { slug: 'miyagi', label: '宮城' },
  { slug: 'kumamoto', label: '熊本' },
  { slug: 'saga', label: '佐賀' },
  { slug: 'aiti', label: '愛知' },
  { slug: 'siga', label: '滋賀' },
  { slug: 'fukui', label: '福井' },
  { slug: 'sizuoka', label: '静岡' }
];

/** Blog chiiki slug aliases that differ from region LP slugs */
const CHIIKI_SLUG_ALIASES: Record<string, string> = {
  oosaka: 'osaka'
};

const REGION_LP_BY_SLUG = Object.fromEntries(
  regionLpLinks.map((region) => [region.slug, region])
) as Record<string, RegionLpLink>;

/**
 * Resolve the store / region LP path (e.g. `/aiti/`) from a blog region slug,
 * chiiki slug, short label, or full prefecture name.
 */
export function resolveStoreLpPath(input?: string | null): string | null {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const normalized = raw.replace(/^(株式会社|有限会社)/, '').trim();
  const slugCandidate = CHIIKI_SLUG_ALIASES[normalized] || normalized;

  if (REGION_LP_BY_SLUG[slugCandidate]) {
    return `/${slugCandidate}/`;
  }

  const byLabel = regionLpLinks.find(
    (region) =>
      region.label === normalized ||
      region.label === normalized.replace(/[都道府県]$/, '') ||
      `${region.label}県` === normalized ||
      `${region.label}府` === normalized ||
      `${region.label}都` === normalized ||
      (region.label === '東京' && normalized === '東京都') ||
      (region.label === '大阪' && (normalized === '大阪府' || normalized === '大阪')) ||
      (region.label === '京都' && (normalized === '京都府' || normalized === '京都'))
  );
  if (byLabel) return `/${byLabel.slug}/`;

  return null;
}

export function getStoreLpLinkLabel(regionFull?: string | null, fallbackLabel = '店舗'): string {
  const name = String(regionFull || '').trim();
  if (!name) return `${fallbackLabel}サイトを見る`;
  return `${name}の店舗サイトを見る`;
}
