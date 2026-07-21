import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { getSmoothScroll } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 64.0625rem) and (prefers-reduced-motion: no-preference)';
const stepDuration = 0.72;
const stepEase = gsap.parseEase('power2.inOut');

function getDocumentTop(element) {
  return window.scrollY + element.getBoundingClientRect().top;
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

  media.add(desktopQuery, () => {
    const cleanup = setupSequence(sections);

    ScrollTrigger.refresh();

    return cleanup ?? undefined;
  });
}
