import { initPhoneMask, isPhoneComplete } from './phone-mask.js';

const FAQ_SCHEMA_ID = 'faq-schema';

const normalizeText = (element) => element?.textContent.replace(/\s+/g, ' ').trim() || '';

const createFaqSchema = () => {
  const entities = [...document.querySelectorAll('[data-faq-item]')]
    .map((item) => {
      const question = normalizeText(item.querySelector('[data-faq-trigger]'));
      const answer = normalizeText(item.querySelector('[data-faq-panel]'));

      if (!question || !answer) return null;

      return {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      };
    })
    .filter(Boolean);

  if (!entities.length) return;

  document.getElementById(FAQ_SCHEMA_ID)?.remove();

  const script = document.createElement('script');
  script.id = FAQ_SCHEMA_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entities,
  }).replaceAll('<', '\\u003c');

  document.head.append(script);
};

const setFaqPanelState = (panel, isOpen) => {
  if (!panel) return;

  panel.hidden = false;
  panel.setAttribute('aria-hidden', String(!isOpen));
  panel.toggleAttribute('inert', !isOpen);
};

const closeFaqItem = (item) => {
  const trigger = item.querySelector('[data-faq-trigger]');
  const panel = item.querySelector('[data-faq-panel]');

  item.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');
  setFaqPanelState(panel, false);
};

const openFaqItem = (item) => {
  const trigger = item.querySelector('[data-faq-trigger]');
  const panel = item.querySelector('[data-faq-panel]');

  item.classList.add('is-open');
  trigger?.setAttribute('aria-expanded', 'true');
  setFaqPanelState(panel, true);
};

const getValidationMessage = (field) => {
  if (field.type === 'checkbox') {
    return field.required && !field.checked ? 'Необходимо принять условия обработки данных' : '';
  }

  const value = field.value.trim();
  if (field.required && !value) return 'Заполните это поле';
  if (field.name === 'name' && value.length < 2) return 'Введите не менее двух символов';
  if (field.matches('[data-phone-mask]') && !isPhoneComplete(field)) {
    return 'Введите номер полностью';
  }
  if (field.type === 'email' && field.validity.typeMismatch) return 'Введите корректный email';

  return '';
};

const validateField = (field, markAsTouched = false) => {
  field.setCustomValidity('');

  const message = getValidationMessage(field);
  field.setCustomValidity(message);

  if (markAsTouched) field.classList.add('is-touched');

  const shouldShowError = field.classList.contains('is-touched') && Boolean(message);
  field.classList.toggle('is-invalid', shouldShowError);
  field.setAttribute('aria-invalid', String(shouldShowError));

  return !message;
};

export function initFaq() {
  const accordions = document.querySelectorAll('[data-faq]');
  if (!accordions.length) return;

  accordions.forEach((accordion) => {
    const items = [...accordion.querySelectorAll('[data-faq-item]')];

    items.forEach((item) => {
      const trigger = item.querySelector('[data-faq-trigger]');
      if (!trigger) return;

      if (trigger.getAttribute('aria-expanded') === 'true') {
        openFaqItem(item);
      } else {
        closeFaqItem(item);
      }

      trigger.addEventListener('click', () => {
        const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';

        items.forEach(closeFaqItem);
        if (shouldOpen) openFaqItem(item);
      });
    });
  });

  createFaqSchema();
}

export function initCallbackForms() {
  document.querySelectorAll('[data-callback-form]').forEach((form) => {
    const fields = [...form.querySelectorAll('[data-validate]')];

    form.querySelectorAll('[data-phone-mask]').forEach(initPhoneMask);

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field, true));
      field.addEventListener('input', () => validateField(field));
      field.addEventListener('change', () => validateField(field));
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const isValid = fields.map((field) => validateField(field, true)).every(Boolean);
      if (!isValid) {
        fields.find((field) => !field.checkValidity())?.reportValidity();
        return;
      }

      form.dispatchEvent(
        new CustomEvent('callback-form:valid', {
          bubbles: true,
          detail: Object.fromEntries(new FormData(form)),
        }),
      );
    });
  });
}
