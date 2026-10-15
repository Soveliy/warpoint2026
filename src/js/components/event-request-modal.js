import { toggleScrollLock } from '../_functions.js';
import { isPhoneComplete } from './phone-mask.js';

const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function initEventRequestModal() {
  const modal = document.querySelector('[data-event-request-modal]');
  if (!modal) return;

  const dialog = modal.querySelector('[data-event-request-dialog]');
  const form = modal.querySelector('[data-event-request-form]');
  const dateInput = form.elements.namedItem('date');
  const phoneInput = form.elements.namedItem('phone');
  let activeTrigger = null;
  let selectedTariff = '';

  if (document.body.classList.contains('page--corporate')) {
    const requestButtons = [
      document.querySelector('.event-addons__request'),
      document.querySelector('[data-tariff-modal] [data-tariff-request]'),
    ];

    requestButtons.filter(Boolean).forEach((button) => {
      button.removeAttribute('data-event-modal-open');
      button.setAttribute('data-event-request-open', '');
      button.setAttribute('aria-controls', 'event-request-modal');
    });
  }

  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    toggleScrollLock(false);
    activeTrigger?.focus({ preventScroll: true });
    activeTrigger = null;
  };

  const openModal = (trigger) => {
    const tariffDialog = trigger.closest('[data-tariff-modal]');
    selectedTariff = tariffDialog
      ? tariffDialog.querySelector('[data-tariff-title]')?.textContent.trim() || ''
      : trigger
          .closest('.event-tariffs__card')
          ?.querySelector('.event-tariffs__card-title')
          ?.textContent.trim() || '';
    activeTrigger = tariffDialog
      ? [...document.querySelectorAll('.event-tariffs__card')]
          .find(
            (card) =>
              card.querySelector('.event-tariffs__card-title')?.textContent.trim() ===
              selectedTariff,
          )
          ?.querySelector('[data-tariff-open]') || null
      : trigger;
    form.reset();
    phoneInput.setCustomValidity('');
    dateInput.min = localDateKey(new Date());
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    toggleScrollLock(true);
    requestAnimationFrame(() => form.elements.namedItem('name').focus({ preventScroll: true }));
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-event-request-open]');
    if (trigger) openModal(trigger);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-event-request-close]')) closeModal();
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...dialog.querySelectorAll(focusableSelector)].filter(
      (element) => element.getClientRects().length,
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    phoneInput.setCustomValidity(isPhoneComplete(phoneInput) ? '' : 'Введите телефон полностью');
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    document.dispatchEvent(
      new CustomEvent('warpoint:event-request', {
        detail: {
          eventType: 'corporate',
          tariff: selectedTariff,
          name: String(values.get('name')).trim(),
          phone: String(values.get('phone')),
          email: String(values.get('email')).trim(),
          date: String(values.get('date')),
          consent: values.get('consent') === 'on',
          city: document.documentElement.dataset.city || '',
          countryId: document.documentElement.dataset.country || 'ru',
        },
      }),
    );
    closeModal();
  });
}
