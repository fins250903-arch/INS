import type { LpFaq } from '../data/lp-faqs';
import { buildRegionFaqs } from '../data/lp-faqs';
import type { CaseStudiesBlock } from '../data/lp-region-case-studies';
import {
  BUSINESS_NAME,
  CONTACT_EMAIL,
  SITE_CANONICAL_ORIGIN,
  SITE_CONTENT_UPDATED,
  TEL_DISPLAY
} from '../data/site';
import { pricingSet } from '../data/lp-pricing';
import { canonicalUrl, pageId, SITE_ORGANIZATION_ID, SITE_PERSON_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import {
  siteOrganizationNode,
  sitePersonNode,
  siteWebSiteNode,
  webPageNode
} from './json-ld-site';

const LP_PRICE_RANGE = '22000-36000';

const SERVICE_SUBJECT_OF = [
  { '@type': 'BlogPosting', url: canonicalUrl('/blog/outo1/'), name: '車内で嘔吐！でも大丈夫な対応方法' },
  { '@type': 'BlogPosting', url: canonicalUrl('/blog/no1/'), name: '愛車のニオイ撃退！車内徹底消臭クリーニング術' },
  { '@type': 'BlogPosting', url: canonicalUrl('/blog/outo3-2/'), name: '他人の車に嘔吐は個人賠償責任保険で解決できる？' }
];

function blogPostingNode(href: string, name: string): Record<string, unknown> {
  return { '@type': 'BlogPosting', url: canonicalUrl(href), name };
}

/** 地区LPの施工事例リンクを subjectOf に反映（重複URLは除外） */
export function subjectOfFromCaseStudies(block?: CaseStudiesBlock): Record<string, unknown>[] {
  if (!block) return [];
  return block.items.map((item) => blogPostingNode(item.href, item.linkLabel));
}

function mergeSubjectOf(
  regional: Record<string, unknown>[],
  fallback: Record<string, unknown>[]
): Record<string, unknown>[] {
  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];
  for (const node of [...regional, ...fallback]) {
    const url = node.url as string | undefined;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    merged.push(node);
  }
  return merged;
}

