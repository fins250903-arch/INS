import { getBlogTopic, AIO_ANSWER_END, AIO_ANSWER_START, type LpHeadingLink } from '../data/blog-topics';
import { resolveStoreLpPath } from '../data/region-lp-links';
import { TEL_DISPLAY, TEL_HREF } from '../data/site';

export type RelatedPostLink = {
  href: string;
  label: string;
};

export function replaceRegionPlaceholder(text: string, regionFull: string): string {
  return text.replaceAll('{regionFull}', regionFull || '対応エリア');
}

export function resolveLpHeadingHref(regionSlug: string, regionFull: string, heading: LpHeadingLink): string {
  const lpPath = resolveStoreLpPath(regionSlug) || resolveStoreLpPath(regionFull) || '/osaka/';
  return `${lpPath}#${heading.id}`;
}

export function buildAnswerFirstMarkdown(input: {
  slug: string;
  title?: string;
  categories?: string[];
  regionFull: string;
  regionSlug: string;
  relatedPosts?: RelatedPostLink[];
}): string {
  const topic = getBlogTopic(input.slug, input.title, input.categories);
  const regionFull = input.regionFull || '対応エリア';
  const lpPath = resolveStoreLpPath(input.regionSlug) || resolveStoreLpPath(regionFull) || '/osaka/';
  const primaryHeading = topic.lpHeadings[0];
  const lpHref = `${lpPath}#${primaryHeading.id}`;
  const bullets = topic.bullets.map((item) => `- ${item}`).join('\n');
  const extraHeadings = topic.lpHeadings
    .slice(1)
    .map((heading) => `- [${heading.label}](${lpPath}#${heading.id})`)
    .join('\n');
  const extra = extraHeadings ? `\n\n${extraHeadings}` : '';
  const related =
    input.relatedPosts && input.relatedPosts.length > 0
      ? `\n\n### 関連する解説\n\n${input.relatedPosts
          .map((item) => `- [${item.label}](${item.href})`)
          .join('\n')}`
      : '';

  return `${AIO_ANSWER_START}
## 結論（先に読む）

**${replaceRegionPlaceholder(topic.answer, regionFull)}**

${bullets}

[${regionFull}の${primaryHeading.label}](${lpHref})もあわせて確認できます。${extra}

### 今すぐ${regionFull}で依頼する

- [電話 ${TEL_DISPLAY}](${TEL_HREF})（365日24時間・見積無料・立会不要）
- [メールで問い合わせ](/contact/)
- [${regionFull}の料金表](${lpPath}#heading-pricing)
${related}
${AIO_ANSWER_END}
`;
}

export function upsertAnswerFirstBlock(body: string, block: string): string {
  const trimmed = body.replace(/^\uFEFF/, '').trimStart();
  const start = trimmed.indexOf(AIO_ANSWER_START);
  const end = trimmed.indexOf(AIO_ANSWER_END);

  if (start !== -1 && end !== -1 && end > start) {
    const after = trimmed.slice(end + AIO_ANSWER_END.length).replace(/^\s*\n/, '');
    return `${block.trim()}\n\n${after}`.trim() + '\n';
  }

  return `${block.trim()}\n\n${trimmed}`.trim() + '\n';
}

export function hasAnswerFirstBlock(body: string): boolean {
  return body.includes(AIO_ANSWER_START) && body.includes(AIO_ANSWER_END);
}

const SLUG_ALIASES: Record<string, string> = {
  gorudendog: 'gorudendog1',
  outo3: 'outo3-2'
};

export type BlogHrefTarget = { region: string; slug: string };

