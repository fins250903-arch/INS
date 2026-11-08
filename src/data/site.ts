/**
 * 正規URLのオリジン（JSON-LD・canonical 用）。
 * 本番ドメインに合わせて変更してください。
 */
export const SITE_CANONICAL_ORIGIN = 'https://insbs.net' as const;

/**
 * Final URL of the apex `/` redirect (308 → /osaka/).
 * Use this for navigable JSON-LD urls. `@id` values stay on the origin.
 */
export const SITE_HOME_PATH = '/osaka/' as const;

/** Official LINE profile. Organization sameAs lists external profiles only. */
export const LINE_OFFICIAL_URL = 'https://lin.ee/Xs8Orp2' as const;

/**
 * Last editorial review of shared LP copy (pricing, FAQ, JSON-LD dateModified, 「最終更新」).
 * Bump this when that copy changes. Do not derive it from the build clock.
 */
export const SITE_CONTENT_UPDATED = '2026-11-04' as const;

export const BUSINESS_NAME = 'アイエヌエスINS出張車内清掃' as const;

/**
 * 会社情報テーブルの本社所在地（岡山）。郵便番号はこのリポジトリに無い。
 * 出張先の府県名は JSON-LD の address に入れず、areaServed に分ける。
 */
export const HQ_ADDRESS_REGION = '岡山県' as const;
export const HQ_ADDRESS_LOCALITY = '岡山市南区' as const;
export const HQ_STREET_ADDRESS = '西市５９１' as const;
export const HQ_ADDRESS_LINE =
  `${HQ_ADDRESS_REGION}${HQ_ADDRESS_LOCALITY}${HQ_STREET_ADDRESS}` as const;

export function headquartersPostalAddress(): Record<string, string> {
  return {
    '@type': 'PostalAddress',
    addressCountry: 'JP',
    addressRegion: HQ_ADDRESS_REGION,
    addressLocality: HQ_ADDRESS_LOCALITY,
    streetAddress: HQ_STREET_ADDRESS
  };
}

/** 代表者（JSON-LD Person @id） */
export const SITE_PERSON_IMAI_ID = 'https://insbs.net/#person-imai' as const;
export const SITE_PERSON_NAME = '今井雄策' as const;
export const SITE_PERSON_JOB_TITLE = '代表・出張車内清掃担当' as const;

/**
 * Inquiry mailbox. The contact form posts here through FormSubmit.
 * Visitor-facing email buttons link to CONTACT_FORM_PATH instead of mailto.
 */
export const CONTACT_EMAIL = 'info@insbs.net' as const;
export const CONTACT_FORM_PATH = '/contact/#contact-form' as const;
export const TEL_HREF = 'tel:070-8428-0866' as const;
export const TEL_DISPLAY = '070-8428-0866' as const;

/** 抗菌コートキャンペーン表記（バナー画像の日付と併記するテキスト） */
export const ANTIMICROBIAL_CAMPAIGN_LINE = '今月末まで無料（通常2,000円）' as const;
