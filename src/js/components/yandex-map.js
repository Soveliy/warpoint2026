const instances = new WeakMap();
let apiPromise;

const loadYandexApi = () => {
  if (apiPromise) return apiPromise;
  const key = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim();
  if (!key) return Promise.reject(new Error('Yandex Maps API key is not configured'));

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => reject(new Error('Yandex Maps API timeout')), 15000);
    const finish = (error) => {
      window.clearTimeout(timeout);
      if (error) reject(error);
      else resolve(window.ymaps);
    };
    script.async = true;
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=' + encodeURIComponent(key);
    script.onload = () => {
      if (window.ymaps) window.ymaps.ready(() => finish(), finish);
      else finish(new Error('Yandex Maps API is unavailable'));
    };
    script.onerror = () => finish(new Error('Yandex Maps API failed to load'));
    document.head.append(script);
  });
  return apiPromise;
};

const setLoaded = (map) => {
  map.classList.add('is-loaded');
  map.setAttribute('aria-busy', 'false');
  const status = map.querySelector('[data-map-status]');
  if (status) status.textContent = 'Карта загружена';
};

const createMapFrame = (map) => {
  const frame = document.createElement('iframe');
  frame.className = 'contacts__map-frame';
  frame.title = map.dataset.mapTitle || 'Карта проезда';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  frame.allowFullscreen = true;
  frame.addEventListener(
    'load',
    () => {
      if (frame.isConnected) setLoaded(map);
    },
    { once: true },
  );
  frame.src = map.dataset.mapSrc;
  map.append(frame);
};

const createMap = async (map) => {
  if (map.dataset.mapLoaded === 'true') return;
  map.dataset.mapLoaded = 'true';
  let canvas;
  let instance;

  try {
    const ymaps = await loadYandexApi();
    if (!map.isConnected) return;
    // Read after API loading: the user may have changed the location meanwhile.
    const coordinates = map.dataset.mapCoordinates.split(',').map(Number);
    canvas = document.createElement('div');
    canvas.className = 'contacts__map-canvas';
    canvas.setAttribute('role', 'region');
    canvas.setAttribute('aria-label', map.dataset.mapTitle);
    map.append(canvas);
    instance = new ymaps.Map(
      canvas,
      {
        center: coordinates,
        zoom: 16,
        controls: ['zoomControl'],
        behaviors: ['drag', 'dblClickZoom', 'multiTouch'],
      },
      {
        yandexMapDisablePoiInteractivity: true,
        suppressMapOpenBlock: true,
      },
    );
    const pin = new ymaps.Placemark(
      coordinates,
      {},
      {
        iconLayout: 'default#image',
        iconImageHref: new URL('img/map-pin.svg', document.baseURI).href,
        iconImageSize: [80, 80],
        // The small dot in the SVG is the geographic anchor.
        iconImageOffset: [-40, -97],
        hasBalloon: false,
        hasHint: false,
        openBalloonOnClick: false,
        openHintOnHover: false,
        cursor: 'default',
      },
    );
    instance.geoObjects.add(pin);
    instances.set(map, { instance, pin, canvas });
    setLoaded(map);
  } catch {
    instance?.destroy();
    canvas?.remove();
    if (map.isConnected) createMapFrame(map);
  }
};

export function updateYandexMap(map, { coordinates, title }) {
  if (!map || !coordinates) return;
  const changed = map.dataset.mapCoordinates !== coordinates.join(',');
  map.dataset.mapCoordinates = coordinates.join(',');
  map.dataset.mapTitle = title;
  const point = coordinates[1] + ',' + coordinates[0];
  // Coordinate-only widget: no organization search results or open business card.
  const source = new URL('https://yandex.ru/map-widget/v1/');
  source.search = new URLSearchParams({ ll: point, pt: point + ',pm2rdm', z: '16' });
  map.dataset.mapSrc = source.href;

  const current = instances.get(map);
  if (current) {
    current.canvas.setAttribute('aria-label', title);
    if (changed) {
      current.pin.geometry.setCoordinates(coordinates);
      current.instance.setCenter(coordinates, 16);
    }
    return;
  }

  const frame = map.querySelector(':scope > .contacts__map-frame');
  if (frame) {
    frame.title = title;
    if (changed) {
      map.classList.remove('is-loaded');
      map.setAttribute('aria-busy', 'true');
      const status = map.querySelector('[data-map-status]');
      if (status) status.textContent = 'Карта загружается';
      frame.remove();
      createMapFrame(map);
    }
  }
}

export function initYandexMaps() {
  const maps = document.querySelectorAll('[data-yandex-map]');
  if (!maps.length) return;
  if (!('IntersectionObserver' in window)) {
    maps.forEach(createMap);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        createMap(entry.target);
      });
    },
    { rootMargin: '300px 0px' },
  );
  maps.forEach((map) => observer.observe(map));
}
