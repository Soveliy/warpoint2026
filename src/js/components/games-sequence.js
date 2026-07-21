import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { getSmoothScroll } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 64.0625rem)';
const motionQuery = '(prefers-reduced-motion: no-preference)';
const scrollDuration = 0.92;
const scrollEase = gsap.parseEase('power2.inOut');

function getDocumentTop(element) {
  return window.scrollY + element.getBoundingClientRect().top;
}

function readCardState(card) {
  const styles = getComputedStyle(card);

  return {
    bottom: styles.getPropertyValue('--card-bottom').trim(),
    left: styles.getPropertyValue('--card-left').trim(),
    rotation: Number.parseFloat(styles.getPropertyValue('--card-rotation')) || 0,
    scale: Number.parseFloat(styles.getPropertyValue('--card-scale')) || 1,
  };
}

function setupIntroAnimation(intro) {
  const titleLines = [...intro.querySelectorAll('.games-intro__title > span')];
  const cards = [...intro.querySelectorAll('.games-intro__card')];

  if (!titleLines.length || cards.length < 2) return null;

  const states = cards.map(readCardState);
  const firstCard = cards[0];
  const firstState = states[0];
  const satelliteCards = cards.slice(1);
  const reversedSatelliteCards = [...satelliteCards].reverse();

  const setCollapsedSatellites = () => {
    gsap.set(satelliteCards, {
      autoAlpha: 0,
      bottom: firstState.bottom,
      left: firstState.left,
      rotation: firstState.rotation,
      scale: 0.18,
      transformOrigin: '50% 100%',
      willChange: 'left, bottom, transform, opacity',
      y: 72,
    });
  };

  const deckLoop = gsap
    .timeline({ paused: true, repeat: -1, repeatDelay: 0.42 })
    .set(satelliteCards, {
      autoAlpha: 0,
      bottom: firstState.bottom,
      left: firstState.left,
      rotation: firstState.rotation,
      scale: 0.18,
      y: 72,
    })
    .to(satelliteCards, {
      autoAlpha: 1,
      bottom: (index) => states[index + 1].bottom,
      duration: 0.58,
      ease: 'back.out(1.35)',
      left: (index) => states[index + 1].left,
      rotation: (index) => states[index + 1].rotation,
      scale: (index) => states[index + 1].scale,
      stagger: 0.17,
      y: 0,
    })
    .to({}, { duration: 1.3 })
    .to(reversedSatelliteCards, {
      autoAlpha: 0,
      bottom: firstState.bottom,
      duration: 0.46,
      ease: 'power2.in',
      left: firstState.left,
      rotation: firstState.rotation,
      scale: 0.18,
      stagger: 0.14,
      y: 72,
    })
    .to({}, { duration: 0.48 });

  const introTimeline = gsap.timeline({
    paused: true,
    onComplete: () => deckLoop.restart(),
  });

  introTimeline
    .to(titleLines, {
      autoAlpha: 1,
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.66,
      ease: 'power3.out',
      stagger: 0.07,
      y: 0,
    })
    .to(
      firstCard,
      {
        autoAlpha: 1,
        bottom: firstState.bottom,
        duration: 0.7,
        ease: 'back.out(1.25)',
        left: firstState.left,
        rotation: firstState.rotation,
        scale: firstState.scale,
        y: 0,
      },
      0.18,
    );

  const reset = () => {
    deckLoop.pause(0);
    introTimeline.pause(0);
    gsap.set(titleLines, {
      autoAlpha: 0,
      clipPath: 'inset(0 0 100% 0)',
      willChange: 'transform, opacity, clip-path',
      y: 46,
    });
    gsap.set(firstCard, {
      autoAlpha: 0,
      bottom: firstState.bottom,
      left: firstState.left,
      rotation: firstState.rotation,
      scale: firstState.scale * 0.45,
      transformOrigin: '50% 100%',
      willChange: 'left, bottom, transform, opacity',
      y: 90,
    });
    setCollapsedSatellites();
  };

  const play = () => {
    reset();
    introTimeline.play(0);
  };

  const collapseForExit = () => {
    deckLoop.pause();
    introTimeline.pause();
    gsap.to(satelliteCards, {
      autoAlpha: 0,
      bottom: firstState.bottom,
      duration: 0.38,
      ease: 'power2.in',
      left: firstState.left,
      rotation: firstState.rotation,
      scale: 0.16,
      stagger: { each: 0.05, from: 'end' },
      y: 50,
    });
    gsap.to(firstCard, {
      duration: 0.62,
      ease: 'power2.inOut',
      scale: firstState.scale * 0.28,
      y: -36,
    });
  };

  reset();

  const trigger = ScrollTrigger.create({
    end: 'bottom 18%',
    onEnter: play,
    onEnterBack: play,
    onLeave: () => deckLoop.pause(),
    onLeaveBack: reset,
    start: 'top 74%',
    trigger: intro,
  });

  if (trigger.isActive) play();

  return {
    collapseForExit,
    cleanup: () => {
      trigger.kill();
      deckLoop.kill();
      introTimeline.kill();
      gsap.killTweensOf([...titleLines, ...cards]);
      gsap.set([...titleLines, ...cards], {
        clearProps:
          'bottom,clipPath,left,opacity,rotation,scale,transform,transformOrigin,visibility,willChange',
      });
    },
  };
}