export function rewriteInternalBlogHrefs(
  text: string,
  resolve: (slug: string, preferredRegion?: string) => BlogHrefTarget | null
): string {
  const skip = new Set(['region', 'category', 'tag', 'page']);

  const resolveSlug = (rawSlug: string, preferredRegion?: string) => {
    const aliased = SLUG_ALIASES[rawSlug] || rawSlug;
    return resolve(aliased, preferredRegion) || (aliased === rawSlug ? null : resolve(rawSlug, preferredRegion));
  };

  return text.replace(/\/blog\/([A-Za-z0-9_-]+)(?:\/([^/\s)"']+))?\/?/g, (match, first: string, second?: string) => {
    if (skip.has(first)) return match;
    if (second) {
      const hit = resolveSlug(second, first);
      return hit ? `/blog/${hit.region}/${hit.slug}/` : match;
    }
    const hit = resolveSlug(first);
    return hit ? `/blog/${hit.region}/${hit.slug}/` : match;
  });
}

export function rewriteLegacyUrls(text: string, regionSlug: string): string {
  let next = text;
  next = next.replace(/https?:\/\/(?:osak|hyg|siga)\.insbs\.net\/wp1\/contact\/?/gi, '/contact/');
  next = next.replace(/https?:\/\/insbs\.net\/ok2\/contact\/?/gi, '/contact/');
  next = next.replace(/https?:\/\/insbs\.net\/ok2\/tiba\/?/gi, '/tiba/');
  next = next.replace(/https?:\/\/insbs\.net\/ok2\/okinawa\/?/gi, '/okinawa/');
  next = next.replace(/https?:\/\/insbs\.net\/ok2\/saitama\/?/gi, '/saitama/');
  next = next.replace(/https?:\/\/insbs\.net\/ok2\/tokyou\/?/gi, '/tokyou/');
  next = next.replace(/https?:\/\/insbs\.net\/ok2\/aiti\/?/gi, '/aiti/');
  next = next.replace(/https?:\/\/siga\.insbs\.net\/wp1\/aiti\/?/gi, '/aiti/');
  next = next.replace(/https?:\/\/hyg\.insbs\.net\/wp1\/?/gi, '/hyougo/');

  next = next.replace(
    /https?:\/\/(?:insbs\.net\/ok2|osak\.insbs\.net\/wp1|hyg\.insbs\.net\/wp1|siga\.insbs\.net\/wp1)\/blog\/\d{4}\/\d{2}\/\d{2}\/([A-Za-z0-9_-]+)\/?/gi,
    (_match, rawSlug: string) => {
      const slug = SLUG_ALIASES[rawSlug] || rawSlug;
      return `/blog/${regionSlug}/${slug}/`;
    }
  );

  return next;
}

export function buildTopicFaqs(input: {
  slug: string;
  title?: string;
  categories?: string[];
  regionFull: string;
}): { q: string; a: string }[] {
  const topic = getBlogTopic(input.slug, input.title, input.categories);
  const regionFull = input.regionFull || '対応エリア';
  const answer = replaceRegionPlaceholder(topic.answer, regionFull);
  return [
    { q: `${topic.label}はどうすればいいですか？`, a: answer },
    {
      q: `${regionFull}で出張車内清掃は依頼できますか？`,
      a: `${regionFull}は駐車場完結の出張車内清掃に対応しています。365日24時間受付、立会不要、見積無料です。電話 ${TEL_DISPLAY} またはお問い合わせフォームから依頼できます。`
    },
    {
      q: '料金の目安はいくらですか？',
      a: '税込の基本料金の目安は軽自動車・軽SUV 22,000円、普通車 28,000円、大型車・SUV・ミニバン 36,000円です。嘔吐・灯油などは加算や専用洗浄があるため、現地見積が正確です。'
    },
    {
      q: '自分で掃除してもいいですか？',
      a: `${topic.bullets[0]}。熱・塩素・強い摩擦・消臭スプレーの上塗りは避けてください。シートの芯まで染みた、または翌日も臭いが戻る場合はプロの温水吸引が安全です。`
    },
    {
      q: '車内清掃に保険は使えますか？',
      a: '他人の車を汚した場合は個人賠償責任保険、自分の車なら車両保険（一般型）や車内清掃費用特約が使えることがあります。清掃前の写真撮影と保険会社への確認が先です。見積書・領収書は発行できます。'
    }
  ];
}
