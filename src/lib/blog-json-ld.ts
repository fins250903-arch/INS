import { BUSINESS_NAME } from '../data/site';
import { canonicalUrl, pageId, SITE_ORGANIZATION_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import { siteOrganizationNode, siteWebSiteNode, webPageNode } from './json-ld-site';

/** ブログ記事用 JSON-LD（@graph：BlogPosting + WebPage） */
export function buildBlogPostJsonLd(input: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
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
    mainEntityOfPage: { '@id': webpageId }
  };

  const webpage = webPageNode({
    path,
    name: `${input.title}｜${BUSINESS_NAME}`,
    description: input.description,
    type: 'WebPage',
    mainEntityId: articleId
  });
  webpage['@id'] = webpageId;

  return buildJsonLdGraph([siteOrganizationNode(), siteWebSiteNode(), webpage, article]);
}