function yenToNumber(label: string): number {
  const digits = label.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function telE164(): string {
  const digits = `81${TEL_DISPLAY.replace(/\D/g, '').replace(/^0/, '')}`;
  return `+${digits}`;
}

function faqPageNode(pageBaseId: string, faqs: LpFaq[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    '@id': `${pageBaseId}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };
}

function breadcrumbNode(
  pageBaseId: string,
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageBaseId}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path)
    }))
  };
}

export type BuildLpJsonLdInput = {
  /** 例: `/` または `/nara/` */
  path: string;
  regionFull: string;
  regionName: string;
  description: string;
  pageTitle?: string;
  faqs?: LpFaq[];
  localBusinessDescription?: string;
  serviceName?: string;
  serviceType?: string[];
  subjectOf?: Record<string, unknown>[];
  /** 地区ごとの施工事例・解説記事（subjectOf・LocalBusiness説明に反映） */
  caseStudies?: CaseStudiesBlock;
  /** 地区FAQ（lp-faqs-region）用スラッグ */
  regionSlug?: string;
  breadcrumbMiddle?: { name: string; path: string };
};

/**
 * LP（トップ・エリア別・キーワード）用 JSON-LD（@graph 単一ドキュメント）
 */
export function buildLpJsonLd(input: BuildLpJsonLdInput): Record<string, unknown> {
  const pageUrl = canonicalUrl(input.path);
  const baseId = pageId(input.path);
  const serviceId = `${baseId}#service`;
  const localBusinessId = `${baseId}#localbusiness`;
  const breadcrumbId = `${baseId}#breadcrumb`;
  const faqId = `${baseId}#faq`;
  const tel = telE164();

  const faqs =
    input.faqs ??
    buildRegionFaqs(input.regionName, input.regionFull, input.regionSlug);

  const subjectOf =
    input.subjectOf ??
    mergeSubjectOf(subjectOfFromCaseStudies(input.caseStudies), SERVICE_SUBJECT_OF);

  const catalogItems = pricingSet.map((row, i) => ({
    '@type': 'Offer',
    position: i + 1,
    name: row.label,
    price: yenToNumber(row.price),
    priceCurrency: 'JPY',
    availability: 'https://schema.org/InStock',
    url: pageUrl
  }));

  const service: Record<string, unknown> = {
    '@type': 'Service',
    '@id': serviceId,
    name:
      input.serviceName ??
      `${BUSINESS_NAME}｜${input.regionFull}の出張車内清掃・車内クリーニング`,
    serviceType: input.serviceType ?? [
      '出張車内清掃',
      '車内クリーニング',
      '嘔吐・尿・ペット臭・灯油・シート洗浄',
      '消臭'
    ],
    description: input.description,
    url: pageUrl,
    dateModified: SITE_CONTENT_UPDATED,
    provider: { '@id': SITE_ORGANIZATION_ID },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: input.regionFull
    },
    offers: {
      '@type': 'OfferCatalog',
      name: '車内クリーニング基本料金（税込・目安）',
      itemListElement: catalogItems
    },
    subjectOf
  };

  const lbDescription = input.localBusinessDescription ?? input.description;

  const localBusiness: Record<string, unknown> = {
    '@type': 'ProfessionalService',
    '@id': localBusinessId,
    name: `${BUSINESS_NAME}（${input.regionFull}）`,
    description: lbDescription,
    url: pageUrl,
    subjectOf,
    telephone: tel,
    email: CONTACT_EMAIL,
    priceRange: LP_PRICE_RANGE,
    image: `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/favicon.png`,
    parentOrganization: { '@id': SITE_ORGANIZATION_ID },
    employee: { '@id': SITE_PERSON_ID },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressRegion: input.regionFull
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: input.regionFull
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      opens: '00:00',
      closes: '23:59'
    },
    makesOffer: {
      '@type': 'Offer',
      itemOffered: { '@id': serviceId },
      priceCurrency: 'JPY',
      description: `軽自動車 ${pricingSet[0].price}〜／${pricingSet[2].label} ${pricingSet[2].price}（税込・基本）`
    }
  };

  const pageName =
    input.pageTitle ?? `${input.regionName}｜${BUSINESS_NAME}出張車内清掃・車内クリーニング`;

  const breadcrumbItems = [
    { name: BUSINESS_NAME, path: '/' },
    ...(input.breadcrumbMiddle ? [input.breadcrumbMiddle] : []),
    { name: pageName, path: input.path }
  ];

  const webpage = webPageNode({
    path: input.path,
    name: pageName,
    description: input.description,
    type: 'WebPage',
    aboutId: serviceId,
    mainEntityId: localBusinessId,
    authorId: SITE_PERSON_ID,
    breadcrumbId,
    dateModified: SITE_CONTENT_UPDATED,
    hasPartId: faqId
  });

  return buildJsonLdGraph([
    siteOrganizationNode(),
    sitePersonNode(),
    siteWebSiteNode(),
    webpage,
    breadcrumbNode(baseId, breadcrumbItems),
    faqPageNode(baseId, faqs),
    service,
    localBusiness
  ]);
}

/** 地域×キーワード LP 用 */
export function buildKeywordLpJsonLd(input: {
  path: string;
  regionFull: string;
  regionName: string;
  description: string;
  pageTitle: string;
  keyword: string;
  faqs?: LpFaq[];
  caseStudies?: CaseStudiesBlock;
  localBusinessDescription?: string;
}): Record<string, unknown> {
  const regionPath = `/${input.path.split('/').filter(Boolean)[0]}/`;
  return buildLpJsonLd({
    path: input.path,
    regionFull: input.regionFull,
    regionName: input.regionName,
    description: input.description,
    pageTitle: input.pageTitle,
    faqs: input.faqs,
    caseStudies: input.caseStudies,
    localBusinessDescription: input.localBusinessDescription,
    regionSlug: input.path.split('/').filter(Boolean)[0],
    serviceName: `${BUSINESS_NAME}｜${input.regionFull}の${input.keyword}`,
    serviceType: [input.keyword, '出張車内清掃', '車内クリーニング', '消臭'],
    breadcrumbMiddle: {
      name: `${input.regionName}の出張車内清掃`,
      path: regionPath
    }
  });
}
