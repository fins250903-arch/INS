/**
 * Human summary (/aio/) and the llms.txt pair. Prices, phone, areas, and FAQ
 * answers are read from the same sources as the landing pages.
 */
import { LP_FV_BASE_PRICE_LINE, LP_FV_PARTIAL_ENTRY_LINE } from './lp-aio-content';
import { baseLpFaqs, serviceDefinitionFaq, type LpFaq } from './lp-faqs';
import {
  additionalNotes,
  baseInteriorPriceRange,
  basePriceFaqAnswer,
  pricingLabel,
  pricingOptions,
  pricingPartial,
  pricingPartialDeodorizeNote,
  pricingSet
} from './lp-pricing';
import { listServiceRegions, type ServiceRegion } from './service-regions';
import {
  BUSINESS_NAME,
  CONTACT_FORM_PATH,
  HQ_ADDRESS_LINE,
  LINE_OFFICIAL_URL,
  SITE_CANONICAL_ORIGIN,
  SITE_CONTENT_UPDATED,
  SITE_PERSON_JOB_TITLE,
  SITE_PERSON_NAME,
  TEL_DISPLAY
} from './site';

export type AioFaq = { question: string; answer: string };

function origin(): string {
  return SITE_CANONICAL_ORIGIN.replace(/\/$/, '');
}

function baseFaqAnswer(part: string): string {
  const faq = baseLpFaqs.find((item) => item.q.includes(part));
  if (!faq) throw new Error(`Missing base FAQ containing: ${part}`);
  return faq.a;
}

export function listAioServiceRegions(): ServiceRegion[] {
  return listServiceRegions();
}

export function aioContentUpdatedLabel(): string {
  const [year, month, day] = SITE_CONTENT_UPDATED.split('-');
  return `${year}年${Number(month)}月${Number(day)}日`;
}

/** Conclusion-first summary. Amounts come from lp-pricing.ts. */
export function aioConclusion(): string {
  return `${BUSINESS_NAME}は、お客様のご自宅・勤務先の駐車場へ専門スタッフが訪問し、シートやフロアを洗浄・消臭する出張車内清掃です。店舗に車を預ける必要はありません。${LP_FV_BASE_PRICE_LINE}。${LP_FV_PARTIAL_ENTRY_LINE}。料金範囲（priceRange）は${baseInteriorPriceRange()}です。電話は${TEL_DISPLAY}、受付は365日24時間、見積無料・立会不要です。`;
}

export function aioMetaDescription(): string {
  return `${BUSINESS_NAME}の要約です。${LP_FV_BASE_PRICE_LINE}。${LP_FV_PARTIAL_ENTRY_LINE}。料金範囲（priceRange）は${baseInteriorPriceRange()}です。電話は${TEL_DISPLAY}。本社所在地と出張エリアは別です。`;
}

export function aioWhat(): string {
  return serviceDefinitionFaq.a;
}

/** Company address. This is not a storefront in each prefecture. */
export function aioHeadOfficeNote(): string {
  return `会社の所在地（本社・会社情報）は${HQ_ADDRESS_LINE}です。この住所は来店する店舗でも、作業する場所でもありません。各都道府県に店舗はなく、作業はご依頼の駐車場で行います。`;
}

export function aioAreaSentence(): string {
  const names = listServiceRegions()
    .map((region) => region.regionFull)
    .join('、');
  return `出張対応エリアは${names}です。お電話（${TEL_DISPLAY}）で郵便番号をお伺いし、対応可否をお伝えします。山間部や離島など、難しいエリアは事前にご案内します。`;
}

export function aioFaqs(): AioFaq[] {
  const howMuch = `${LP_FV_BASE_PRICE_LINE}。${LP_FV_PARTIAL_ENTRY_LINE}。料金範囲（priceRange）は${baseInteriorPriceRange()}です。${basePriceFaqAnswer()}`;
  return [
    {
      question: '何を（What）：出張車内清掃とは何ですか？',
      answer: aioWhat()
    },
    {
      question: 'なぜ（Why）：なぜ店舗に車を預けないのですか？',
      answer: `店舗へ車を預けず、その場の駐車場で臭いの発生源から洗うためです。${baseFaqAnswer('待ち方')}`
    },
    {
      question: '誰が（Who）：誰が対応しますか？',
      answer: `${BUSINESS_NAME}の${SITE_PERSON_JOB_TITLE}（${SITE_PERSON_NAME}）が、嘔吐・尿・灯油・タバコ臭などの洗浄と消臭を担当します。電話番号は${TEL_DISPLAY}です。`
    },
    {
      question: 'いつ（When）：いつ依頼でき、作業時間はどれくらいですか？',
      answer: `${baseFaqAnswer('時間帯')}${baseFaqAnswer('作業時間')}`
    },
    {
      question: 'どこで（Where）：どこで作業し、どの地域へ出張しますか？',
      answer: `${aioHeadOfficeNote()}${aioAreaSentence()}`
    },
    {
      question: 'どのように（How）：どのように依頼すればよいですか？',
      answer: `電話 ${TEL_DISPLAY}、問い合わせフォーム、またはLINE（${LINE_OFFICIAL_URL}）です。${baseFaqAnswer('保険')}`
    },
    {
      question: 'いくら（How much）：料金はいくらですか？',
      answer: howMuch
    }
  ];
}

