const createMapFrame = (map) => {
  if (map.dataset.mapLoaded === 'true') return;

  const source = map.dataset.mapSrc;
  if (!source) return;

  map.dataset.mapLoaded = 'true';

  const frame = document.createElement('iframe');
  frame.className = 'contacts__map-frame';
  frame.title = map.dataset.mapTitle || 'Карта проезда';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  frame.allowFullscreen = true;

  frame.addEventListener(
    'load',
    () => {
      if (!frame.isConnected) return;

      map.classList.add('is-loaded');
      map.setAttribute('aria-busy', 'false');

      const status = map.querySelector('[data-map-status]');
      if (status) status.textContent = 'Карта загружена';
    },
    { once: true },
  );

  frame.src = source;
  map.append(frame);
};

export function updateYandexMap(map, { source, title }) {
  if (!map) return;

  map.dataset.mapTitle = title;
  const frame = map.querySelector(':scope > .contacts__map-frame');

  if (map.dataset.mapSrc === source) {
    if (frame) frame.title = title;
    return;
  }

  map.dataset.mapSrc = source;
  map.dataset.mapLoaded = 'false';
  map.classList.remove('is-loaded');
  map.setAttribute('aria-busy', 'true');
  const status = map.querySelector('[data-map-status]');
  if (status) status.textContent = 'Карта загружается';

  // Keep off-screen maps lazy; replace an already mounted map immediately.
  if (frame) {
    frame.remove();
    createMapFrame(map);
  }
}

export function initYandexMaps() {
  const maps = document.querySelectorAll('[data-yandex-map]');
  if (!maps.length) return;

  if (!('IntersectionObserver' in window)) {
    if (document.readyState === 'complete') {
      maps.forEach(createMapFrame);
    } else {
      window.addEventListener('load', () => maps.forEach(createMapFrame), { once: true });
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(entry.target);
        createMapFrame(entry.target);
      });
    },
    { rootMargin: '300px 0px' },
  );

  maps.forEach((map) => observer.observe(map));
}
