import {
  countries,
  defaultLocationState,
  getCountry,
  getLocation,
  getLocations,
} from '../data/location-data.js';
import { toggleScrollLock } from '../_functions.js';
import { setPhoneCountry } from './phone-mask.js';

const STORAGE_KEY = 'warpoint-location';
const pluralRules = new Intl.PluralRules('ru-RU');
const cityForms = { one: 'город', few: 'города', many: 'городов', other: 'города' };
const stepLabels = {
  country: { title: 'страну', search: 'Поиск страны', empty: 'Страна не найдена' },
  city: { title: 'город', search: 'Поиск города', empty: 'Город не найден' },
  location: { title: 'локацию', search: 'Поиск локации', empty: 'Локация не найдена' },
};
const normalizeQuery = (value) => value.trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
};

const createButton = (className, text) => {
  const button = createElement('button', `${className} button-reset`, text);

  button.type = 'button';

  return button;
};

function normalizeState(state) {
  const country = getCountry(state?.countryId);
  const cityName = country.cities.includes(state?.cityName) ? state.cityName : country.cities[0];
  const locations = getLocations(country.id, cityName);
  const locationId = locations.some((location) => location.id === state?.locationId)
    ? state.locationId
    : locations[0]?.id;

  return {
    cityName,
    countryId: country.id,
    locationId,
  };
}

function loadState() {
  try {
    const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return normalizeState(storedState ?? defaultLocationState);
  } catch {
    return { ...defaultLocationState };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The selection still works for the current page when storage is unavailable.
  }
}

function groupCities(cities) {
  return cities.reduce((groups, city) => {
    const letter = city.charAt(0).toLocaleUpperCase('ru-RU');

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }

    groups.get(letter).push(city);

    return groups;
  }, new Map());
}

