import {
  type InquiryFieldKey,
  type InquiryInput,
  submitInquiry,
  validateInquiry
} from '../lib/contact-form';

const FIELD_IDS: Record<InquiryFieldKey, string> = {
  name: 'contact-name',
  phone: 'contact-phone',
  postalCode: 'contact-postal',
  message: 'contact-message'
};

function readInput(form: HTMLFormElement): InquiryInput {
  const data = new FormData(form);
  const read = (name: string) => {
    const value = data.get(name);
    return typeof value === 'string' ? value : '';
  };
  return {
    name: read('お名前'),
    phone: read('電話番号'),
    postalCode: read('郵便番号'),
    message: read('相談内容'),
    honey: read('_honey')
  };
}

function describedBy(doc: Document, fieldId: string, invalid: boolean): string {
  const ids: string[] = [];
  if (doc.getElementById(`${fieldId}-hint`)) ids.push(`${fieldId}-hint`);
  if (invalid) ids.push(`${fieldId}-error`);
  return ids.join(' ');
}

function setFieldError(doc: Document, key: InquiryFieldKey, message: string | undefined): void {
  const field = doc.getElementById(FIELD_IDS[key]);
  const error = doc.getElementById(`${FIELD_IDS[key]}-error`);
  if (error) error.textContent = message ?? '';
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    const description = describedBy(doc, field.id, Boolean(message));
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (description) field.setAttribute('aria-describedby', description);
    else field.removeAttribute('aria-describedby');
  }
}

function setBusy(form: HTMLFormElement, submit: HTMLButtonElement | null, busy: boolean): void {
  form.setAttribute('aria-busy', busy ? 'true' : 'false');
  if (!submit) return;
  submit.disabled = busy;
  submit.textContent = busy ? '送信しています…' : '送信する';
}

export function bindContactForm(doc: Document): void {
  const form = doc.getElementById('contact-form');
  if (!(form instanceof HTMLFormElement) || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';
  form.noValidate = true;

  const status = doc.getElementById('contact-status');
  const formError = doc.getElementById('contact-form-error');
  const success = doc.getElementById('contact-success');
  const fields = doc.getElementById('contact-fields');
  const fallback = doc.getElementById('contact-native-submit');
  const submit = doc.getElementById('contact-submit');
  const submitButton = submit instanceof HTMLButtonElement ? submit : null;

  const clearErrors = () => {
    (Object.keys(FIELD_IDS) as InquiryFieldKey[]).forEach((key) => setFieldError(doc, key, undefined));
    if (formError) {
      formError.textContent = '';
      formError.hidden = true;
    }
  };

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.id) return;
    const key = (Object.keys(FIELD_IDS) as InquiryFieldKey[]).find((item) => FIELD_IDS[item] === target.id);
    if (key) setFieldError(doc, key, undefined);
  });

  form.addEventListener('submit', async (event) => {
    const submitter = event.submitter;
    const nativeSubmit = submitter instanceof HTMLButtonElement && submitter.dataset.nativeSubmit === 'true';
    clearErrors();
    if (!nativeSubmit && fallback instanceof HTMLElement) fallback.hidden = true;

    const input = readInput(form);
    const errors = validateInquiry(input);
    const keys = Object.keys(errors) as InquiryFieldKey[];
    if (keys.length > 0) {
      event.preventDefault();
      keys.forEach((key) => setFieldError(doc, key, errors[key]));
      const first = doc.getElementById(FIELD_IDS[keys[0]]);
      if (first instanceof HTMLElement) first.focus();
      if (status) status.textContent = '入力内容をご確認ください。';
      return;
    }
    if (nativeSubmit) return;

    event.preventDefault();

    setBusy(form, submitButton, true);
    if (status) status.textContent = '送信しています。';

    const fetchImpl = globalThis.fetch.bind(globalThis);
    const result = await submitInquiry(input, async (url, init) => {
      const response = await fetchImpl(url, init);
      return { status: response.status, text: () => response.text() };
    });

    setBusy(form, submitButton, false);
    if (result.ok) {
      if (fields instanceof HTMLElement) fields.hidden = true;
      if (success instanceof HTMLElement) {
        success.hidden = false;
        const heading = success.querySelector('h2');
        if (heading instanceof HTMLElement) heading.focus();
      }
      if (status) status.textContent = result.message;
      return;
    }

    if (formError) {
      formError.hidden = false;
      formError.textContent = result.message;
    }
    if (fallback instanceof HTMLElement) fallback.hidden = false;
    if (status) status.textContent = result.message;
  });
}
