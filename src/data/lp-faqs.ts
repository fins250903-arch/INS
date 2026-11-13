import { getPowerWaterAnswer } from './lp-aio-content';
import { regionFaqBySlug } from './lp-faqs-region';
import { basePriceFaqAnswer, pricingOptionByLabel, pricingPartial } from './lp-pricing';

const keroseneSeatPrice = pricingOptionByLabel('灯油').price;

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
    a: basePriceFaqAnswer()
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
      a: `結論として、市販消臭スプレーは使わず、キッチンペーパーで固形分を「こすらず」吸い取ってください。ウレタンシート内部に臭いが固定化するのを防ぐため、嘔吐から4日以内のプロ洗浄が推奨されます。当店は温水吸引（リンサー）と40〜100℃スチームで発生源から処理し、部分洗浄は${pricingPartial[0].price}〜（税込）です。365日24時間出張対応しています。`
    },
    {
      q: '車内に灯油をこぼした場合、保険は使えますか？申請の流れは？',
      a: `家族以外の他人が嘔吐等で車を汚した場合は個人賠償責任保険、灯油こぼしなどは車両保険（一般型）や車内清掃費用特約で補償されるケースがあります。手順は①汚損箇所の写真撮影 → ②保険会社へ連絡し適用可否を確認 → ③見積書取得 → ④施工 → ⑤領収書提出です。自己判断で先に洗浄すると保険適用に影響する場合があり、契約内容により異なるため、清掃前にご確認ください。当店の灯油専用洗浄は1席${keroseneSeatPrice}で、見積書・領収書の発行に対応します。`
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

const GENERIC_FAQ_QUESTIONS = new Set(['料金の目安は？', '保険は使えますか？', '料金の目安はいくらですか？']);

function faqCluster(question: string): 'pricing' | 'insurance' | null {
  if (question.includes('料金')) return 'pricing';
  if (question.includes('保険')) return 'insurance';
  return null;
}

function faqSpecificity(question: string, regionName: string, regionFull: string): number {
  let score = Math.min(question.length, 80);
  if (regionFull && question.includes(regionFull)) score += 100;
  if (regionName && question.includes(regionName)) score += 40;
  if (GENERIC_FAQ_QUESTIONS.has(question)) score -= 100;
  return score;
}

function splitJaSentences(text: string): string[] {
  return text
    .split(/(?<=。)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sentenceKey(text: string): string {
  return text.replace(/\s+/g, '').replace(/。/g, '');
}

/** Distinct claims already written in the pricing and insurance answers. */
function factTokens(text: string): string[] {
  const catalog = [
    '個人賠償',
    '車両保険',
    '車内清掃費用特約',
    '灯油専用',
    '自己判断',
    '領収書',
    '見積',
    '契約',
    '写真',
    '家族以外',
    '火災保険',
    '子ども',
    '自分の車',
    keroseneSeatPrice,
    pricingPartial[0].price
  ];
  return catalog.filter((token) => text.includes(token));
}

/** Keep the primary answer, then append sentences that add a fact it does not already state. */
export function mergeFaqAnswers(primary: string, extras: string[]): string {
  const kept = splitJaSentences(primary);
  const seen = new Set(kept.map(sentenceKey));
  const covered = new Set(factTokens(kept.join('')));
  for (const extra of extras) {
    for (const sentence of splitJaSentences(extra)) {
      const key = sentenceKey(sentence);
      if (!key || seen.has(key)) continue;
      const tokens = factTokens(sentence);
      const novel = tokens.filter((token) => !covered.has(token));
      if (tokens.length > 0 && novel.length === 0) continue;
      if (tokens.length === 0) {
        const alreadySaid = [...seen].some(
          (existing) => existing.length >= 12 && (existing.includes(key) || key.includes(existing))
        );
        if (alreadySaid) continue;
      }
      kept.push(sentence.endsWith('。') ? sentence : `${sentence}。`);
      seen.add(key);
      for (const token of tokens) covered.add(token);
    }
  }
  return kept.join('');
}

/**
 * Collapse near-duplicate pricing or insurance questions into one entry.
 * The more specific question (region name, then length) is kept.
 * Unique sentences from the others are appended to that answer.
 */
export function collapseNearDuplicateFaqs(
  faqs: LpFaq[],
  regionName: string,
  regionFull: string
): LpFaq[] {
  const clusters = new Map<'pricing' | 'insurance', number[]>();
  faqs.forEach((faq, index) => {
    const cluster = faqCluster(faq.q);
    if (!cluster) return;
    const indexes = clusters.get(cluster) ?? [];
    indexes.push(index);
    clusters.set(cluster, indexes);
  });

  const drop = new Set<number>();
  const replacements = new Map<number, LpFaq>();

  for (const indexes of clusters.values()) {
    if (indexes.length < 2) continue;
    const ranked = [...indexes].sort((a, b) => {
      const score = faqSpecificity(faqs[b].q, regionName, regionFull) - faqSpecificity(faqs[a].q, regionName, regionFull);
      return score !== 0 ? score : a - b;
    });
    const winner = ranked[0];
    const rest = ranked.slice(1);
    replacements.set(winner, {
      q: faqs[winner].q,
      a: mergeFaqAnswers(
        faqs[winner].a,
        rest.map((index) => faqs[index].a)
      )
    });
    for (const index of rest) drop.add(index);
  }

  return faqs.flatMap((faq, index) => {
    if (drop.has(index)) return [];
    return [replacements.get(index) ?? faq];
  });
}

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
  return collapseNearDuplicateFaqs(
    [coverage, serviceDefinitionFaq, ...buildAioPriorityFaqs(regionSlug), ...extras, ...baseLpFaqs],
    regionName,
    regionFull
  );
}
