import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { getSmoothScroll } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 64.0625rem) and (prefers-reduced-motion: no-preference)';
const motionQuery = '(prefers-reduced-motion: no-preference)';
const stepDuration = 0.72;
const stepEase = gsap.parseEase('power2.inOut');

function getDocumentTop(element) {
  return window.scrollY + element.getBoundingClientRect().top;
}

function getDirectSpans(element) {
  if (!element) return [];

  const spans = [...element.children].filter((child) => child.matches('span'));

  return spans.length ? spans : [element];
}

function setupSectionReveals(sections) {
  const cleanups = sections.map((section, sectionIndex) => {
    const visuals = [...section.querySelectorAll('.about-game__visual, .about-game__character')];
    const titleParts = getDirectSpans(section.querySelector('.about-game__title'));
    const descriptionParts = getDirectSpans(section.querySelector('.about-game__desc'));
    const animatedElements = [...visuals, ...titleParts, ...descriptionParts];
    const isImmersion = section.classList.contains('about-game--immersion');
    const sideDirection = sectionIndex === 0 ? 1 : -1;

    if (!animatedElements.length) return null;

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        gsap.set(visuals, {
          clearProps: 'opacity,transform,transformOrigin,visibility,willChange',
        });
        gsap.set([...titleParts, ...descriptionParts], {
          clearProps: 'clipPath,opacity,transform,visibility,willChange',
        });
      },
    });

    visuals.forEach((visual, visualIndex) => {
      timeline.to(
        visual,
        {
          autoAlpha: 1,
          duration: 0.92,
          ease: 'power3.out',
          scale: 1,
          x: 0,
          y: 0,
        },
        visualIndex * 0.08,
      );
    });

    timeline
      .to(
        titleParts,
        {
          autoAlpha: 1,
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.68,
          ease: 'power3.out',
          stagger: 0.07,
          y: 0,
        },
        0.14,
      )
      .to(
        descriptionParts,
        {
          autoAlpha: 1,
          duration: 0.58,
          ease: 'power3.out',
          stagger: 0.045,
          y: 0,
        },
        0.4,
      );

    const reset = () => {
      timeline.pause(0);

      visuals.forEach((visual) => {
        const characterDirection = visual.classList.contains('about-game__character--left')
          ? -1
          : visual.classList.contains('about-game__character--right')
            ? 1
            : sideDirection;

        gsap.set(visual, {
          autoAlpha: 0,
          scale: 0.9,
          transformOrigin: '50% 100%',
          willChange: 'transform, opacity',
          x: isImmersion ? characterDirection * 56 : characterDirection * 82,
          y: () => Math.min(window.innerHeight * 0.24, 190),
        });
      });

      gsap.set(titleParts, {
        autoAlpha: 0,
        clipPath: 'inset(0 0 100% 0)',
        willChange: 'transform, opacity, clip-path',
        y: 48,
      });
      gsap.set(descriptionParts, {
        autoAlpha: 0,
        willChange: 'transform, opacity',
        y: 28,
      });
    };

    const play = () => {
      reset();
      timeline.play(0);
    };

    reset();

    const trigger = ScrollTrigger.create({
      end: 'bottom 24%',
      onEnter: play,
      onEnterBack: play,
      onLeave: reset,
      onLeaveBack: reset,
      start: 'top 76%',
      trigger: section,
    });

    if (trigger.isActive) {
      play();
    }

    return () => {
      trigger.kill();
      timeline.kill();
      gsap.set(animatedElements, {
        clearProps: 'clipPath,opacity,transform,transformOrigin,visibility,willChange',
      });
    };
  });

  return () => cleanups.forEach((cleanup) => cleanup?.());
}

