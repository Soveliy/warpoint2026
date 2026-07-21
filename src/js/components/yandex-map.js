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

export function initYandexMaps() {
  const maps = document.querySelectorAll('[data-yandex-map]');
  if (!maps.length) return;

  if (!('IntersectionObserver' in window)) {
    window.addEventListener('load', () => maps.forEach(createMapFrame), { once: true });
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
