import { CONTACT_EMAIL, BUSINESS_NAME, SITE_CANONICAL_ORIGIN, TEL_DISPLAY } from '../data/site';
import { pricingSet } from '../data/lp-pricing';
import { canonicalUrl, pageId, SITE_ORGANIZATION_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import { siteOrganizationNode, siteWebSiteNode, webPageNode } from './json-ld-site';

function yenToNumber(label: string): number {
  const digits = label.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function telE164(): string {
  const digits = `81${TEL_DISPLAY.replace(/\D/g, '').replace(/^0/, '')}`;
  return `+${digits}`;
}

/**
 * LP（トップ・エリア別）用 JSON-LD（@graph 単一ドキュメント）
 * Service / ProfessionalService / 料金 OfferCatalog / WebPage を同一グラフで連結
 */
export function buildLpJsonLd(input: {
  /** 例: `/` または `/nara/` */
  path: string;
  regionFull: string;
  regionName: string;
  description: string;
  pageTitle?: string;
}): Record<string, unknown> {
  const pageUrl = canonicalUrl(input.path);
  const baseId = pageId(input.path);
  const serviceId = `${baseId}#service`;
  const localBusinessId = `${baseId}#localbusiness`;
  const tel = telE164();

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
    name: `${BUSINESS_NAME}｜${input.regionFull}の出張車内清掃・車内クリーニング`,
    serviceType: [
      '出張車内清掃',
      '車内クリーニング',
      '嘔吐・尿・ペット臭・灯油・シート洗浄',
      '消臭'
    ],
    description: input.description,
    url: pageUrl,
    provider: { '@id': SITE_ORGANIZATION_ID },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: input.regionFull
    },
    offers: {
      '@type': 'OfferCatalog',
      name: '車内クリーニング基本料金（税込・目安）',
      itemListElement: catalogItems
    }
  };

  const localBusiness: Record<string, unknown> = {
    '@type': 'ProfessionalService',
    '@id': localBusinessId,
    name: `${BUSINESS_NAME}（${input.regionFull}）`,
    description: input.description,
    url: pageUrl,
    telephone: tel,
    email: CONTACT_EMAIL,
    priceRange: '¥¥',
    image: `${SITE_CANONICAL_ORIGIN.replace(/\/$/, '')}/favicon.png`,
    parentOrganization: { '@id': SITE_ORGANIZATION_ID },
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

  const webpage = webPageNode({
    path: input.path,
    name: pageName,
    description: input.description,
    type: 'WebPage',
    aboutId: serviceId,
    mainEntityId: localBusinessId
  });

  return buildJsonLdGraph([
    siteOrganizationNode(),
    siteWebSiteNode(),
    webpage,
    service,
    localBusiness
  ]);
}
