/**
 * Writes public/llms.txt from the pricing table so published prices cannot drift.
 *
 *   npm run llms
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  additionalNotes,
  pricingLabel,
  pricingOptions,
  pricingPartial,
  pricingPartialDeodorizeNote,
  pricingSet
} from '../src/data/lp-pricing.ts';
import {
  BUSINESS_NAME,
  LINE_OFFICIAL_URL,
  SITE_CANONICAL_ORIGIN,
  TEL_DISPLAY
} from '../src/data/site.ts';

const origin = SITE_CANONICAL_ORIGIN.replace(/\/$/, '');

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
  '## 料金（税込。src/data/lp-pricing.ts と同一）',
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
  ...additionalNotes.map((note) => `- ${note}`),
  '',
  '## 主要ページ',
  '',
  `- [大阪府の出張車内清掃](${origin}/osaka/)`,
  `- [料金表](${origin}/osaka/#heading-pricing)`,
  `- [お問い合わせ](${origin}/contact/)`,
  `- [ブログ](${origin}/blog/)`,
  `- [兵庫県](${origin}/hyougo/)`,
  `- [滋賀県](${origin}/siga/)`,
  `- [福岡県](${origin}/fukuoka/)`,
  `- [埼玉県](${origin}/saitama/)`,
  `- [愛知県](${origin}/aiti/)`,
  `- [プライバシーポリシー](${origin}/privacy/)`,
  `- [利用規約](${origin}/terms/)`,
  ''
];

const output = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/llms.txt');
writeFileSync(output, lines.join('\n'));
console.log(`Wrote ${output}`);
