import { getCountry, getLocation, getLocations } from '../data/location-data.js';
import { updateYandexMap } from './yandex-map.js';

export function initContacts() {
  const contacts = document.querySelector('.contacts');
  if (!contacts || contacts.dataset.contactsInitialized) return;
  contacts.dataset.contactsInitialized = 'true';

  const city = contacts.querySelector('[data-contacts-city]');
  const locationName = contacts.querySelector('[data-contacts-location]');
  const address = contacts.querySelector('[data-contacts-address]');
  const addressLocation = contacts.querySelector('[data-contacts-address-location]');
  const metroRow = contacts.querySelector('[data-contacts-metro-row]');
  const metro = contacts.querySelector('[data-contacts-metro]');
  const map = contacts.querySelector('[data-yandex-map]');
  const select = contacts.querySelector('[data-contacts-select]');
  const toggle = select.querySelector('[data-contacts-select-toggle]');
  const list = select.querySelector('[data-contacts-location-list]');
  const markupState = {
    countryId: select.dataset.countryId,
    cityName: select.dataset.cityName,
    locationId: select.dataset.selectedLocationId,
  };
  let currentState = { ...markupState };
  const markupFields = [city, locationName, address, addressLocation, metro].map((element) => ({
    element,
    content: element.innerHTML,
  }));
  const markupMetroHidden = metroRow.hidden;
  const markupMap = { source: map.dataset.mapSrc, title: map.dataset.mapTitle };

  const closeSelect = (restoreFocus = false) => {
    toggle.setAttribute('aria-expanded', 'false');
    list.hidden = true;
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };

  const renderOptions = () => {
    const options = getLocations(currentState.countryId, currentState.cityName).map((location) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'contacts__location-option button-reset';
      option.dataset.contactsOption = location.id;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(location.id === currentState.locationId));
      option.tabIndex = -1;

      const name = document.createElement('span');
      name.className = 'contacts__location-option-name';
      name.textContent = location.name;
      const details = document.createElement('span');
      details.className = 'contacts__location-option-details';
      details.textContent = `${location.type} — ${location.rating}/5 — ${location.address}`;
      option.append(name, details);
      return option;
    });
    list.replaceChildren(...options);
    list.setAttribute('aria-label', `Локации: ${currentState.cityName}`);
    toggle.setAttribute('aria-label', `Выбрать локацию: ${locationName.textContent}`);
  };

  const openSelect = () => {
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    const selected = list.querySelector('[aria-selected="true"]') || list.firstElementChild;
    selected?.focus({ preventScroll: true });
  };

  const render = (state) => {
    closeSelect(select.contains(document.activeElement));
    const location = getLocation(state);
    const hasContactData = state.countryId === 'ru' && state.cityName === 'Екатеринбург';

    // Other cities only have directory placeholders, not contact details.
    // Restore the complete HTML card instead of replacing it with a placeholder.
    if (!location || !hasContactData) {
      currentState = { ...markupState };
      markupFields.forEach(({ element, content }) => {
        element.innerHTML = content;
      });
      metroRow.hidden = markupMetroHidden;
      updateYandexMap(map, markupMap);
      renderOptions();
      return;
    }

    currentState = {
      countryId: state.countryId,
      cityName: state.cityName,
      locationId: state.locationId,
    };
    const country = getCountry(state.countryId);
    city.textContent = state.cityName;
    locationName.textContent = location.name;
    address.textContent = location.address;
    addressLocation.textContent = location.name;
    const hasMetro = location.details.startsWith('Метро:');
    metroRow.hidden = !hasMetro;
    metro.textContent = hasMetro ? location.details.replace(/^Метро:\s*/, 'Метро «') + '»' : '';

    const query = ['Warpoint', country.name, state.cityName, location.address].join(', ');
    const source = new URL('https://yandex.ru/map-widget/v1/');
    source.search = new URLSearchParams({ mode: 'search', text: query, z: '16' });
    updateYandexMap(map, {
      source: source.href,
      title: `${location.name}, ${state.cityName} — Warpoint на Яндекс Картах`,
    });
    renderOptions();
  };

  const { country, city: cityName, location: locationId } = document.documentElement.dataset;
  if (country && cityName && locationId) {
    render({ countryId: country, cityName, locationId });
  } else {
    renderOptions();
  }
  document.addEventListener('warpoint:location-change', (event) => render(event.detail));

  toggle.addEventListener('click', () => {
    if (list.hidden) openSelect();
    else closeSelect(true);
  });

  list.addEventListener('click', (event) => {
    const option = event.target.closest('[data-contacts-option]');
    if (!option) return;
    const state = { ...currentState, locationId: option.dataset.contactsOption };
    const location = getLocation(state);
    if (!location) return;

    closeSelect(true);
    document.dispatchEvent(
      new CustomEvent('warpoint:location-change', {
        detail: { ...state, country: getCountry(state.countryId), location },
      }),
    );
  });

  select.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !list.hidden) {
      event.preventDefault();
      event.stopPropagation();
      closeSelect(true);
      return;
    }
    if (event.key === 'Tab' && !list.hidden) {
      closeSelect(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (list.hidden) {
      openSelect();
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') return;
    }
    const options = [...list.querySelectorAll('[role="option"]')];
    const activeIndex = options.indexOf(document.activeElement);
    let nextIndex = activeIndex + (event.key === 'ArrowUp' ? -1 : 1);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;
    options[Math.max(0, Math.min(nextIndex, options.length - 1))]?.focus({ preventScroll: true });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!select.contains(event.target)) closeSelect();
  });
  select.addEventListener('focusout', (event) => {
    if (!select.contains(event.relatedTarget)) closeSelect();
  });

  contacts.querySelectorAll('.contacts__social').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.getAttribute('href') === '#') event.preventDefault();
    });
  });
}
