import AirDatepicker from 'air-datepicker';
import localeRu from 'air-datepicker/locale/ru';

import { defaultLocationState, getLocation, getLocations } from '../data/location-data.js';
import { isPhoneComplete } from './phone-mask.js';

const STEP_COUNT = 6;
const stepHints = [
  'Праздники в WARPOINT — это командные VR-игры, лаунж-зона и координатор, который всё организует за вас.',
  'Для младших у нас спокойные игры без стрельбы, а подросткам понравятся командные сражения на арене. Если играют и взрослые, подберём игры для всех.',
  'На арене одновременно играют до 10 человек. Если гостей больше, разделим их на команды и устроим турнир.',
  'Всё, что выберете, включим в расчёт. Торт можно принести свой — предупредите заранее.',
  'Подскажем свободное время на выбранную дату и придержим его, пока вы всё обсуждаете с гостями.',
  'Остался последний шаг! Пришлём расчёт с учётом ваших ответов и подскажем, как сэкономить.',
];

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export function initProgramPicker() {
  const picker = document.querySelector('[data-program-picker]');

  if (!picker) return;

  const form = picker.querySelector('[data-program-form]');
  const steps = [...picker.querySelectorAll('[data-program-step]')];
  const backButton = picker.querySelector('[data-program-back]');
  const nextButton = picker.querySelector('[data-program-next]');
  const percent = picker.querySelector('[data-program-percent]');
  const progress = picker.querySelector('[data-program-progress]');
  const hint = picker.querySelector('[data-program-hint]');
  const dateLabel = picker.querySelector('[data-program-date]');
  const status = picker.querySelector('[data-program-status]');
  const locationField = picker.querySelector('[data-program-location]');
  const locationTrigger = picker.querySelector('[data-program-location-trigger]');
  const locationValue = picker.querySelector('[data-program-location-value]');
  const locationOptions = picker.querySelector('[data-program-location-options]');
  const locationInput = picker.querySelector('[data-program-location-input]');
  const nameInput = form.elements.namedItem('name');
  const phoneInput = form.elements.namedItem('phone');
  const consentInput = form.elements.namedItem('consent');
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  let currentStep = 1;
  let selectedDate = null;

  const pageLocation = () => ({
    countryId: document.documentElement.dataset.country || defaultLocationState.countryId,
    cityName: document.documentElement.dataset.city || defaultLocationState.cityName,
    locationId: document.documentElement.dataset.location || '',
  });

  const closeLocations = (restoreFocus = false) => {
    locationField.classList.remove('is-open');
    locationOptions.hidden = true;
    locationTrigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) locationTrigger.focus();
  };

  const selectLocation = (location) => {
    locationInput.value = location.id;
    locationValue.textContent = location.name;
    locationTrigger.classList.remove('is-placeholder');
    locationTrigger.setAttribute('aria-invalid', 'false');
    status.hidden = true;
    [...locationOptions.children].forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.locationId === location.id));
    });
    closeLocations(true);
  };

  const openLocations = (focusIndex = 0) => {
    locationField.classList.add('is-open');
    locationOptions.hidden = false;
    locationTrigger.setAttribute('aria-expanded', 'true');
    const options = [...locationOptions.children];
    const selectedIndex = options.findIndex(
      (option) => option.dataset.locationId === locationInput.value,
    );
    options[selectedIndex >= 0 ? selectedIndex : focusIndex]?.focus();
  };

  const syncLocations = () => {
    const state = pageLocation();
    const previousValue = locationInput.value;
    const locations = [...getLocations(state.countryId, state.cityName)];
    if (state.cityName === 'Екатеринбург') {
      const order = ['raduga-park', 'veer-mall', 'alatyr'];
      locations.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    locationOptions.replaceChildren();
    locations.forEach((location, index) => {
      const option = document.createElement('button');
      option.className = 'program-picker__location-option button-reset';
      option.type = 'button';
      option.id = `program-location-option-${index}`;
      option.dataset.locationId = location.id;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      const name = document.createElement('span');
      name.className = 'program-picker__location-name';
      name.textContent = location.name;
      const meta = document.createElement('small');
      meta.textContent = `${location.type} · ${location.rating}/5 · ${location.address}`;
      const mark = document.createElement('span');
      mark.className = 'program-picker__location-mark';
      mark.setAttribute('aria-hidden', 'true');
      option.append(name, meta, mark);
      option.addEventListener('click', () => selectLocation(location));
      locationOptions.append(option);
    });

    const selected = locations.find((location) => location.id === previousValue);
    locationInput.value = selected?.id || '';
    locationValue.textContent = selected?.name || 'Выберите локацию';
    locationTrigger.classList.toggle('is-placeholder', !selected);
    [...locationOptions.children].forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.locationId === selected?.id));
    });
    locationTrigger.setAttribute('aria-invalid', 'false');
    closeLocations();
  };

  const stepComplete = () => {
    if (currentStep === 1) return Boolean(form.elements.eventType.value);
    if (currentStep === 2) return Boolean(form.elements.ageRange.value);
    if (currentStep === 3) return Boolean(form.elements.guestCount.value);
    if (currentStep === 5) return selectedDate instanceof Date;
    return true;
  };

  const updateNavigation = () => {
    const value = Math.round(((currentStep - 1) / STEP_COUNT) * 100);
    percent.textContent = `${value}%`;
    progress.style.width = `${value}%`;
    hint.textContent = stepHints[currentStep - 1];
    backButton.disabled = currentStep === 1;
    nextButton.disabled = !stepComplete();

    if (currentStep === STEP_COUNT) {
      nextButton.textContent = 'Получить расчёт';
    } else if (currentStep === 4 && !form.querySelector('[name="services"]:checked')) {
      nextButton.textContent = 'Пропустить';
    } else {
      nextButton.textContent = 'Следующий вопрос';
    }
  };

  const showStep = (step, focusHeading = true) => {
    currentStep = Math.max(1, Math.min(step, STEP_COUNT));
    steps.forEach((section) => {
      section.hidden = Number(section.dataset.programStep) !== currentStep;
    });
    status.hidden = true;
    updateNavigation();

    if (focusHeading) {
      const heading = steps[currentStep - 1].querySelector('.program-picker__question');
      heading.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
  };

  new AirDatepicker(picker.querySelector('[data-program-calendar]'), {
    inline: true,
    keyboardNav: true,
    locale: localeRu,
    minDate: new Date(),
    navTitles: { days: 'MMMM yyyy' },
    onSelect({ date }) {
      selectedDate = Array.isArray(date) ? date[0] : date;
      dateLabel.textContent = selectedDate ? dateFormatter.format(selectedDate) : 'Невыбрана';
      updateNavigation();
    },
  });

  const complete = () => {
    nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Укажите ваше имя');
    phoneInput.setCustomValidity(isPhoneComplete(phoneInput) ? '' : 'Введите телефон полностью');

    if (!locationInput.value) {
      locationTrigger.setAttribute('aria-invalid', 'true');
      locationTrigger.focus();
      status.textContent = 'Выберите локацию';
      status.hidden = false;
      return;
    }

    if (![nameInput, phoneInput, consentInput].every((field) => field.validity.valid)) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const state = { ...pageLocation(), locationId: locationInput.value };

    document.dispatchEvent(
      new CustomEvent('warpoint:event-quiz-complete', {
        detail: {
          city: state.cityName,
          countryId: state.countryId,
          eventType: data.get('eventType'),
          ageRange: data.get('ageRange'),
          guestCount: data.get('guestCount'),
          services: data.getAll('services'),
          date: selectedDate ? formatDateKey(selectedDate) : '',
          locationId: state.locationId,
          location: getLocation(state),
          name: nameInput.value.trim(),
          phone: phoneInput.value,
          messenger: data.get('messenger'),
          consent: consentInput.checked,
        },
      }),
    );

    status.textContent = 'Спасибо! Мы свяжемся с вами и подготовим расчёт.';
    status.hidden = false;
  };

  syncLocations();
  showStep(1, false);
  document.addEventListener('warpoint:location-change', syncLocations);
  locationTrigger.addEventListener('click', () => {
    if (locationOptions.hidden) openLocations();
    else closeLocations(true);
  });
  locationTrigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openLocations(event.key === 'ArrowUp' ? locationOptions.children.length - 1 : 0);
    }
  });
  locationOptions.addEventListener('keydown', (event) => {
    const options = [...locationOptions.children];
    const currentIndex = options.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLocations(true);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      options[(currentIndex + direction + options.length) % options.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      options[event.key === 'Home' ? 0 : options.length - 1]?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!locationField.contains(event.target)) closeLocations();
  });
  document.addEventListener('focusin', (event) => {
    if (!locationField.contains(event.target)) closeLocations();
  });
  form.addEventListener('change', updateNavigation);
  form.addEventListener('input', () => {
    nameInput.setCustomValidity('');
    phoneInput.setCustomValidity('');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currentStep === STEP_COUNT) complete();
  });
  backButton.addEventListener('click', () => showStep(currentStep - 1));
  nextButton.addEventListener('click', () => {
    if (!stepComplete()) return;
    if (currentStep === STEP_COUNT) {
      complete();
    } else {
      showStep(currentStep + 1);
    }
  });
}
