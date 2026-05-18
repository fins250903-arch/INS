import { CONTACT_EMAIL, BUSINESS_NAME, SITE_CANONICAL_ORIGIN, TEL_DISPLAY } from '../data/site';
import { pricingSet } from '../data/lp-pricing';

function absoluteUrl(path: string): string {
  const origin = SITE_CANONICAL_ORIGIN.replace(/\/$/, '');
  if (path === '/' || path === '') return `${origin}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p.endsWith('/') ? p : `${p}/`}`;
}

function yenToNumber(label: string): number {
  const digits = label.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * LP（トップ・エリア別）用：Service + ProfessionalService（地域系AI検索向け areaServed）
 */
export function buildLpJsonLd(input: {
  /** 例: `/` または `/nara/` */
  path: string;
  regionFull: string;
  regionName: string;
  description: string;
}): Record<string, unknown>[] {
  const pageUrl = absoluteUrl(input.path);
  const telDigits = `81${TEL_DISPLAY.replace(/\D/g, '').replace(/^0/, '')}`;
  const telE164 = `+${telDigits}`;

  const catalogItems = pricingSet.map((row, i) => ({
    '@type': 'Offer' as const,
    position: i + 1,
    name: row.label,
    price: yenToNumber(row.price),
    priceCurrency: 'JPY',
    availability: 'https://schema.org/InStock',
    url: pageUrl
  }));

  const service: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: `${BUSINESS_NAME}｜${input.regionFull}の出張車内清掃・車内クリーニング`,
    serviceType: '出張車内清掃、車内クリーニング、嘔吐・尿・ペット臭・灯油・シート洗浄、消臭',
    description: input.description,
    url: pageUrl,
    provider: {
      '@type': 'Organization',
      name: BUSINESS_NAME,
      url: absoluteUrl('/'),
      telephone: telE164,
      email: CONTACT_EMAIL
    },
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
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${pageUrl}#localbusiness`,
    name: `${BUSINESS_NAME}（${input.regionFull}）`,
    description: input.description,
    url: pageUrl,
    telephone: telE164,
    email: CONTACT_EMAIL,
    priceRange: '¥¥',
    image: absoluteUrl('/favicon.png'),
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
      itemOffered: { '@id': `${pageUrl}#service` },
      priceCurrency: 'JPY',
      description: `軽自動車 ${pricingSet[0].price}〜／${pricingSet[2].label} ${pricingSet[2].price}（税込・基本）`
    }
  };

  return [service, localBusiness];
}
