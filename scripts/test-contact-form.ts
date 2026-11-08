import assert from 'node:assert/strict';
import {
  FORM_SUBMIT_AJAX_ENDPOINT,
  FORM_SUBMIT_EMAIL_CONSTRAINT,
  INQUIRY_SUBJECT,
  REQUESTED_PLAIN_BODY,
  buildInquiryEntries,
  encodeInquiryBody,
  normalizePhone,
  normalizePostalCode,
  parseFormSubmitResponse,
  submitInquiry,
  validateInquiry,
  type FetchLike
} from '../src/lib/contact-form.ts';

const sample = {
  name: ' 山田 太郎 ',
  phone: '070-8428-0866',
  postalCode: '001-0000',
  message: 'シートに嘔吐しました。\n明日の午前を希望します。'
};

assert.equal(normalizePhone('０７０－８４２８－０８６６'), '070-8428-0866');
assert.equal(normalizePhone(' 07084280866 '), '07084280866');
assert.equal(normalizePostalCode('〒００１ー００００'), '001-0000');
assert.equal(normalizePostalCode(' 0301234 '), '0301234');
assert.equal(Number.isNaN(Number('001-0000')), true);

const entries = buildInquiryEntries(sample);
assert.deepEqual(
  entries.map(([key]) => key),
  ['お名前', '電話番号', '郵便番号', '相談内容', '_subject', '_honey', '_next']
);
assert.equal(entries[0][1], '山田 太郎');
assert.equal(entries[1][1], '070-8428-0866');
assert.equal(entries[2][1], '001-0000');
assert.equal(entries[3][1].includes('\n'), true);
assert.equal(entries[4][1], '【車内清掃】お問い合わせ');
assert.equal(entries[4][1], INQUIRY_SUBJECT);

const encoded = new URLSearchParams(encodeInquiryBody(sample));
assert.equal(encoded.get('お名前'), '山田 太郎');
assert.equal(encoded.get('電話番号'), '070-8428-0866');
assert.equal(encoded.get('郵便番号'), '001-0000');
assert.equal(encoded.get('相談内容'), 'シートに嘔吐しました。\n明日の午前を希望します。');
assert.equal(encoded.get('_subject'), '【車内清掃】お問い合わせ');
assert.equal(encoded.get('email'), null);
assert.equal(encoded.get('_captcha'), null);
assert.equal(encoded.get('_template'), null);
assert.equal(encoded.get('_replyto'), null);
assert.equal([...encoded.keys()].slice(0, 4).join(','), 'お名前,電話番号,郵便番号,相談内容');
assert.equal(encoded.get('相談内容') === REQUESTED_PLAIN_BODY, false);

assert.equal(FORM_SUBMIT_EMAIL_CONSTRAINT.customPlainBodySupported, false);
assert.equal(FORM_SUBMIT_EMAIL_CONSTRAINT.subjectValue, '【車内清掃】お問い合わせ');
assert.equal(FORM_SUBMIT_EMAIL_CONSTRAINT.templateFieldOmitted, true);
assert.equal(FORM_SUBMIT_EMAIL_CONSTRAINT.defaultTemplate, 'basic');

assert.equal(validateInquiry(sample).phone, undefined);
assert.equal(validateInquiry(sample).postalCode, undefined);
assert.ok(validateInquiry({ ...sample, phone: '' }).phone);
assert.ok(validateInquiry({ ...sample, phone: '84280866' }).phone);
assert.ok(validateInquiry({ ...sample, postalCode: '123456' }).postalCode);
assert.ok(validateInquiry({ ...sample, postalCode: '12345678' }).postalCode);
assert.equal(validateInquiry({ ...sample, phone: '070-8428-0866', postalCode: '0010000' }).phone, undefined);
assert.equal(validateInquiry({ ...sample, postalCode: '0010000' }).postalCode, undefined);
assert.equal(Object.keys(validateInquiry({ ...sample, message: '' })).includes('message'), true);

let calls = 0;
const mockFetch: FetchLike = async (url, init) => {
  calls += 1;
  assert.equal(url, FORM_SUBMIT_AJAX_ENDPOINT);
  assert.equal(url.includes('formsubmit.co'), true);
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Accept, 'application/json');
  assert.match(init.headers['Content-Type'], /application\/x-www-form-urlencoded/);
  const body = new URLSearchParams(init.body);
  assert.equal(body.get('電話番号'), '09001234567');
  assert.equal(body.get('郵便番号'), '030-0001');
  assert.equal(body.get('_subject'), '【車内清掃】お問い合わせ');
  assert.equal(body.get('_honey'), '');
  return {
    status: 200,
    text: async () => JSON.stringify({ success: 'true', message: 'The form was submitted successfully.' })
  };
};

const sent = await submitInquiry(
  {
    name: '佐藤',
    phone: '09001234567',
    postalCode: '030-0001',
    message: '相談です'
  },
  mockFetch
);
assert.equal(calls, 1);
assert.equal(sent.ok, true);
assert.match(sent.message, /送信を受け付けました/);

const blocked = await submitInquiry({ ...sample, name: '' }, async () => {
  throw new Error('network must not be called');
});
assert.equal(blocked.ok, false);
assert.match(blocked.message, /入力内容/);

const failed = await submitInquiry(sample, async () => {
  throw new Error('offline');
});
assert.equal(failed.ok, false);
assert.match(failed.message, /通信できなかった/);

const rejected = await submitInquiry(sample, async () => ({
  status: 200,
  text: async () => JSON.stringify({ success: 'false' })
}));
assert.equal(rejected.ok, false);

const htmlResponse = parseFormSubmitResponse(200, '<html>captcha</html>');
assert.equal(htmlResponse.ok, false);

const honeyCalls: string[] = [];
await submitInquiry({ ...sample, honey: 'http://spam.example' }, async (_url, init) => {
  honeyCalls.push(new URLSearchParams(init.body).get('_honey') ?? '');
  return { status: 200, text: async () => JSON.stringify({ success: true }) };
});
assert.deepEqual(honeyCalls, ['http://spam.example']);

console.log('contact form tests passed');