function setupCatalogReveal(catalog) {
  const cards = [...catalog.querySelectorAll('.game-card')];
  const controls = catalog.querySelector('.games-catalog__controls');

  if (!cards.length) return null;

  const reset = () => {
    gsap.set(cards, {
      autoAlpha: 0,
      // scale: 0.9,
      transformOrigin: '50% 100%',
      willChange: 'transform, opacity',
      y: 180,
    });
    gsap.set(controls, {
      autoAlpha: 0,
      willChange: 'transform, opacity',
      y: 28,
    });
  };

  const timeline = gsap
    .timeline({
      paused: true,
      onComplete: () => {
        gsap.set(cards, {
          clearProps: 'opacity,transform,transformOrigin,visibility,willChange',
        });
        gsap.set(controls, {
          clearProps: 'opacity,transform,visibility,willChange',
        });
      },
    })
    .to(cards, {
      autoAlpha: 1,
      duration: 0.82,
      ease: 'power3.out',
      scale: 1,
      stagger: 0.07,
      y: 0,
    })
    .to(
      controls,
      {
        autoAlpha: 1,
        duration: 0.48,
        ease: 'power2.out',
        y: 0,
      },
      0.4,
    );

  const play = () => {
    timeline.pause(0);
    reset();
    timeline.play(0);
  };

  reset();

  const trigger = ScrollTrigger.create({
    end: 'bottom 20%',
    onEnter: play,
    onEnterBack: play,
    onLeaveBack: reset,
    start: 'top 88%',
    trigger: catalog,
  });

  if (trigger.isActive) play();

  return () => {
    trigger.kill();
    timeline.kill();
    gsap.set([...cards, controls], {
      clearProps: 'opacity,transform,transformOrigin,visibility,willChange',
    });
  };
}

function setupScrollTransition(intro, catalog, onExit) {
  let observer = null;
  let fallbackTween = null;
  let isAnimating = false;
  let inputReady = true;

  const setCapture = (enabled) => {
    if (!observer) return;

    if (enabled) {
      inputReady = true;
      intro.setAttribute('data-lenis-prevent-touch', '');
      intro.setAttribute('data-lenis-prevent-wheel', '');
      observer.enable();
      return;
    }

    observer.disable();
    intro.removeAttribute('data-lenis-prevent-touch');
    intro.removeAttribute('data-lenis-prevent-wheel');
  };

  const scrollTo = (target, onComplete) => {
    const smoothScroll = getSmoothScroll();

    if (smoothScroll) {
      smoothScroll.scrollTo(target, {
        duration: scrollDuration,
        easing: scrollEase,
        force: true,
        lock: true,
        onComplete,
      });
      return;
    }

    const scrollState = { value: window.scrollY };

    fallbackTween?.kill();
    fallbackTween = gsap.to(scrollState, {
      value: target,
      duration: scrollDuration,
      ease: 'power2.inOut',
      onComplete,
      onUpdate: () => window.scrollTo(0, scrollState.value),
    });
  };

  const move = (direction) => {
    if (isAnimating) return;

    isAnimating = true;
    setCapture(false);

    if (direction > 0) {
      onExit();
      scrollTo(getDocumentTop(catalog), () => {
        isAnimating = false;
      });
      return;
    }

    scrollTo(Math.max(0, getDocumentTop(intro) - window.innerHeight), () => {
      isAnimating = false;
    });
  };

  const trigger = ScrollTrigger.create({
    end: 'bottom top',
    onEnter: () => setCapture(true),
    onEnterBack: () => setCapture(true),
    onLeave: () => setCapture(false),
    onLeaveBack: () => setCapture(false),
    start: 'top 1px',
    trigger: intro,
  });

  observer = ScrollTrigger.observe({
    allowClicks: true,
    dragMinimum: 8,
    lockAxis: true,
    onChangeY: (self) => {
      const inputDirection = Math.sign(self.deltaY);

      if (!inputDirection || !inputReady) return;

      inputReady = false;
      move(self.event.type === 'wheel' ? inputDirection : -inputDirection);
    },
    onStop: () => {
      inputReady = true;
    },
    onStopDelay: 0.18,
    preventDefault: true,
    target: intro,
    tolerance: 10,
    type: 'wheel,touch',
  });

  observer.disable();

  if (trigger.isActive) setCapture(true);

  return () => {
    setCapture(false);
    observer.kill();
    fallbackTween?.kill();
    trigger.kill();
  };
}

export function initGamesSequence() {
  const intro = document.querySelector('.games-intro');
  const catalog = document.querySelector('.games-catalog');

  if (!intro || !catalog) return;

  const media = gsap.matchMedia();

  media.add(
    {
      desktop: desktopQuery,
      motion: motionQuery,
    },
    ({ conditions }) => {
      if (!conditions.motion) return undefined;

      const introAnimation = setupIntroAnimation(intro);
      const catalogCleanup = setupCatalogReveal(catalog);
      const transitionCleanup =
        conditions.desktop && introAnimation
          ? setupScrollTransition(intro, catalog, introAnimation.collapseForExit)
          : null;

      ScrollTrigger.refresh();

      return () => {
        transitionCleanup?.();
        catalogCleanup?.();
        introAnimation?.cleanup();
      };
    },
  );
}