function setupSequence(sections) {
  const eventRoot = sections[0].parentElement;
  const previousSection = sections[0].previousElementSibling;
  const nextSection = sections[sections.length - 1].nextElementSibling;

  if (!eventRoot || !previousSection || !nextSection) return null;

  let targetIndex = 0;
  let isAnimating = false;
  let inputReady = true;
  let observer = null;
  let fallbackTween = null;
  const lastIndex = sections.length - 1;

  const syncState = () => {
    const viewportTop = window.scrollY;
    const distances = sections.map((section) => Math.abs(getDocumentTop(section) - viewportTop));
    const nearestIndex = distances.indexOf(Math.min(...distances));

    if (!isAnimating) {
      targetIndex = nearestIndex;
    }
  };

  const setCapture = (enabled) => {
    if (!observer) return;

    if (enabled) {
      inputReady = true;
      eventRoot.setAttribute('data-lenis-prevent-touch', '');
      eventRoot.setAttribute('data-lenis-prevent-wheel', '');
      observer.enable();
      return;
    }

    observer.disable();
    eventRoot.removeAttribute('data-lenis-prevent-touch');
    eventRoot.removeAttribute('data-lenis-prevent-wheel');
  };

  const scrollTo = (target, onComplete) => {
    const smoothScroll = getSmoothScroll();

    if (smoothScroll) {
      smoothScroll.scrollTo(target, {
        duration: stepDuration,
        easing: stepEase,
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
      duration: stepDuration,
      ease: 'power2.inOut',
      onComplete,
      onUpdate: () => window.scrollTo(0, scrollState.value),
    });
  };

  const finishStep = () => {
    isAnimating = false;
  };

  const moveToIndex = (index, force = false) => {
    if (isAnimating || (!force && index === targetIndex)) return;

    isAnimating = true;
    targetIndex = Math.max(0, Math.min(lastIndex, index));
    scrollTo(getDocumentTop(sections[targetIndex]), finishStep);
  };

  const leaveSequence = (direction) => {
    const destination = direction > 0 ? nextSection : previousSection;

    isAnimating = true;
    setCapture(false);
    scrollTo(getDocumentTop(destination), () => {
      isAnimating = false;
    });
  };

  const moveByDirection = (direction) => {
    if (isAnimating) return;

    syncState();

    const currentOffset = getDocumentTop(sections[targetIndex]) - window.scrollY;
    const isAligned = Math.abs(currentOffset) <= 2;

    if (!isAligned) {
      const isEnteringSequence =
        (direction > 0 && currentOffset > 0) || (direction < 0 && currentOffset < 0);

      if (isEnteringSequence) {
        moveToIndex(targetIndex, true);
      } else {
        leaveSequence(direction);
      }

      return;
    }

    const nextIndex = targetIndex + direction;

    if (nextIndex < 0 || nextIndex > lastIndex) {
      leaveSequence(direction);
      return;
    }

    moveToIndex(nextIndex);
  };

  const trigger = ScrollTrigger.create({
    end: 'bottom top',
    endTrigger: sections[lastIndex],
    onEnter: () => {
      syncState();
      setCapture(true);
    },
    onEnterBack: () => {
      syncState();
      setCapture(true);
    },
    onLeave: () => setCapture(false),
    onLeaveBack: () => setCapture(false),
    onRefresh: syncState,
    onUpdate: () => {
      if (!isAnimating) syncState();
    },
    refreshPriority: 15,
    start: 'top bottom',
    trigger: sections[0],
  });

  observer = ScrollTrigger.observe({
    allowClicks: true,
    dragMinimum: 8,
    lockAxis: true,
    onChangeY: (self) => {
      const inputDirection = Math.sign(self.deltaY);

      if (!inputDirection || !inputReady) return;

      inputReady = false;
      const direction = self.event.type === 'wheel' ? inputDirection : -inputDirection;
      moveByDirection(direction);
    },
    onStop: () => {
      inputReady = true;
    },
    onStopDelay: 0.18,
    preventDefault: true,
    target: eventRoot,
    tolerance: 10,
    type: 'wheel,touch',
  });

  observer.disable();

  if (trigger.isActive) {
    syncState();
    setCapture(true);
  }

  return () => {
    setCapture(false);
    observer?.kill();
    fallbackTween?.kill();
    trigger.kill();
  };
}

export function initAboutGameSequence() {
  const sections = [...document.querySelectorAll('.main > .about-game')];

  if (sections.length < 2) return;

  const media = gsap.matchMedia();

  media.add(motionQuery, () => {
    const cleanup = setupSectionReveals(sections);

    ScrollTrigger.refresh();

    return cleanup;
  });

  media.add(desktopQuery, () => {
    const cleanup = setupSequence(sections);

    ScrollTrigger.refresh();

    return cleanup ?? undefined;
  });
}
