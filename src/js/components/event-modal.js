import AirDatepicker from 'air-datepicker';
import localeRu from 'air-datepicker/locale/ru';

import { toggleScrollLock } from '../_functions.js';
import { getLocation, getLocations } from '../data/location-data.js';
import { isPhoneComplete } from './phone-mask.js';

const STEP_COUNT = 5;
const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export function initEventModal() {
  const modal = document.querySelector('[data-event-modal]');

  if (!modal) {
    return;
  }

  const dialog = modal.querySelector('[data-event-dialog]');
  const form = modal.querySelector('[data-event-form]');
  const content = modal.querySelector('[data-event-content]');
  const steps = [...modal.querySelectorAll('[data-event-step]')];
  const backButton = modal.querySelector('[data-event-back]');
  const nextButton = modal.querySelector('[data-event-next]');
  const progressLabel = modal.querySelector('[data-event-progress-label]');
  const progressDots = [...modal.querySelectorAll('[data-event-progress-dots] i')];
  const selectedDateLabel = modal.querySelector('[data-event-selected-date]');
  const locationField = modal.querySelector('[data-event-location-field]');
  const locationSelect = modal.querySelector('[data-event-location]');
  const nameInput = form.elements.namedItem('name');
  const phoneInput = form.elements.namedItem('phone');
  const emailInput = form.elements.namedItem('email');
  const messengerSelect = form.elements.namedItem('messenger');
  const consentInput = form.elements.namedItem('consent');
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let currentStep = 1;
  let selectedDate = null;
  let activeTrigger = null;

  const pageLocation = () => ({
    countryId: document.documentElement.dataset.country || 'ru',
    cityName: document.documentElement.dataset.city || '',
    locationId: document.documentElement.dataset.location || '',
  });

  const syncLocations = () => {
    const state = pageLocation();
    const confirmed = document.documentElement.dataset.locationConfirmed === 'true';
    const selected = confirmed ? getLocation(state) : null;
    const placeholder = new Option('Выберите локацию', '');
    placeholder.disabled = true;
    locationSelect.replaceChildren(placeholder);
    getLocations(state.countryId, state.cityName).forEach((location) => {
      locationSelect.add(new Option(`${location.name} — ${location.address}`, location.id));
    });
    locationSelect.value = selected?.id || '';
    locationField.hidden = Boolean(selected);
    locationSelect.required = !selected;
    modal.querySelector('[data-event-location-city]').textContent = `(${state.cityName})`;
  };

  const validateContacts = () => {
    nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Укажите ваше имя');
    phoneInput.setCustomValidity(isPhoneComplete(phoneInput) ? '' : 'Введите телефон полностью');
    return [nameInput, phoneInput, emailInput, locationSelect, messengerSelect, consentInput].every(
      (input) => input.validity.valid,
    );
  };

  const isStepComplete = () => {
    if (currentStep === 1) {
      return Boolean(form.elements.eventType.value);
    }

    if (currentStep === 2) {
      return Boolean(form.elements.guestCount.value);
    }

    if (currentStep === 3) {
      return selectedDate instanceof Date;
    }

    return true;
  };

  const updateNavigation = () => {
    progressLabel.textContent = `Шаг ${currentStep} из ${STEP_COUNT}`;
    progressDots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index + 1 === currentStep);
      dot.classList.toggle('is-complete', index + 1 < currentStep);
    });
    backButton.disabled = currentStep === 1;
    nextButton.disabled = !isStepComplete();
    nextButton.textContent = currentStep === STEP_COUNT ? 'Получить расчёт' : 'Далее';
  };

  const setStep = (step, focusHeading = true) => {
    currentStep = Math.min(Math.max(step, 1), STEP_COUNT);

    steps.forEach((section) => {
      section.hidden = Number(section.dataset.eventStep) !== currentStep;
    });
    content.scrollTop = 0;
    updateNavigation();

    if (focusHeading) {
      const heading = modal.querySelector(
        `[data-event-step="${currentStep}"] .event-modal__heading`,
      );

      requestAnimationFrame(() => heading?.focus({ preventScroll: true }));
    }
  };

  const datepicker = new AirDatepicker(modal.querySelector('[data-event-calendar]'), {
    inline: true,
    keyboardNav: true,
    locale: localeRu,
    minDate: new Date(),
    navTitles: {
      days: 'MMMM yyyy',
    },
    onSelect({ date }) {
      selectedDate = Array.isArray(date) ? date[0] : date;
      selectedDateLabel.textContent = selectedDate
        ? `Выбрано: ${dateFormatter.format(selectedDate)}`
        : '';
      updateNavigation();
    },
  });

  const resetQuiz = () => {
    form.reset();
    nameInput.setCustomValidity('');
    phoneInput.setCustomValidity('');
    syncLocations();
    selectedDate = null;
    selectedDateLabel.textContent = '';
    datepicker.clear({ silent: true });
    datepicker.setViewDate(new Date());
    setStep(1, false);
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    toggleScrollLock(false);
    const restoreTarget = activeTrigger?.closest('[data-mobile-menu]')
      ? document.querySelector('[data-mobile-menu-toggle]')
      : activeTrigger;
    restoreTarget?.focus();
  };

  const openModal = (trigger) => {
    activeTrigger = trigger;
    resetQuiz();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    toggleScrollLock(true);
    requestAnimationFrame(() => dialog.focus());
  };

  const completeQuiz = () => {
    if (!validateContacts()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const state = { ...pageLocation(), locationId: locationSelect.value };

    document.dispatchEvent(
      new CustomEvent('warpoint:event-quiz-complete', {
        detail: {
          city: document.documentElement.dataset.city || '',
          countryId: document.documentElement.dataset.country || 'ru',
          date: selectedDate ? formatDateKey(selectedDate) : '',
          eventType: formData.get('eventType'),
          guestCount: formData.get('guestCount'),
          services: formData.getAll('services'),
          name: nameInput.value.trim(),
          phone: phoneInput.value,
          email: emailInput.value.trim(),
          messenger: messengerSelect.value,
          consent: consentInput.checked,
          locationId: state.locationId,
          location: getLocation(state),
        },
      }),
    );
    closeModal();
  };

  const trapFocus = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = [...dialog.querySelectorAll(focusableSelector)].filter(
      (element) => !element.closest('[hidden]') && element.getClientRects().length,
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (
      event.shiftKey &&
      (document.activeElement === firstElement || document.activeElement === dialog)
    ) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-event-modal-open]');

    if (button) openModal(button);
  });
  form.addEventListener('change', updateNavigation);
  form.addEventListener('input', () => {
    if (currentStep === STEP_COUNT) validateContacts();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currentStep === STEP_COUNT) completeQuiz();
  });
  document.addEventListener('warpoint:location-change', syncLocations);
  backButton.addEventListener('click', () => setStep(currentStep - 1));
  nextButton.addEventListener('click', () => {
    if (!isStepComplete()) {
      return;
    }

    if (currentStep === STEP_COUNT) {
      completeQuiz();
      return;
    }

    setStep(currentStep + 1);
  });
  modal.querySelector('[data-event-close]').addEventListener('click', closeModal);
  modal.addEventListener('keydown', trapFocus);
}
