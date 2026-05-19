import {
  BUSINESS_NAME,
  CONTACT_EMAIL,
  SITE_CANONICAL_ORIGIN,
  TEL_DISPLAY
} from '../data/site';
import { canonicalUrl, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';

function telE164(): string {
  const digits = `81${TEL_DISPLAY.replace(/\D/g, '').replace(/^0/, '')}`;
  return `+${digits}`;
}

/** 全ページ共通：Organization + WebSite */
export function siteOrganizationNode(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': SITE_ORGANIZATION_ID,
    name: BUSINESS_NAME,
    url: canonicalUrl('/'),
    logo: `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/favicon.png`,
    telephone: telE164(),
    email: CONTACT_EMAIL
  };
}

export function siteWebSiteNode(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': SITE_WEBSITE_ID,
    url: canonicalUrl('/'),
    name: BUSINESS_NAME,
    inLanguage: 'ja-JP',
    publisher: { '@id': SITE_ORGANIZATION_ID }
  };
}

export function webPageNode(input: {
  path: string;
  name: string;
  description: string;
  type?: string;
  aboutId?: string;
  mainEntityId?: string;
}): Record<string, unknown> {
  const url = canonicalUrl(input.path);
  const webpageId = `${url.replace(/\/$/, '')}#webpage`;
  const node: Record<string, unknown> = {
    '@type': input.type ?? 'WebPage',
    '@id': webpageId,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { '@id': SITE_WEBSITE_ID },
    inLanguage: 'ja-JP'
  };
  if (input.aboutId) node.about = { '@id': input.aboutId };
  if (input.mainEntityId) node.mainEntity = { '@id': input.mainEntityId };
  return node;
}

/** LP 以外の静的ページ用（Organization + WebSite + WebPage） */
export function buildPageJsonLd(input: {
  path: string;
  title: string;
  description: string;
  pageType?: string;
}): Record<string, unknown> {
  return buildJsonLdGraph([
    siteOrganizationNode(),
    siteWebSiteNode(),
    webPageNode({
      path: input.path,
      name: input.title,
      description: input.description,
      type: input.pageType ?? 'WebPage'
    })
  ]);
}
