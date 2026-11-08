/**
 * Contact form payload for FormSubmit (https://formsubmit.co/documentation).
 *
 * The service emails one of three built-in layouts. The default is "basic".
 * The only template value shown in the docs is "table". There is no field for
 * a custom plain-text body, so the requested body (full-width colons and a
 * line break before 相談内容) cannot be guaranteed. Field names and order are
 * the supported way to label the submission. `_subject` sets the subject.
 * `_honey` is the documented honeypot. `_next` is a full thank-you URL for the
 * no-JS POST. `_captcha` is omitted so the documented reCAPTCHA default stays
 * on for that POST. The AJAX example in the docs also omits `_captcha`.
 */

export const INQUIRY_EMAIL = 'info@insbs.net' as const;
export const INQUIRY_SUBJECT = '【車内清掃】お問い合わせ' as const;
export const FORM_SUBMIT_ENDPOINT = `https://formsubmit.co/${INQUIRY_EMAIL}` as const;
export const FORM_SUBMIT_AJAX_ENDPOINT = `https://formsubmit.co/ajax/${INQUIRY_EMAIL}` as const;
export const INQUIRY_NEXT_URL = 'https://insbs.net/thanks/' as const;

export const INQUIRY_FIELD_NAMES = ['お名前', '電話番号', '郵便番号', '相談内容'] as const;

/** Shape the product asked for. FormSubmit does not accept this as a template. */
export const REQUESTED_PLAIN_BODY = `お名前：〈入力内容〉
電話番号：〈入力内容〉
郵便番号：〈入力内容〉
相談内容：
〈入力内容〉` as const;

export const FORM_SUBMIT_EMAIL_CONSTRAINT = {
  customPlainBodySupported: false,
  subjectField: '_subject',
  subjectValue: INQUIRY_SUBJECT,
  defaultTemplate: 'basic',
  templateFieldOmitted: true,
  documentedTemplateSample: 'table',
  fieldOrder: INQUIRY_FIELD_NAMES,
  differences: [
    'FormSubmit has no parameter for a custom plain-text body. _template only selects one of three built-in layouts. The default is basic, and the documentation sample value is table.',
    'Japanese labels and order are sent as name attributes. The colon character, the line break before 相談内容, and any service header or footer are chosen by FormSubmit and are not configurable in the public docs.',
    'Reserved names _subject, _honey, and _next are excluded from the message body (help page: reserved fields such as _next, _subject, and _cc).'
  ]
} as const;

export type InquiryInput = {
  name: string;
  phone: string;
  postalCode: string;
  message: string;
  honey?: string;
};

export type InquiryFieldKey = 'name' | 'phone' | 'postalCode' | 'message';
export type FieldErrors = Partial<Record<InquiryFieldKey, string>>;

export type FormSubmitResult = {
  ok: boolean;
  message: string;
};

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{ status: number; text: () => Promise<string> }>;

const PHONE_ERROR =
  '電話番号は、先頭の0を残した10桁または11桁で入力してください。ハイフンはそのままで構いません。';
const POSTAL_ERROR =
  '郵便番号は、先頭の0を残した7桁で入力してください。ハイフン（例: 001-0000）も使えます。';

/** Full-width digits and common hyphen characters. Does not drop leading zeros. */
export function coerceNumericText(value: string): string {
  return value
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[－−‐‑‒–—ーｰ]/g, '-')
    .replace(/[\s\u3000]/g, '');
}

export function normalizePhone(value: string): string {
  return coerceNumericText(value.trim());
}

export function normalizePostalCode(value: string): string {
  return coerceNumericText(value.trim()).replace(/^〒/, '');
}

export function normalizeMessage(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

export function validateInquiry(input: InquiryInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const postalCode = normalizePostalCode(input.postalCode);
  const message = normalizeMessage(input.message);

  if (!name) errors.name = 'お名前を入力してください。';
  else if (name.length > 80) errors.name = 'お名前は80文字以内で入力してください。';

  if (!phone) errors.phone = '電話番号を入力してください。';
  else if (!isPhone(phone)) errors.phone = PHONE_ERROR;

  if (!postalCode) errors.postalCode = '郵便番号を入力してください。';
  else if (!/^\d{3}-?\d{4}$/.test(postalCode)) errors.postalCode = POSTAL_ERROR;

  if (!message) errors.message = '相談内容を入力してください。';
  else if (message.length > 2000) errors.message = '相談内容は2000文字以内で入力してください。';

  return errors;
}

function isPhone(value: string): boolean {
  if (!/^0[0-9-]+$/.test(value)) return false;
  if (value.includes('--') || value.startsWith('-') || value.endsWith('-')) return false;
  const digits = value.replace(/-/g, '');
  return /^0\d{9,10}$/.test(digits);
}

/** Ordered fields. Reserved keys stay after the four inquiry labels. */
export function buildInquiryEntries(input: InquiryInput): Array<[string, string]> {
  return [
    ['お名前', input.name.trim()],
    ['電話番号', normalizePhone(input.phone)],
    ['郵便番号', normalizePostalCode(input.postalCode)],
    ['相談内容', normalizeMessage(input.message)],
    ['_subject', INQUIRY_SUBJECT],
    ['_honey', input.honey ?? ''],
    ['_next', INQUIRY_NEXT_URL]
  ];
}

export function encodeInquiryBody(input: InquiryInput): string {
  return new URLSearchParams(buildInquiryEntries(input)).toString();
}

export function parseFormSubmitResponse(status: number, bodyText: string): FormSubmitResult {
  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return {
      ok: false,
      message: '送信を確認できませんでした。時間をおいて再度お試しいただくか、お電話・LINEでご連絡ください。'
    };
  }
  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      message: '送信を確認できませんでした。時間をおいて再度お試しいただくか、お電話・LINEでご連絡ください。'
    };
  }
  const success = (data as { success?: unknown }).success;
  const accepted = success === true || success === 'true';
  if (status >= 200 && status < 300 && accepted) {
    return {
      ok: true,
      message: '送信を受け付けました。担当者よりご連絡いたします。しばらくお待ちください。'
    };
  }
  return {
    ok: false,
    message: '送信できませんでした。時間をおいて再度お試しいただくか、お電話・LINEでご連絡ください。'
  };
}

/**
 * POST the documented AJAX endpoint. Callers pass fetch so tests never hit the network.
 * A successful JSON response means FormSubmit accepted the request. It does not prove
 * the mailbox received the mail (first use still requires the recipient to activate).
 */
export async function submitInquiry(input: InquiryInput, fetchImpl: FetchLike): Promise<FormSubmitResult> {
  const errors = validateInquiry(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: '入力内容をご確認ください。' };
  }
  try {
    const response = await fetchImpl(FORM_SUBMIT_AJAX_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: encodeInquiryBody(input)
    });
    return parseFormSubmitResponse(response.status, await response.text());
  } catch {
    return {
      ok: false,
      message: '通信できなかったため送信できませんでした。お電話またはLINEでもご相談いただけます。'
    };
  }
}
