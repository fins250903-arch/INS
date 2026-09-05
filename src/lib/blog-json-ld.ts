import { BUSINESS_NAME } from '../data/site';
import { canonicalUrl, pageId, SITE_ORGANIZATION_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import { siteOrganizationNode, siteWebSiteNode, webPageNode } from './json-ld-site';

export type BlogJsonLdRelated = {
  href: string;
  name: string;
};

/** ブログ記事用 JSON-LD（@graph：BlogPosting + WebPage + optional FAQ） */
export function buildBlogPostJsonLd(input: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  imageUrl?: string;
  keywords?: string;
  regionFull?: string;
  answer?: string;
  related?: BlogJsonLdRelated[];
  lpUrl?: string;
  faqs?: { q: string; a: string }[];
}): Record<string, unknown> {
  const path = input.path.endsWith('/') ? input.path : `${input.path}/`;
  const url = canonicalUrl(path);
  const baseId = pageId(path);
  const articleId = `${baseId}#article`;
  const webpageId = `${baseId}#webpage`;

  const article: Record<string, unknown> = {
    '@type': 'BlogPosting',
    '@id': articleId,
    headline: input.title,
    description: input.description,
    url,
    datePublished: input.datePublished,
    inLanguage: 'ja-JP',
    author: { '@id': SITE_ORGANIZATION_ID },
    publisher: { '@id': SITE_ORGANIZATION_ID },
    mainEntityOfPage: { '@id': webpageId },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.wp-content h2:first-of-type', '.wp-content > p:first-of-type', '.aio-related']
    }
  };

  if (input.imageUrl) {
    article.image = input.imageUrl;
  }
  if (input.keywords) {
    article.keywords = input.keywords;
  }
  if (input.regionFull) {
    article.about = {
      '@type': 'Service',
      name: `${input.regionFull}の出張車内清掃`,
      areaServed: input.regionFull
    };
  }
  if (input.answer) {
    article.abstract = input.answer;
  }
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
    mainEntityId: articleId
  });
  webpage['@id'] = webpageId;

  const nodes: Record<string, unknown>[] = [
    siteOrganizationNode(),
    siteWebSiteNode(),
    webpage,
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

  return buildJsonLdGraph(nodes);
}
