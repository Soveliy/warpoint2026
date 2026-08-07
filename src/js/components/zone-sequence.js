import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 48rem) and (prefers-reduced-motion: no-preference)';

function setActiveSlide(slides, activeIndex) {
  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === activeIndex);
  });
}

function setupSequence(root) {
  const track = root.querySelector('[data-zone-sequence-track]');
  const slides = track ? [...track.children].filter((item) => item.matches('.zone')) : [];
  const rows = slides.map((slide) => slide.querySelector('.zone__row'));
  const leftItems = rows.map((row) => row?.children[0]).filter(Boolean);
  const rightItems = rows.map((row) => row?.children[1]).filter(Boolean);

  if (
    !track ||
    slides.length < 2 ||
    leftItems.length !== slides.length ||
    rightItems.length !== slides.length
  ) {
    return null;
  }

  let activeIndex = 0;
  const lastIndex = slides.length - 1;
  const getDistance = () => (slides.length - 1) * root.clientHeight;
  const getStep = () => root.clientHeight;

  const syncState = (trigger) => {
    const nextIndex = Math.round(trigger.progress * lastIndex);

    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      setActiveSlide(slides, activeIndex);
    }
  };

  root.classList.add('zones-wrap--animated');
  setActiveSlide(slides, activeIndex);

  const timeline = gsap.timeline({
    scrollTrigger: {
      anticipatePin: 1,
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onRefresh: syncState,
      onUpdate: syncState,
      pin: true,
      refreshPriority: 30,
      scrub: true,
      start: 'top top',
      trigger: root,
    },
  });

  timeline.fromTo(
    leftItems,
    {
      y: (index) => -index * getStep(),
    },
    {
      y: (index) => (lastIndex - index) * getStep(),
      duration: 1,
      ease: 'none',
      force3D: true,
    },
    0,
  );

  timeline.fromTo(
    rightItems,
    {
      y: (index) => index * getStep(),
    },
    {
      y: (index) => (index - lastIndex) * getStep(),
      duration: 1,
      ease: 'none',
      force3D: true,
    },
    0,
  );

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set([...leftItems, ...rightItems], { clearProps: 'transform' });
    slides.forEach((slide) => slide.classList.remove('is-active'));
    root.classList.remove('zones-wrap--animated');
  };
}

export function initZoneSequence() {
  const roots = [...document.querySelectorAll('[data-zone-sequence]')];

  if (!roots.length) {
    return;
  }

  const media = gsap.matchMedia();

  media.add(desktopQuery, () => {
    const cleanupCallbacks = roots.map(setupSequence).filter(Boolean);

    ScrollTrigger.refresh();

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  });
}
