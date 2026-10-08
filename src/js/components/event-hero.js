import gsap from 'gsap';

const lineDuration = 2.2;
const imageWaypoints = [
  ['girl', 0.06],
  ['cake', 0.23],
  ['boy', 0.53],
  ['balloon', 0.75],
];

export function initEventHero() {
  const hero = document.querySelector('[data-event-hero]');

  if (!hero) return;

  const images = [...hero.querySelectorAll('.hero-event__character')];
  const linePath = hero.querySelector('.hero-event__line-path');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {
    gsap.set(images, { autoAlpha: 0 });
  }

  const line = new Image();
  line.src = 'img/events-hero/birthday/line.png';
  let lineReady = false;
  let revealRequested = false;
  let hasRevealed = false;

  const reveal = () => {
    lineReady = true;
    if (!revealRequested || hasRevealed) return;
    hasRevealed = true;

    window.requestAnimationFrame(() => {
      hero.classList.add('is-ready');

      if (reducedMotion) return;

      const startedAt = performance.now();
      let nextImage = 0;

      const revealAlongLine = (now) => {
        const offset = linePath
          ? Number.parseFloat(window.getComputedStyle(linePath).strokeDashoffset)
          : Number.NaN;
        const elapsed = (now - startedAt) / (lineDuration * 1000);
        const progress = Number.isFinite(offset) ? 1 - offset : elapsed;

        while (
          nextImage < imageWaypoints.length &&
          (progress >= imageWaypoints[nextImage][1] || elapsed >= 1.2)
        ) {
          const [name] = imageWaypoints[nextImage];
          const image = hero.querySelector(`.hero-event__character--${name}`);

          if (image) {
            gsap.to(image, {
              autoAlpha: 1,
              clearProps: 'opacity,visibility',
              duration: 0.48,
              ease: 'power2.out',
            });
          }

          nextImage += 1;
        }

        if (nextImage < imageWaypoints.length) {
          window.requestAnimationFrame(revealAlongLine);
        }
      };

      window.requestAnimationFrame(revealAlongLine);
    });
  };

  hero.addEventListener(
    'event-hero:reveal',
    () => {
      revealRequested = true;
      if (lineReady) reveal();
    },
    { once: true },
  );

  if (!document.documentElement.classList.contains('is-preloading')) {
    revealRequested = true;
  }

  if (line.complete) {
    reveal();
    return;
  }

  line.addEventListener('load', reveal, { once: true });
  line.addEventListener('error', reveal, { once: true });
}
