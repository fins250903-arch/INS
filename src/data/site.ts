/**
 * 正規URLのオリジン（JSON-LD・canonical 用）。
 * 本番ドメインに合わせて変更してください。
 */
export const SITE_CANONICAL_ORIGIN = 'https://insbs.net' as const;

/** サイト本文・料金表・FAQの最終見直し日（JSON-LD dateModified 等） */
export const SITE_CONTENT_UPDATED = '2026-06-07' as const;

export const BUSINESS_NAME = 'アイエヌエスINS出張車内清掃' as const;

/** 代表者（JSON-LD Person @id） */
export const SITE_PERSON_IMAI_ID = 'https://insbs.net/#person-imai' as const;
export const SITE_PERSON_NAME = '今井雄策' as const;
export const SITE_PERSON_JOB_TITLE = '代表・出張車内清掃担当' as const;

/** サイト共通の連絡先（LP・フッター・お問い合わせで共有） */
export const CONTACT_EMAIL = 'fins250903@gmail.com' as const;
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}` as const;
export const TEL_HREF = 'tel:070-8428-0866' as const;
export const TEL_DISPLAY = '070-8428-0866' as const;

/** 抗菌コートキャンペーン表記（バナー画像の日付と併記するテキスト） */
export const ANTIMICROBIAL_CAMPAIGN_LINE = '今月末まで無料（通常2,000円）' as const;
