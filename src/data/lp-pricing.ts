/** 料金表（税込）— お客様請求金額一覧に準拠 */

/** セットパック（車内清掃＋床面洗浄） */
export const pricingSet = [
  {
    label: '軽四　4人乗以下',
    interiorCleaning: '24,000円',
    addon: '2,000円',
    total: '26,000円'
  },
  {
    label: '普通車5人乗以下',
    interiorCleaning: '29,000円',
    addon: '3,000円',
    total: '32,000円'
  },
  {
    label: '大型車・ミニバン6人乗以上',
    interiorCleaning: '38,000円',
    addon: '4,000円',
    total: '42,000円'
  }
] as const;

/** 部分クリーニングへ消臭・脱臭を足すときの一律加算 */
export const pricingPartialDeodorizeNote = '消臭・脱臭を追加する場合は一律 +5,000円';

export const pricingPartial = [
  { label: '座席シート単体（1脚）', price: '18,000円', deodorizeSet: '23,000円' },
  { label: '後部座席シートのみ', price: '22,000円', deodorizeSet: '27,000円' }
] as const;

export const pricingOptions = [
  { label: '消臭・脱臭 特殊清掃（ひどい嘔吐・糞尿・激臭）', price: '3,000-7,000円' },
  { label: '抗菌コート', price: '2,000円' },
  { label: '防臭 + 抗菌コート（防汚対策）', price: '5,000円' },
  { label: 'オゾン装置使用（強力脱臭）', price: '5,000円' },
  { label: '発電機等 電源持込', price: '5,000円' },
  { label: '天井部洗浄（タバコ ヤニ除去）', price: '12,000円' },
  { label: '灯油専用洗浄（1席あたり）', price: '30,000円' }
] as const;

/** 車内清掃列。FAQ・上部テキスト・ブログ・JSON-LD の「基本料金」はここだけを参照する。 */
export const pricingKei = pricingSet[0];
export const pricingStandard = pricingSet[1];
export const pricingLarge = pricingSet[2];

export function pricingLabel(label: string): string {
  return label.replace(/[\s\u3000]+/g, ' ').trim();
}

/** First integer in a table cell such as `24,000円` or `3,000-7,000円`. */
export function parseYenAmount(label: string): number {
  const matched = label.replace(/,/g, '').match(/\d+/);
  return matched ? Number.parseInt(matched[0], 10) : 0;
}

export function pricingOptionByLabel(part: string): (typeof pricingOptions)[number] {
  const row = pricingOptions.find((item) => item.label.includes(part));
  if (!row) {
    throw new Error(`Unknown pricing option: ${part}`);
  }
  return row;
}

/** schema.org priceRange for the 車内清掃 column (min-max, yen digits only). */
export function baseInteriorPriceRange(): string {
  const amounts = pricingSet.map((row) => parseYenAmount(row.interiorCleaning));
  return `${Math.min(...amounts)}-${Math.max(...amounts)}`;
}

/** One sentence that lists 車内清掃, 嘔吐加算, and セット合計 from the table. */
export function formatPricingSetSummary(): string {
  const base = pricingSet.map((row) => `${pricingLabel(row.label)} ${row.interiorCleaning}`).join('、');
  const addons = pricingSet.map((row) => `${pricingLabel(row.label)} ${row.addon}`).join('、');
  const totals = pricingSet.map((row) => `${pricingLabel(row.label)} ${row.total}`).join('、');
  return `料金表の車内清掃（税込・基本）は${base}です。嘔吐・うんちの加算は${addons}で、セット合計は${totals}です。`;
}

export function basePriceFaqAnswer(): string {
  const deodorize = pricingOptionByLabel('消臭・脱臭').price;
  const kerosene = pricingOptionByLabel('灯油').price;
  return `${formatPricingSetSummary()}ひどい嘔吐・糞尿・激臭の消臭はオプション（${deodorize}）、灯油専用洗浄は1席${kerosene}です。抗菌コートや地域による出張費も料金表のとおり別途です。訪問後に現車確認のうえお見積りします。`;
}

/** Short clause for blog leads. Uses the kei 車内清掃 price, not the rear-seat partial. */
export function keiInteriorPriceClause(): string {
  return `${pricingLabel(pricingKei.label)}の車内清掃 ${pricingKei.interiorCleaning}〜・税込`;
}

export const additionalNotes = [
  '革張りシートは、洗剤保湿剤が変わる為 5,000円',
  'エアコン内部洗浄（簡易洗浄） 10,000円',
  'ペット毛取り ピンセット抜き手作業増加 5,000円',
  '指定エリア外は、出張料金加算（主に島しょ部）',
  '駐車場利用料金（コインパーキング利用時のみ）'
] as const;

/**
 * Prefecture LPs where travel is not advertised as free.
 * 熊本・福井・和歌山・滋賀・岐阜・静岡・佐賀
 */
export const travelFeeSurchargeRegionSlugs = [
  'kumamoto',
  'fukui',
  'wakayama',
  'siga',
  'gifu',
  'sizuoka',
  'saga'
] as const;

/** Shown on the pricing table instead of a free-travel claim. */
export const travelFeeSurchargeNote =
  '地域により　出張費が加算されます　詳細は、お問合せ下さい';

const travelFeeFreePattern = /出張費[\s　]*無料/;

export function pricingNotesForRegion(regionSlug?: string): readonly string[] {
  const surcharge =
    regionSlug != null &&
    (travelFeeSurchargeRegionSlugs as readonly string[]).includes(regionSlug);
  if (!surcharge) return additionalNotes;

  const withoutFreeTravel = additionalNotes.filter((note) => !travelFeeFreePattern.test(note));
  return [...withoutFreeTravel, travelFeeSurchargeNote];
}
