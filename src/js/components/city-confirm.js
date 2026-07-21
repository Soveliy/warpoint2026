const STORAGE_KEY = 'warpoint-city-confirmed';

const readConfirmedCity = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const saveConfirmedCity = (city) => {
  try {
    localStorage.setItem(STORAGE_KEY, city);
  } catch {
    // The confirmation still works for the current page when storage is unavailable.
  }
};

export function initCityConfirm() {
  const prompt = document.querySelector('[data-city-confirm]');
  const currentSelection = document.querySelector('[data-city-confirm-current]');

  if (!prompt || !currentSelection) {
    return;
  }

  const cityNames = [...document.querySelectorAll('[data-city-confirm-name]')];
  let currentCity = document.documentElement.dataset.city || 'Екатеринбург';

  const render = (isConfirmed) => {
    cityNames.forEach((element) => {
      element.textContent = currentCity;
    });
    prompt.hidden = isConfirmed;
    currentSelection.hidden = !isConfirmed;
  };

  prompt.querySelector('[data-city-confirm-yes]').addEventListener('click', () => {
    saveConfirmedCity(currentCity);
    render(true);
  });

  document.addEventListener('warpoint:location-change', (event) => {
    currentCity = event.detail?.cityName || document.documentElement.dataset.city || currentCity;
    saveConfirmedCity(currentCity);
    render(true);
  });

  render(readConfirmedCity() === currentCity);
}
