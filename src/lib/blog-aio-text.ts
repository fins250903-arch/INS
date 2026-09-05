import { getBlogTopic, AIO_ANSWER_END, AIO_ANSWER_START, type LpHeadingLink } from '../data/blog-topics';
import { resolveStoreLpPath } from '../data/region-lp-links';

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

  return `${AIO_ANSWER_START}
## 結論（先に読む）

**${replaceRegionPlaceholder(topic.answer, regionFull)}**

${bullets}

[${regionFull}の${primaryHeading.label}](${lpHref})もあわせて確認できます。${extra}
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
