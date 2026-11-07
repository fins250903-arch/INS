import regionLpsExtra from '../data/region-lp-extra.json';
import regionLpsMain from '../data/region-lp.json';
import {
  BUSINESS_NAME,
  CONTACT_EMAIL,
  headquartersPostalAddress,
  LINE_OFFICIAL_URL,
  SITE_CONTENT_UPDATED,
  SITE_HOME_PATH,
  SITE_PERSON_IMAI_ID,
  SITE_PERSON_JOB_TITLE,
  SITE_PERSON_NAME,
  TEL_DISPLAY
} from '../data/site';
import { canonicalUrl, SITE_ORGANIZATION_ID, SITE_PERSON_ID, SITE_WEBSITE_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import { CREW_PHOTO_URL, ORGANIZATION_LOGO_URL, WORK_PHOTO_URLS } from './published-images';

/** Prefectures with a landing page. This is where crews visit, not the office address. */
function organizationAreaServed(): Record<string, string>[] {
  const names = new Set<string>();
  for (const region of [...regionLpsMain, ...regionLpsExtra]) {
    if (region.regionFull) names.add(region.regionFull);
  }
  return [...names].map((name) => ({ '@type': 'AdministrativeArea', name }));
}

function telE164(): string {
  const digits = `81${TEL_DISPLAY.replace(/\D/g, '').replace(/^0/, '')}`;
  return `+${digits}`;
}

const ORGANIZATION_SAME_AS = [LINE_OFFICIAL_URL] as const;

/** 全ページ共通：Organization + WebSite */
export function siteOrganizationNode(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': SITE_ORGANIZATION_ID,
    name: BUSINESS_NAME,
    url: canonicalUrl(SITE_HOME_PATH),
    logo: ORGANIZATION_LOGO_URL,
    image: WORK_PHOTO_URLS,
    telephone: telE164(),
    email: CONTACT_EMAIL,
    address: headquartersPostalAddress(),
    areaServed: organizationAreaServed(),
    sameAs: [...ORGANIZATION_SAME_AS],
    founder: { '@id': SITE_PERSON_IMAI_ID }
  };
}

export function sitePersonNode(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': SITE_PERSON_ID,
    name: SITE_PERSON_NAME,
    jobTitle: SITE_PERSON_JOB_TITLE,
    description:
      '出張車内清掃・車内クリーニングの現場責任者。嘔吐・尿・灯油・タバコ臭など深部染みの温水吸引洗浄と消臭を担当。',
    url: SITE_PERSON_ID,
    image: CREW_PHOTO_URL,
    worksFor: { '@id': SITE_ORGANIZATION_ID },
    knowsAbout: [
      '出張車内清掃',
      '車内クリーニング',
      '車内消臭',
      '嘔吐物・尿・灯油・タバコ臭の除去',
      'シート温水吸引洗浄'
    ]
  };
}

export function siteWebSiteNode(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': SITE_WEBSITE_ID,
    url: canonicalUrl(SITE_HOME_PATH),
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
  dateModified?: string;
  authorId?: string;
  breadcrumbId?: string;
  /** FAQPage 等の @id（WebPage.hasPart） */
  hasPartId?: string;
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
    inLanguage: 'ja-JP',
    dateModified: input.dateModified ?? SITE_CONTENT_UPDATED
  };
  if (input.aboutId) node.about = { '@id': input.aboutId };
  if (input.mainEntityId) node.mainEntity = { '@id': input.mainEntityId };
  if (input.authorId) node.author = { '@id': input.authorId };
  if (input.breadcrumbId) node.breadcrumb = { '@id': input.breadcrumbId };
  if (input.hasPartId) node.hasPart = { '@id': input.hasPartId };
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
      type: input.pageType ?? 'WebPage',
      authorId: SITE_PERSON_ID
    })
  ]);
}
