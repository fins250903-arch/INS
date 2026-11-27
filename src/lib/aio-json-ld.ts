import { aioConclusion, aioFaqEntities, aioMetaDescription, listAioServiceRegions } from '../data/aio-summary';
import { baseInteriorPriceRange } from '../data/lp-pricing';
import {
  BUSINESS_NAME,
  CONTACT_EMAIL,
  SITE_CONTENT_UPDATED,
  SITE_HOME_PATH,
  TEL_DISPLAY
} from '../data/site';
import { canonicalUrl, pageId, SITE_ORGANIZATION_ID, SITE_PERSON_ID } from './canonical-url';
import { buildJsonLdGraph } from './json-ld-graph';
import { siteOrganizationNode, sitePersonNode, siteWebSiteNode, webPageNode } from './json-ld-site';
import { interiorOfferCatalog } from './lp-json-ld';

const AIO_PATH = '/aio/';

function telE164(): string {
  const digits = `81${TEL_DISPLAY.replace(/\D/g, '').replace(/^0/, '')}`;
  return `+${digits}`;
}

function priceBounds(): { low: number; high: number } {
  const [low, high] = baseInteriorPriceRange().split('-');
  const lowPrice = Number.parseInt(low, 10);
  const highPrice = Number.parseInt(high, 10);
  if (!Number.isFinite(lowPrice) || !Number.isFinite(highPrice)) {
    throw new Error(`Invalid price range: ${baseInteriorPriceRange()}`);
  }
  return { low: lowPrice, high: highPrice };
}

/**
 * Summary page graph. The head-office address stays on Organization.
 * ProfessionalService lists every prefecture in areaServed and has no geo.
 */
export function buildAioJsonLd(): Record<string, unknown> {
  const pageUrl = canonicalUrl(AIO_PATH);
  const baseId = pageId(AIO_PATH);
  const serviceId = `${baseId}#service`;
  const businessId = `${baseId}#service-area`;
  const breadcrumbId = `${baseId}#breadcrumb`;
  const faqId = `${baseId}#faq`;
  const { low, high } = priceBounds();
  const description = aioMetaDescription();
  const areas = listAioServiceRegions().map((region) => ({
    '@type': 'AdministrativeArea',
    name: region.regionFull
  }));

  const service: Record<string, unknown> = {
    '@type': 'Service',
    '@id': serviceId,
    name: `${BUSINESS_NAME}の出張車内清掃`,
    serviceType: ['出張車内清掃', '車内クリーニング', '消臭'],
    description: aioConclusion(),
    url: pageUrl,
    dateModified: SITE_CONTENT_UPDATED,
    provider: { '@id': SITE_ORGANIZATION_ID },
    areaServed: areas,
    offers: interiorOfferCatalog(pageUrl)
  };

  const serviceArea: Record<string, unknown> = {
    '@type': 'ProfessionalService',
    '@id': businessId,
    name: BUSINESS_NAME,
    description: `${aioConclusion()} 来店用の店舗はなく、会社所在地は親のOrganizationを参照します。`,
    url: pageUrl,
    telephone: telE164(),
    email: CONTACT_EMAIL,
    priceRange: baseInteriorPriceRange(),
    parentOrganization: { '@id': SITE_ORGANIZATION_ID },
    provider: { '@id': SITE_ORGANIZATION_ID },
    employee: { '@id': SITE_PERSON_ID },
    areaServed: areas,
    makesOffer: {
      '@type': 'AggregateOffer',
      priceCurrency: 'JPY',
      lowPrice: low,
      highPrice: high,
      url: pageUrl,
      itemOffered: { '@id': serviceId }
    }
  };

  const webpage = webPageNode({
    path: AIO_PATH,
    name: `出張車内清掃の要約｜${BUSINESS_NAME}`,
    description,
    type: 'WebPage',
    aboutId: serviceId,
    mainEntityId: serviceId,
    authorId: SITE_PERSON_ID,
    breadcrumbId,
    dateModified: SITE_CONTENT_UPDATED,
    hasPartId: faqId
  });
  webpage.speakable = {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '#aio-conclusion', '#aio-prices', '#aio-where']
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: BUSINESS_NAME,
        item: canonicalUrl(SITE_HOME_PATH)
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '出張車内清掃の要約',
        item: pageUrl
      }
    ]
  };

  const faqs = aioFaqEntities();
  const faqPage = {
    '@type': 'FAQPage',
    '@id': faqId,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };

  return buildJsonLdGraph([
    siteOrganizationNode(),
    sitePersonNode(),
    siteWebSiteNode(),
    webpage,
    breadcrumb,
    faqPage,
    service,
    serviceArea
  ]);
}