export function initLocationModal() {
  const modal = document.querySelector('[data-location-modal]');

  if (!modal || modal.dataset.locationInitialized) {
    return;
  }

  modal.dataset.locationInitialized = 'true';

  const dialog = modal.querySelector('[data-location-dialog]');
  const content = modal.querySelector('.location-modal__content');
  const countryList = modal.querySelector('[data-location-country-list]');
  const cityList = modal.querySelector('[data-location-city-list]');
  const search = modal.querySelector('[data-location-search]');
  const searchLabel = modal.querySelector('[data-location-search-label]');
  const empty = modal.querySelector('[data-location-empty]');
  const heading = modal.querySelector('#location-modal-title');
  const title = modal.querySelector('[data-location-title]');
  const locationList = modal.querySelector('[data-location-list]');
  const countryLabel = modal.querySelector('[data-location-country-label]');
  const cityLabel = modal.querySelector('[data-location-city-label]');
  const locationLabel = modal.querySelector('[data-location-location-label]');
  const confirmButton = modal.querySelector('[data-location-confirm]');
  const stepButtons = [...modal.querySelectorAll('[data-location-step]')];
  const views = [...modal.querySelectorAll('[data-location-view]')];
  const openButtons = [...document.querySelectorAll('[data-location-open]')];
  const mobileMenuToggle = document.querySelector('[data-mobile-menu-toggle]');
  const headerCities = [...document.querySelectorAll('[data-header-city]')];
  const headerAddresses = [...document.querySelectorAll('[data-header-address]')];

  let appliedState = loadState();
  let draftState = { ...appliedState };
  let currentStep = 'country';
  let activeTrigger = null;
  let cityColumns = 0;

  const getCityColumnCount = () =>
    Number.parseInt(getComputedStyle(modal).getPropertyValue('--location-city-columns'), 10) || 1;

  const updateEmpty = (count) => {
    empty.hidden = count > 0;
    empty.textContent = count > 0 ? '' : stepLabels[currentStep].empty;
  };

  const getDraftLocation = () => getLocation(draftState);

  const applyStateToPage = (state, clearPhoneValue = false) => {
    const country = getCountry(state.countryId);
    const location = getLocation(state);

    headerCities.forEach((headerCity) => {
      headerCity.textContent = state.cityName;
    });

    if (location) {
      headerAddresses.forEach((headerAddress) => {
        headerAddress.textContent = location.headerAddress;
      });
    }

    document.documentElement.dataset.country = country.id;
    document.documentElement.dataset.city = state.cityName;
    document.documentElement.dataset.location = state.locationId;
    setPhoneCountry(country.id, { clearValue: clearPhoneValue });
  };

  const updateSidebar = () => {
    const country = getCountry(draftState.countryId);
    const location = getDraftLocation();

    countryLabel.textContent = country.name;
    cityLabel.textContent = draftState.cityName || 'Выберите город';
    locationLabel.textContent = location?.name || 'Выберите локацию';
    [countryLabel, cityLabel, locationLabel].forEach((label) => {
      label.title = label.textContent;
    });

    const cityStep = stepButtons.find((button) => button.dataset.locationStep === 'city');
    const locationStep = stepButtons.find((button) => button.dataset.locationStep === 'location');

    cityStep.disabled = !draftState.countryId;
    locationStep.disabled = !draftState.cityName;
    confirmButton.disabled = !location;
  };

  const setCountry = (countryId, cityName = '') => {
    draftState = {
      cityName,
      countryId,
      locationId: undefined,
    };
    updateSidebar();
  };

  const renderCountries = (query = '') => {
    const fragment = document.createDocumentFragment();
    const normalizedQuery = normalizeQuery(query);
    const filteredCountries = countries.filter((country) =>
      normalizeQuery(country.name).includes(normalizedQuery),
    );

    filteredCountries.forEach((country) => {
      const countryButton = createButton('location-modal__country-button');
      const flag = createElement('img', 'location-modal__country-flag');
      const copy = createElement('span', 'location-modal__country-copy');
      const name = createElement('span', 'location-modal__country-name', country.name);
      const count = country.cities.length;
      const cityCount = createElement(
        'span',
        'location-modal__country-count',
        `${count} ${cityForms[pluralRules.select(count)]}`,
      );

      flag.src = country.flag;
      flag.width = 51;
      flag.height = 38;
      flag.alt = '';
      countryButton.dataset.countryId = country.id;
      countryButton.classList.toggle('is-selected', country.id === draftState.countryId);
      countryButton.setAttribute('aria-pressed', String(country.id === draftState.countryId));
      copy.append(name, cityCount);
      countryButton.append(flag, copy);
      countryButton.addEventListener('click', () => {
        if (country.id !== draftState.countryId) setCountry(country.id);
        setStep('city');
      });
      fragment.append(countryButton);
    });

    countryList.replaceChildren(fragment);
    updateEmpty(filteredCountries.length);
  };

  const renderCities = (query = '') => {
    const country = getCountry(draftState.countryId);
    const normalizedQuery = normalizeQuery(query);
    const filteredCities = country.cities
      .filter((city) => normalizeQuery(city).includes(normalizedQuery))
      .sort((first, second) => first.localeCompare(second, 'ru-RU'));
    cityColumns = getCityColumnCount();
    const columns = Array.from({ length: cityColumns }, () => ({
      element: createElement('div', 'location-modal__city-column'),
      height: 0,
    }));

    groupCities(filteredCities).forEach((cities, letter) => {
      const group = createElement('section', 'location-modal__city-group');
      const heading = createElement('h4', 'location-modal__city-letter', letter);
      const list = createElement('div', 'location-modal__city-list');

      cities.forEach((city) => {
        const button = createButton('location-modal__city-button', city);

        button.dataset.cityName = city;
        button.classList.toggle('is-selected', city === draftState.cityName);
        button.setAttribute('aria-pressed', String(city === draftState.cityName));
        button.addEventListener('click', () => {
          if (city !== draftState.cityName) {
            draftState.cityName = city;
            draftState.locationId = undefined;
          }
          updateSidebar();
          setStep('location');
        });
        list.append(button);
      });

      group.append(heading, list);
      const column = columns.reduce((shortest, candidate) =>
        candidate.height < shortest.height ? candidate : shortest,
      );
      column.element.append(group);
      column.height += 57 + cities.length * 28;
    });

    cityList.replaceChildren(...columns.map((column) => column.element));
    updateEmpty(filteredCities.length);
  };

  const renderLocations = (query = '') => {
    const normalizedQuery = normalizeQuery(query);
    const locations = getLocations(draftState.countryId, draftState.cityName).filter((location) =>
      normalizeQuery(
        `${location.name} ${location.address} ${location.details} ${location.type}`,
      ).includes(normalizedQuery),
    );
    const fragment = document.createDocumentFragment();

    locations.forEach((location) => {
      const card = createButton('location-modal__location-card');
      const title = createElement('span', 'location-modal__location-title', location.name);
      const address = createElement('span', 'location-modal__location-address', location.address);
      const meta = createElement('span', 'location-modal__location-meta');
      const rating = createElement('span', 'location-modal__location-rating', location.rating);
      const type = createElement('span', 'location-modal__location-type', location.type);
      const maximumRating = createElement('span', 'location-modal__location-rating-max', '/5');
      const isSelected = location.id === draftState.locationId;

      rating.append(maximumRating);
      meta.append(type, rating);
      card.title = [location.address, location.details].filter(Boolean).join(', ');
      card.dataset.locationId = location.id;
      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-pressed', String(isSelected));
      card.append(meta, title, address);
      card.addEventListener('click', () => {
        draftState.locationId = location.id;
        updateSidebar();
        locationList.querySelectorAll('[data-location-id]').forEach((locationCard) => {
          const cardIsSelected = locationCard.dataset.locationId === draftState.locationId;

          locationCard.classList.toggle('is-selected', cardIsSelected);
          locationCard.setAttribute('aria-pressed', String(cardIsSelected));
        });
      });
      fragment.append(card);
    });

    locationList.replaceChildren(fragment);
    updateEmpty(locations.length);
  };

  const renderCurrentStep = () => {
    const render = { country: renderCountries, city: renderCities, location: renderLocations };
    render[currentStep](search.value);
  };

  function setStep(step, moveFocus = true) {
    if (!Object.hasOwn(stepLabels, step)) step = 'country';
    if (step === 'city' && !draftState.countryId) {
      step = 'country';
    }

    if (step === 'location' && !draftState.cityName) {
      step = draftState.countryId ? 'city' : 'country';
    }

    currentStep = step;
    views.forEach((view) => {
      view.hidden = view.dataset.locationView !== currentStep;
    });
    stepButtons.forEach((button) => {
      const isActive = button.dataset.locationStep === currentStep;

      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'step' : 'false');
    });

    const labels = stepLabels[currentStep];
    title.textContent = labels.title;
    search.placeholder = labels.search;
    searchLabel.textContent = labels.search;
    search.value = '';
    renderCurrentStep();
    content.scrollTop = 0;
    if (moveFocus) heading.focus({ preventScroll: true });
  }

  const closeModal = (shouldApply = false) => {
    if (shouldApply) {
      const location = getDraftLocation();

      if (!location) {
        return;
      }

      const countryChanged = appliedState.countryId !== draftState.countryId;
      appliedState = normalizeState(draftState);
      saveState(appliedState);
      applyStateToPage(appliedState, countryChanged);
      document.dispatchEvent(
        new CustomEvent('warpoint:location-change', {
          detail: {
            ...appliedState,
            country: getCountry(appliedState.countryId),
            location: getLocation(appliedState),
          },
        }),
      );
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    toggleScrollLock(false);
    activeTrigger?.focus();
  };

  const openModal = (step, trigger) => {
    activeTrigger = trigger;
    draftState = { ...appliedState };
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    toggleScrollLock(true);
    updateSidebar();
    setStep(step, false);
    requestAnimationFrame(() => dialog.focus());
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
      (element) => !element.closest('[hidden]'),
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

  openButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const restoreTarget = button.closest('[data-mobile-menu]') ? mobileMenuToggle : button;

      openModal(button.dataset.locationOpen || 'country', restoreTarget || button);
    });
  });
  stepButtons.forEach((button) => {
    button.addEventListener('click', () => setStep(button.dataset.locationStep));
  });
  search.addEventListener('input', () => {
    renderCurrentStep();
    content.scrollTop = 0;
  });
  window.addEventListener('resize', () => {
    if (
      modal.classList.contains('is-open') &&
      currentStep === 'city' &&
      cityColumns !== getCityColumnCount()
    ) {
      renderCities(search.value);
    }
  });
  modal.querySelector('[data-location-cancel]').addEventListener('click', () => closeModal());
  modal.querySelector('[data-location-close]').addEventListener('click', () => closeModal());
  confirmButton.addEventListener('click', () => closeModal(true));
  modal.addEventListener('keydown', trapFocus);

  // A contact dropdown can select a location without opening this dialog.
  document.addEventListener('warpoint:location-change', (event) => {
    const nextState = normalizeState(event.detail);
    if (
      nextState.countryId === appliedState.countryId &&
      nextState.cityName === appliedState.cityName &&
      nextState.locationId === appliedState.locationId
    ) {
      return;
    }

    const countryChanged = nextState.countryId !== appliedState.countryId;
    appliedState = nextState;
    draftState = { ...nextState };
    saveState(appliedState);
    applyStateToPage(appliedState, countryChanged);
    updateSidebar();
    if (modal.classList.contains('is-open')) renderCurrentStep();
  });

  applyStateToPage(appliedState);
  updateSidebar();
}
