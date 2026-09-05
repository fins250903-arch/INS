import { BLOG_TOPICS, type BlogTopicId } from './blog-topics';

export type ArticleTemplate = {
  id: BlogTopicId | 'blank';
  label: string;
  description: string;
  suggestedCategories: string[];
  body: string;
};

const TEMPLATE_ORDER: (BlogTopicId | 'blank')[] = [
  'vomit',
  'insurance',
  'smell',
  'kerosene',
  'pet',
  'ranking',
  'outreach',
  'diy',
  'fish',
  'coffee',
  'blank'
];

function topicTemplate(id: BlogTopicId, extra: { description: string; categories: string[] }): ArticleTemplate {
  const topic = BLOG_TOPICS[id];
  const bullets = topic.bullets.map((item) => `- ${item}`).join('\n');
  const lpLines = topic.lpHeadings
    .map((heading) => `- [${heading.label}](/osaka/#${heading.id})`)
    .join('\n');

  return {
    id,
    label: topic.label,
    description: extra.description,
    suggestedCategories: extra.categories,
    body: `<!-- aio-answer-first -->
## 結論（先に読む）

**${topic.answer}**

${bullets}

[対応エリアの${topic.lpHeadings[0].label}](/osaka/#${topic.lpHeadings[0].id})もあわせて確認できます。

### 今すぐ対応エリアで依頼する

- [電話 070-8428-0866](tel:070-8428-0866)（365日24時間・見積無料・立会不要）
- [メールで問い合わせ](/contact/)
- [料金表](/osaka/#heading-pricing)
<!-- /aio-answer-first -->

## 現場でよくある状況

（地域名・車種・いつ起きたかを具体的に書く）

## 自分でできる応急処置

1. 
2. 
3. 

やってはいけないこと：熱・塩素・強い摩擦・消臭スプレーの上塗り。

## プロに頼む判断

次のどれかに当てはまる場合は、出張車内清掃へ。

- シートの芯まで染みた
- 翌日以降も臭いが戻る
- 保険の見積書が必要

## 料金・保険・比較

${lpLines}

## まとめ

結論を1文で繰り返す。次のアクション（電話・見積）を書く。
`
  };
}

export const ARTICLE_TEMPLATES: ArticleTemplate[] = TEMPLATE_ORDER.map((id) => {
  if (id === 'blank') {
    return {
      id: 'blank',
      label: '空のAIO骨格',
      description: '結論見出しだけ入った汎用テンプレート',
      suggestedCategories: ['seisou'],
      body: `<!-- aio-answer-first -->
## 結論（先に読む）

**（質問に対する答えを2文で書く。地域名と料金目安を入れる）**

- 要点1
- 要点2
- 要点3

[料金表](/osaka/#heading-pricing) / [応急処置](/osaka/#heading-emergency-first-aid) / [保険の目安](/osaka/#heading-insurance-matrix)

### 今すぐ対応エリアで依頼する

- [電話 070-8428-0866](tel:070-8428-0866)（365日24時間・見積無料・立会不要）
- [メールで問い合わせ](/contact/)
- [料金表](/osaka/#heading-pricing)
<!-- /aio-answer-first -->

## 詳細

`
    };
  }

  const meta: Record<BlogTopicId, { description: string; categories: string[] }> = {
    vomit: { description: '車内嘔吐の応急処置とプロ判断', categories: ['outo1', 'seisou'] },
    'vomit-dont': { description: '嘔吐物処理の禁止事項', categories: ['outo2', 'seisou'] },
    insurance: { description: '個人賠償・車両保険', categories: ['hoken', 'outo3'] },
    smell: { description: '車内消臭・生活臭', categories: ['nioi', 'seisou'] },
    urine: { description: 'おしっこ・尿臭', categories: ['nyou', 'seisou'] },
    pet: { description: 'ペット粗相・獣臭', categories: ['pet', 'seisou'] },
    tobacco: { description: 'タバコ・ヤニ', categories: ['yani', 'seisou'] },
    ozone: { description: 'オゾン脱臭', categories: ['ozon', 'seisou'] },
    fish: { description: '魚臭・海鮮汁', categories: ['nioi', 'seisou'] },
    coffee: { description: 'コーヒー・飲みこぼし', categories: ['stain', 'seisou'] },
    kerosene: { description: '灯油こぼし', categories: ['touyu', 'seisou'] },
    mice: { description: 'ネズミ被害', categories: ['nezumi'] },
    ranking: { description: '業者比較・ランキング', categories: ['ranking'] },
    diy: { description: '自分で掃除', categories: ['diy', 'seisou'] },
    seatbelt: { description: 'シートベルト洗浄', categories: ['seatbelt', 'seisou'] },
    floor: { description: 'フロア洗浄', categories: ['yuka', 'seisou'] },
    feces: { description: '排泄物', categories: ['un', 'seisou'] },
    cupmen: { description: 'カップ麺・スープ', categories: ['stain', 'seisou'] },
    mold: { description: '車内カビ', categories: ['kabi', 'seisou'] },
    leather: { description: 'レザーケア', categories: ['leather'] },
    window: { description: '内窓', categories: ['window'] },
    carwash: { description: '洗車・水垢', categories: ['carwash'] },
    outreach: { description: '出張車内清掃の選び方', categories: ['syuttyou', 'seisou'] },
    milk: { description: '牛乳・乳製品', categories: ['stain', 'seisou'] },
    oil: { description: 'オイル汚れ', categories: ['oil', 'seisou'] },
    general: { description: '総合', categories: ['seisou'] }
  };

  return topicTemplate(id, meta[id]);
});

export function getArticleTemplate(id: string): ArticleTemplate | undefined {
  return ARTICLE_TEMPLATES.find((item) => item.id === id);
}
