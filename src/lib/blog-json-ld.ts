import { BUSINESS_NAME, SITE_CONTENT_UPDATED, SITE_PERSON_NAME } from '../data/site';
import { canonicalUrl, pageId, SITE_ORGANIZATION_ID, SITE_PERSON_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import { siteOrganizationNode, sitePersonNode, siteWebSiteNode, webPageNode } from './json-ld-site';

export type BlogJsonLdRelated = {
  href: string;
  name: string;
};

export function buildBlogPostJsonLd(input: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string;
  keywords?: string;
  regionFull?: string;
  answer?: string;
  related?: BlogJsonLdRelated[];
  lpUrl?: string;
  faqs?: { q: string; a: string }[];
  howtoSteps?: string[];
  howtoName?: string;
}): Record<string, unknown> {
  const path = input.path.endsWith('/') ? input.path : `${input.path}/`;
  const url = canonicalUrl(path);
  const baseId = pageId(path);
  const articleId = `${baseId}#article`;
  const webpageId = `${baseId}#webpage`;
  const breadcrumbId = `${baseId}#breadcrumb`;
  const howtoId = `${baseId}#howto`;
  const dateModified = input.dateModified || SITE_CONTENT_UPDATED;

  const article: Record<string, unknown> = {
    '@type': 'BlogPosting',
    '@id': articleId,
    headline: input.title,
    description: input.description,
    url,
    datePublished: input.datePublished,
    dateModified,
    inLanguage: 'ja-JP',
    author: { '@id': SITE_PERSON_ID },
    publisher: { '@id': SITE_ORGANIZATION_ID },
    mainEntityOfPage: { '@id': webpageId },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.aio-article-body h2:first-of-type', '.aio-answer', '.aio-related']
    }
  };

  if (input.imageUrl) article.image = input.imageUrl;
  if (input.keywords) article.keywords = input.keywords;
  if (input.regionFull) {
    article.about = {
      '@type': 'Service',
      name: `${input.regionFull}の出張車内清掃`,
      areaServed: input.regionFull,
      provider: { '@id': SITE_ORGANIZATION_ID }
    };
  }
  if (input.answer) article.abstract = input.answer;
  if (input.related && input.related.length > 0) {
    article.citation = input.related.map((item) => ({
      '@type': 'CreativeWork',
      name: item.name,
      url: canonicalUrl(item.href)
    }));
  }
  if (input.lpUrl) {
    article.isPartOf = {
      '@type': 'WebPage',
      url: canonicalUrl(input.lpUrl)
    };
  }

  const webpage = webPageNode({
    path,
    name: `${input.title}｜${BUSINESS_NAME}`,
    description: input.description,
    type: 'WebPage',
    mainEntityId: articleId,
    authorId: SITE_PERSON_ID,
    breadcrumbId,
    dateModified,
    hasPartId: input.faqs && input.faqs.length > 0 ? `${baseId}#faq` : undefined
  });
  webpage['@id'] = webpageId;

  const regionName = input.regionFull || 'ブログ';
  const regionPath = input.lpUrl || '/blog/';
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: BUSINESS_NAME, item: canonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'ブログ', item: canonicalUrl('/blog/') },
      { '@type': 'ListItem', position: 3, name: regionName, item: canonicalUrl(regionPath) },
      { '@type': 'ListItem', position: 4, name: input.title, item: url }
    ]
  };

  const nodes: Record<string, unknown>[] = [
    siteOrganizationNode(),
    sitePersonNode(),
    siteWebSiteNode(),
    webpage,
    breadcrumb,
    article
  ];

  if (input.faqs && input.faqs.length > 0) {
    nodes.push({
      '@type': 'FAQPage',
      '@id': `${baseId}#faq`,
      mainEntity: input.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a
        }
      }))
    });
  }

  if (input.howtoSteps && input.howtoSteps.length > 0) {
    nodes.push({
      '@type': 'HowTo',
      '@id': howtoId,
      name: input.howtoName || `${input.title}の手順`,
      description: input.answer || input.description,
      inLanguage: 'ja-JP',
      totalTime: 'PT15M',
      tool: 'キッチンペーパー・ゴム手袋・中性洗剤',
      step: input.howtoSteps.map((text, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: `手順${index + 1}`,
        text
      }))
    });
  }

  return buildJsonLdGraph(nodes);
}

export const BLOG_AUTHOR_BYLINE = SITE_PERSON_NAME;
