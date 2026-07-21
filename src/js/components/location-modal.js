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

  if (!modal) {
    return;
  }

  const dialog = modal.querySelector('[data-location-dialog]');
  const content = modal.querySelector('.location-modal__content');
  const countryList = modal.querySelector('[data-location-country-list]');
  const cityList = modal.querySelector('[data-location-city-list]');
  const citySearch = modal.querySelector('[data-location-city-search]');
  const cityEmpty = modal.querySelector('[data-location-city-empty]');
  const locationList = modal.querySelector('[data-location-list]');
  const person = modal.querySelector('[data-location-person]');
  const selectedFlag = modal.querySelector('[data-location-selected-flag]');
  const countryLabel = modal.querySelector('[data-location-country-label]');
  const cityLabel = modal.querySelector('[data-location-city-label]');
  const locationLabel = modal.querySelector('[data-location-location-label]');
  const confirmButton = modal.querySelector('[data-location-confirm]');
  const stepButtons = [...modal.querySelectorAll('[data-location-step]')];
  const views = [...modal.querySelectorAll('[data-location-view]')];
  const openButtons = [...document.querySelectorAll('[data-location-open]')];
  const headerCity = document.querySelector('[data-header-city]');
  const headerAddress = document.querySelector('[data-header-address]');

  let appliedState = loadState();
  let draftState = { ...appliedState };
  let currentStep = 'country';
  let activeTrigger = null;

  const getDraftLocation = () => getLocation(draftState);

  const applyStateToPage = (state, clearPhoneValue = false) => {
    const country = getCountry(state.countryId);
    const location = getLocation(state);

    if (headerCity) {
      headerCity.textContent = state.cityName;
    }

    if (headerAddress && location) {
      headerAddress.textContent = location.headerAddress;
    }

    document.documentElement.dataset.country = country.id;
    document.documentElement.dataset.city = state.cityName;
    setPhoneCountry(country.id, { clearValue: clearPhoneValue });
  };

  const updateSidebar = () => {
    const country = getCountry(draftState.countryId);
    const location = getDraftLocation();

    countryLabel.textContent = country.name;
    cityLabel.textContent = draftState.cityName || 'Выберите город';
    locationLabel.textContent = location?.name || 'Выберите локацию';
    selectedFlag.src = country.flag;
    person.src = country.person;

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

  const renderCountries = () => {
    const fragment = document.createDocumentFragment();

    countries.forEach((country) => {
      const group = createElement('article', 'location-modal__country');
      const countryButton = createButton('location-modal__country-button');
      const flag = createElement('img', 'location-modal__country-flag');
      const name = createElement('span', '', country.name);

      flag.src = country.flag;
      flag.width = 33;
      flag.height = 25;
      flag.alt = '';
      countryButton.classList.toggle('is-selected', country.id === draftState.countryId);
      countryButton.setAttribute('aria-pressed', String(country.id === draftState.countryId));
      countryButton.append(flag, name);
      countryButton.addEventListener('click', () => {
        setCountry(country.id);
        setStep('city');
      });
      group.append(countryButton);

      if (country.cities.length <= 8) {
        const cities = createElement('div', 'location-modal__country-cities');

        country.cities.forEach((city) => {
          const cityButton = createButton('location-modal__country-city', city);

          cityButton.classList.toggle(
            'is-selected',
            country.id === draftState.countryId && city === draftState.cityName,
          );
          cityButton.addEventListener('click', () => {
            setCountry(country.id, city);
            updateSidebar();
            setStep('location');
          });
          cities.append(cityButton);
        });

        group.append(cities);
      }

      fragment.append(group);
    });

    countryList.replaceChildren(fragment);
  };

  const renderCities = (query = '') => {
    const country = getCountry(draftState.countryId);
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    const filteredCities = country.cities.filter((city) =>
      city.toLocaleLowerCase('ru-RU').includes(normalizedQuery),
    );
    const fragment = document.createDocumentFragment();

    groupCities(filteredCities).forEach((cities, letter) => {
      const group = createElement('section', 'location-modal__city-group');
      const heading = createElement('h4', 'location-modal__city-letter', letter);
      const list = createElement('div', 'location-modal__city-list');

      cities.forEach((city) => {
        const button = createButton('location-modal__city-button', city);

        button.classList.toggle('is-selected', city === draftState.cityName);
        button.setAttribute('aria-pressed', String(city === draftState.cityName));
        button.addEventListener('click', () => {
          draftState.cityName = city;
          draftState.locationId = undefined;
          updateSidebar();
          setStep('location');
        });
        list.append(button);
      });

      group.append(heading, list);
      fragment.append(group);
    });

    cityList.replaceChildren(fragment);
    cityEmpty.hidden = Boolean(filteredCities.length);
  };

  const renderLocations = () => {
    const locations = getLocations(draftState.countryId, draftState.cityName);
    const fragment = document.createDocumentFragment();

    locations.forEach((location) => {
      const card = createButton('location-modal__location-card');
      const title = createElement('h4', 'location-modal__location-title', location.name);
      const address = createElement('p', 'location-modal__location-address', location.address);
      const details = createElement('span', 'location-modal__location-details', location.details);
      const meta = createElement('div', 'location-modal__location-meta');
      const rating = createElement('span', 'location-modal__location-rating', location.rating);
      const type = createElement('span', 'location-modal__location-type', location.type);
      const image = createElement('img', 'location-modal__location-image');
      const isSelected = location.id === draftState.locationId;

      address.append(details);
      meta.append(rating, type);
      image.src = location.image;
      image.alt = location.name;
      image.loading = 'lazy';
      image.decoding = 'async';
      card.dataset.locationId = location.id;
      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-pressed', String(isSelected));
      card.append(title, address, meta, image);
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
  };

  function setStep(step) {
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

    if (currentStep === 'country') {
      renderCountries();
    } else if (currentStep === 'city') {
      citySearch.value = '';
      renderCities();
    } else {
      renderLocations();
    }

    content.scrollTop = 0;
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
    setStep(step);
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

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => {
      openModal(button.dataset.locationOpen || 'country', button);
    });
  });
  stepButtons.forEach((button) => {
    button.addEventListener('click', () => setStep(button.dataset.locationStep));
  });
  citySearch.addEventListener('input', () => renderCities(citySearch.value));
  modal.querySelector('[data-location-cancel]').addEventListener('click', () => closeModal());
  modal.querySelector('[data-location-close]').addEventListener('click', () => closeModal());
  confirmButton.addEventListener('click', () => closeModal(true));
  modal.addEventListener('keydown', trapFocus);

  applyStateToPage(appliedState);
  updateSidebar();
}
