import { toggleScrollLock } from '../_functions.js';
import { isPhoneComplete } from './phone-mask.js';

const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function initBookingPanel() {
  const panel = document.querySelector('[data-booking-panel]');

  if (!panel) {
    return;
  }

  const dialog = panel.querySelector('[data-booking-dialog]');
  const form = panel.querySelector('[data-booking-form]');
  const nameInput = form.querySelector('[name="name"]');
  const phoneInput = form.querySelector('[data-phone-mask]');
  const agreementInput = form.querySelector('[name="agreement"]');
  const submitButton = panel.querySelector('[data-booking-submit]');
  const closeButtons = [...panel.querySelectorAll('[data-booking-close]')];
  const openButtons = [
    ...new Set(
      document.querySelectorAll(
        '[data-booking-open], .hero__button--red, .zone__button:not([data-event-modal-open])',
      ),
    ),
  ];

  let activeTrigger = null;

  const updateSubmitState = () => {
    const isReady =
      nameInput.value.trim().length >= 2 && isPhoneComplete(phoneInput) && agreementInput.checked;

    submitButton.disabled = !isReady;
  };

  const closePanel = () => {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    toggleScrollLock(false);
    activeTrigger?.focus();
  };

  const openPanel = (trigger) => {
    activeTrigger = trigger;
    form.reset();
    updateSubmitState();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    toggleScrollLock(true);
    requestAnimationFrame(() => dialog.focus());
  };

  const trapFocus = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = [...panel.querySelectorAll(focusableSelector)].filter(
      (element) => element.getClientRects().length,
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  openButtons.forEach((button) => {
    button.setAttribute('aria-controls', 'booking-panel');
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => openPanel(button));
  });
  closeButtons.forEach((button) => button.addEventListener('click', closePanel));
  form.addEventListener('input', updateSubmitState);
  form.addEventListener('change', updateSubmitState);
  form.addEventListener('callback-form:valid', (event) => {
    document.dispatchEvent(
      new CustomEvent('warpoint:booking-request', {
        detail: {
          ...event.detail,
          city: document.documentElement.dataset.city || '',
          countryId: document.documentElement.dataset.country || 'ru',
        },
      }),
    );
  });
  panel.querySelector('[data-booking-online]').addEventListener('click', () => {
    document.dispatchEvent(
      new CustomEvent('warpoint:online-booking', {
        detail: {
          city: document.documentElement.dataset.city || '',
          countryId: document.documentElement.dataset.country || 'ru',
        },
      }),
    );
  });
  panel.addEventListener('keydown', trapFocus);
  document.addEventListener('warpoint:location-change', updateSubmitState);
}