export function aioFaqEntities(): LpFaq[] {
  return aioFaqs().map((faq) => ({ q: faq.question, a: faq.answer }));
}

export function aioPrimaryLinks(): { href: string; label: string }[] {
  const root = origin();
  return [
    { href: `${root}/aio/`, label: 'AI検索向けの要約' },
    { href: `${root}/llms-full.txt`, label: '全文（llms-full.txt）' },
    { href: `${root}/llms.txt`, label: '短い索引（llms.txt）' },
    { href: `${root}/osaka/`, label: '大阪府の出張車内清掃' },
    { href: `${root}/osaka/#heading-pricing`, label: '料金表' },
    { href: `${root}/contact/`, label: 'お問い合わせ' },
    { href: `${root}/blog/`, label: 'ブログ' },
    { href: `${root}/hyougo/`, label: '兵庫県' },
    { href: `${root}/siga/`, label: '滋賀県' },
    { href: `${root}/fukuoka/`, label: '福岡県' },
    { href: `${root}/saitama/`, label: '埼玉県' },
    { href: `${root}/aiti/`, label: '愛知県' },
    { href: `${root}/privacy/`, label: 'プライバシーポリシー' },
    { href: `${root}/terms/`, label: '利用規約' }
  ];
}

function pricingMarkdown(): string[] {
  return [
    '## 料金（税込。src/data/lp-pricing.ts と同一）',
    '',
    `料金範囲（priceRange）: ${baseInteriorPriceRange()}`,
    '',
    '### セットパック（車内清掃＋嘔吐・うんちの加算）',
    '',
    ...pricingSet.map(
      (row) =>
        `- ${pricingLabel(row.label)}: 車内清掃 ${row.interiorCleaning} / 加算 ${row.addon} / 合計 ${row.total}`
    ),
    '',
    '### 部分クリーニング',
    '',
    `- ${LP_FV_PARTIAL_ENTRY_LINE}`,
    `- ${pricingPartialDeodorizeNote}`,
    ...pricingPartial.map(
      (row) => `- ${row.label}: ${row.price}（消臭・脱臭セット ${row.deodorizeSet}）`
    ),
    '',
    '### オプション',
    '',
    ...pricingOptions.map((row) => `- ${row.label}: ${row.price}`),
    '',
    '### 別途お見積り',
    '',
    ...additionalNotes.map((note) => `- ${note}`)
  ];
}

/** Short index. Same pricing block as before, plus links to /aio/ and /llms-full.txt. */
export function renderLlmsTxt(): string {
  const links = aioPrimaryLinks().filter((link) => new URL(link.href).pathname !== '/llms.txt');
  const lines = [
    `# ${BUSINESS_NAME}`,
    '',
    '> お客様のご自宅・勤務先の駐車場へ専門スタッフが訪問し、シートやフロアを洗浄・消臭する出張車内清掃です。店舗に車を預ける必要はありません。',
    '',
    `- 電話: ${TEL_DISPLAY}`,
    '- 受付: 365日24時間',
    `- LINE: ${LINE_OFFICIAL_URL}`,
    '- お見積りは無料です。お見積り後の追加請求はありません。オプションと地域による出張費は、お見積りの時点で料金表に沿って提示します。',
    '',
    ...pricingMarkdown(),
    '',
    '## 主要ページ',
    '',
    ...links.map((link) => `- [${link.label}](${link.href})`),
    ''
  ];
  return lines.join('\n');
}

/** Full-text companion: conclusion, areas, head office, prices, and 5W2H FAQs. */
export function renderLlmsFullTxt(): string {
  const root = origin();
  const lines = [
    `# ${BUSINESS_NAME}（全文）`,
    '',
    `> ${aioConclusion()}`,
    '',
    `最終更新: ${SITE_CONTENT_UPDATED}`,
    `要約ページ: ${root}/aio/`,
    `短い索引: ${root}/llms.txt`,
    '',
    '## これは何か',
    '',
    aioWhat(),
    '',
    '## 本社と出張エリア',
    '',
    aioHeadOfficeNote(),
    '',
    '会社所在地は Organization の住所です。都道府県ページの ProfessionalService は、その県の areaServed だけを持ち、本社住所や緯度経度は持ちません。',
    '',
    aioAreaSentence(),
    '',
    ...listServiceRegions().map((region) => {
      const detail = region.description ? `: ${region.description}` : '';
      return `- [${region.regionFull}](${root}/${region.slug}/)${detail}`;
    }),
    '',
    ...pricingMarkdown(),
    '',
    '## 連絡先',
    '',
    `- 電話: ${TEL_DISPLAY}`,
    '- 受付: 365日24時間',
    `- 問い合わせフォーム: ${root}${CONTACT_FORM_PATH}`,
    `- LINE: ${LINE_OFFICIAL_URL}`,
    `- 担当: ${SITE_PERSON_JOB_TITLE}（${SITE_PERSON_NAME}）`,
    '',
    '## よくある質問（5W2H）',
    '',
    ...aioFaqs().flatMap((faq) => [`### ${faq.question}`, '', faq.answer, '']),
    '## 主要ページ',
    '',
    ...aioPrimaryLinks().map((link) => `- [${link.label}](${link.href})`),
    ''
  ];
  return lines.join('\n');
}
