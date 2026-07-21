import AirDatepicker from 'air-datepicker';
import localeRu from 'air-datepicker/locale/ru';

import { toggleScrollLock } from '../_functions.js';

const STEP_COUNT = 5;
const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

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
  const openButtons = [...document.querySelectorAll('[data-event-modal-open]')];
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let currentStep = 1;
  let selectedDate = null;
  let activeTrigger = null;

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

      requestAnimationFrame(() => heading?.focus());
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
    activeTrigger?.focus();
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
    const formData = new FormData(form);

    document.dispatchEvent(
      new CustomEvent('warpoint:event-quiz-complete', {
        detail: {
          city: document.documentElement.dataset.city || '',
          countryId: document.documentElement.dataset.country || 'ru',
          date: selectedDate ? formatDateKey(selectedDate) : '',
          eventType: formData.get('eventType'),
          guestCount: formData.get('guestCount'),
          services: formData.getAll('services'),
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

    const focusableElements = [...modal.querySelectorAll(focusableSelector)].filter(
      (element) => !element.closest('[hidden]') && element.getClientRects().length,
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
    button.addEventListener('click', () => openModal(button));
  });
  form.addEventListener('change', updateNavigation);
  form.addEventListener('submit', (event) => event.preventDefault());
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
