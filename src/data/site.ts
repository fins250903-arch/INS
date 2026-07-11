/**
 * 正規URLのオリジン（JSON-LD・canonical 用）。
 * 本番ドメインに合わせて変更してください。
 */
export const SITE_CANONICAL_ORIGIN = 'https://insbs.net' as const;

/**
 * サイト本文・料金表・FAQの最終見直し日（JSON-LD `dateModified`・LP「最終更新」表示に使用）。
 *
 * AEO/SEO のフレッシュネス指標を最大化するため、固定日ではなくビルド（デプロイ）時点の
 * 日本標準時（JST, UTC+9）の当日日付を `YYYY-MM-DD` 形式で自動採用する。
 * これにより、サイトを再ビルド・再デプロイするたびに LP の更新日が常に最新日程で表示される。
 *
 * 特定の日付に固定したい場合は環境変数 `SITE_CONTENT_UPDATED_OVERRIDE`（`YYYY-MM-DD`）を設定する。
 */
function resolveSiteContentUpdated(): string {
  const override = process.env.SITE_CONTENT_UPDATED_OVERRIDE?.trim();
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    return override;
  }

  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  return jstNow.toISOString().slice(0, 10);
}

export const SITE_CONTENT_UPDATED = resolveSiteContentUpdated();

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
