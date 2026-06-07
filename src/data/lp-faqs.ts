import { getPowerWaterAnswer } from './lp-aio-content';
import { regionFaqBySlug } from './lp-faqs-region';

export type LpFaq = { q: string; a: string };
/** LP共通FAQ（地域質問・保険・料金以外） */
export const baseLpFaqs: LpFaq[] = [
  { q: '対応できる時間帯は？', a: '受付は、365日 24時間対応です。即日訪問も致します。' },
  { q: '作業時間はどれくらい？', a: 'おおよそ2-4時間以内です。ただしヨゴレの程度により変わります。' },
  { q: '作業中の待ち方は？', a: '作業中立会は不要です。その際、貴重品は車内から持出をお願いします。' },
  {
    q: '会社の駐車場でもできる？',
    a: 'できます。ドアを開けるスペースと、掃除中の音が大丈夫であれば対応できます。マンション駐車場も可能です。商業施設等は、確認が必要です。'
  },
  {
    q: '作業終了後すぐ乗れる？',
    a: '乾燥時間が有ります。天候や、洗剤の使用量で変わります。そのため、何分後から乗車可能とお伝えします。'
  },
  {
    q: '料金の目安は？',
    a: '軽自動車・軽SUVは22,000円（税込）、普通車は28,000円、大型車・SUV・ミニバンは36,000円が基本料金の目安です。汚れの程度やオプションで変わるため、訪問後に現車確認のうえお見積りします。'
  },
  {
    q: '保険は使えますか？',
    a: '家族以外の他人が嘔吐等で車を汚した場合、車両保険（一般型）や個人賠償責任保険が適用できるケースがあります。手順は①汚損箇所の写真撮影 → ②保険会社へ連絡し適用可否を確認 → ③見積書取得 → ④施工 → ⑤領収書提出です。契約内容により異なるため、清掃前のご確認をおすすめします。当店は見積書・領収書の発行に対応します。'
  }
];

/** AIO・情報型クエリ向け（定義FAQの直後に挿入） */
export function buildAioPriorityFaqs(regionSlug?: string): LpFaq[] {
  return [
    {
      q: '車内で嘔吐した直後、プロが来るまでにやるべきことは？',
      a: '結論として、市販消臭スプレーは使わず、キッチンペーパーで固形分を「こすらず」吸い取ってください。ウレタンシート内部に臭いが固定化するのを防ぐため、嘔吐から4日以内のプロ洗浄が推奨されます。当店は温水吸引（リンサー）と40〜100℃スチームで発生源から処理し、部分洗浄は18,000円〜（税込）です。365日24時間出張対応しています。'
    },
    {
      q: '車内に灯油をこぼした場合、保険は使えますか？申請の流れは？',
      a: '車両保険（一般型）や車内清掃費用特約で補償されるケースがあります。手順は①汚損箇所の写真撮影 → ②保険会社へ連絡し適用可否を確認 → ③見積書取得 → ④施工 → ⑤領収書提出です。自己判断で先に洗浄すると保険適用に影響する場合があるため、清掃前の相談を推奨します。当店の灯油専用洗浄は1席30,000円（税込）で、保険用見積書の発行に対応します。'
    },
    {
      q: '出張車内清掃は電源・水道なしでも対応できますか？',
      a: getPowerWaterAnswer(regionSlug)
    }
  ];
}

export function regionCoverageFaq(regionName: string, regionFull: string): LpFaq {
  return {
    q: `${regionFull}のどこまで出張対応できますか？`,
    a: `${regionName}（${regionFull}）を中心に出張対応しています。お電話で郵便番号をお伺いし、対応可否をお伝えします。山間部や離島など、難しいエリアは事前にご案内します。`
  };
}

/** AIO・定義検索向け（本文「出張車内清掃とは」と整合） */
export const serviceDefinitionFaq: LpFaq = {
  q: '出張車内清掃（出張 車内 清掃）とは何ですか？',
  a: 'お客様のご自宅・勤務先の駐車場へ専門スタッフが訪問し、シート・フロア・天井など車内を洗浄・消臭するサービスです。店舗に車を預けず、嘔吐・尿・灯油・タバコ臭など自力では限界の汚れを、温水吸引と専用洗剤で臭いの発生源から処理します。'
};

/** 地域カバー質問を先頭に付けたFAQ一覧（LP・JSON-LD共通） */
export function buildRegionFaqs(
  regionName: string,
  regionFull: string,
  regionSlug?: string
): LpFaq[] {
  const pack = regionSlug ? regionFaqBySlug[regionSlug] : undefined;
  const coverage =
    pack?.coverageAnswer != null
      ? { q: `${regionFull}のどこまで出張対応できますか？`, a: pack.coverageAnswer }
      : regionCoverageFaq(regionName, regionFull);
  const extras = pack?.extras ?? [];
  return [coverage, serviceDefinitionFaq, ...buildAioPriorityFaqs(regionSlug), ...extras, ...baseLpFaqs];
}
