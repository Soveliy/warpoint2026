import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 767px)');

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const waitForImage = (image) => {
  if (!image) return Promise.resolve();

  if (image.complete && image.naturalWidth) {
    return image.decode?.().catch(() => undefined) ?? Promise.resolve();
  }

  return new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
};

const refreshPage = () => {
  window.requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
};

export function initPreloader() {
  const root = document.documentElement;
  const preloader = document.querySelector('[data-preloader]');
  const preloaderLogo = preloader?.querySelector('[data-preloader-logo]');
  const logoFill = preloader?.querySelector('[data-preloader-fill]');
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero, .hero-event');
  const isEventHero = hero?.classList.contains('hero-event');
  const heroImages = isEventHero
    ? [...hero.querySelectorAll('.hero-event__character')]
    : [hero?.querySelector('.hero__image')].filter(Boolean);
  const heroCopy = isEventHero
    ? [
        hero?.querySelector('.hero-event__title'),
        hero?.querySelector('.hero-event__desc'),
        hero?.querySelector('.hero-event__params'),
      ].filter(Boolean)
    : [hero?.querySelector('.hero__pretitle'), hero?.querySelector('.hero__title')].filter(Boolean);
  const heroActions = hero?.querySelector(isEventHero ? '.hero-event__buttons' : '.hero__buttons');
  const heroAlert = hero?.querySelector(isEventHero ? '.hero-event__allerts' : '.hero__allerts');
  const animatedElements = [
    header,
    ...(isEventHero ? [] : heroImages),
    ...heroCopy,
    heroActions,
    heroAlert,
  ].filter(Boolean);
  let isComplete = false;
  let eventHeroRevealed = false;

  const revealEventHero = () => {
    if (!isEventHero || eventHeroRevealed) return;
    eventHeroRevealed = true;
    hero.dispatchEvent(new Event('event-hero:reveal'));
  };

  const complete = () => {
    if (isComplete) return;

    isComplete = true;
    gsap.set(animatedElements, { clearProps: 'opacity,transform,visibility' });
    root.classList.remove('is-preloading');
    preloader?.remove();
    revealEventHero();
    refreshPage();
  };

  if (!preloader || !preloaderLogo || !logoFill || !hero || !heroImages.length) {
    complete();
    return;
  }

  if (motionQuery.matches) {
    complete();
    return;
  }

  const imageOffset = mobileQuery.matches ? 30 : 55;

  gsap.set(header, { autoAlpha: 0, yPercent: -110 });
  if (!isEventHero) {
    gsap.set(heroImages, { autoAlpha: 0, scale: 1.04, xPercent: imageOffset });
  }
  gsap.set(heroCopy, { autoAlpha: 0, xPercent: -110 });
  gsap.set(heroActions, { autoAlpha: 0, x: -72, y: 20 });
  if (heroAlert) {
    gsap.set(heroAlert, { autoAlpha: 0, x: 96 });
  }

  const play = async () => {
    const assets = [
      ...preloader.querySelectorAll('img'),
      ...heroImages,
      document.fonts?.ready,
    ].filter(Boolean);
    const assetPromises = assets.map((asset) =>
      asset instanceof HTMLImageElement ? waitForImage(asset) : asset,
    );

    await Promise.race([Promise.all(assetPromises), wait(3500)]);

    const logoBounds = preloaderLogo.getBoundingClientRect();
    const coverScale =
      Math.max(
        window.innerWidth / Math.max(logoBounds.width, 1),
        window.innerHeight / Math.max(logoBounds.height, 1),
      ) * 1.45;

    const timeline = gsap
      .timeline({ onComplete: complete })
      .fromTo(
        preloaderLogo,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, duration: 0.22, ease: 'power2.out', scale: 1 },
      )
      .to(logoFill, { clipPath: 'inset(0 0% 0 0)', duration: 0.72, ease: 'power2.inOut' }, 0.08)
      .to({}, { duration: 0.85 })
      .to(preloaderLogo, { duration: 0.45, ease: 'expo.in', scale: coverScale })
      .to(preloader, { autoAlpha: 0, duration: 0.08, ease: 'none' })
      .set(preloader, { display: 'none' })
      .to({}, { duration: 0.62 })
      .addLabel('hero')
      .call(revealEventHero, [], 'hero')
      .to(header, { autoAlpha: 1, duration: 0.5, ease: 'power3.out', yPercent: 0 }, 'hero');

    if (!isEventHero) {
      timeline.to(
        heroImages,
        { autoAlpha: 1, duration: 0.9, ease: 'power3.out', scale: 1, xPercent: 0 },
        'hero',
      );
    }

    timeline
      .to(
        heroCopy,
        { autoAlpha: 1, duration: 0.72, ease: 'power3.out', stagger: 0.08, xPercent: 0 },
        'hero+=0.08',
      )
      .to(
        heroActions,
        { autoAlpha: 1, duration: 0.65, ease: 'power3.out', x: 0, y: 0 },
        'hero+=0.2',
      );

    if (heroAlert) {
      timeline.to(
        heroAlert,
        { autoAlpha: 1, duration: 0.68, ease: 'power3.out', x: 0 },
        'hero+=0.26',
      );
    }
  };

  play().catch(complete);
}
