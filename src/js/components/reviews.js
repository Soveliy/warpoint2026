import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { getSmoothScroll } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 48rem) and (prefers-reduced-motion: no-preference)';
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const stepDuration = 0.72;
const stepEase = gsap.parseEase('power2.inOut');

const setActiveReview = (controls, index) => {
  controls.forEach((control, controlIndex) => {
    const isActive = controlIndex === index;
    control.classList.toggle('is-active', isActive);
    control.setAttribute('aria-pressed', String(isActive));
  });
};

function setupDesktopSequence(section, track, cards, controls) {
  let activeState = 0;
  let targetState = 0;
  let isAnimating = false;
  let inputReady = true;
  let observer = null;
  let fallbackTween = null;
  const lastState = cards.length;
  const getStateOffsets = () => [0, ...cards.map((card) => card.offsetLeft)];
  const getDistance = () => cards[cards.length - 1]?.offsetLeft ?? 0;
  const getReviewIndex = (stateIndex) => Math.max(0, Math.min(cards.length - 1, stateIndex - 1));

  const getStateIndex = (trigger) => {
    const currentOffset = trigger.progress * getDistance();
    const offsets = getStateOffsets();

    return offsets.reduce((nearestIndex, offset, index) => {
      const nearestDistance = Math.abs(offsets[nearestIndex] - currentOffset);
      const currentDistance = Math.abs(offset - currentOffset);

      return currentDistance < nearestDistance ? index : nearestIndex;
    }, 0);
  };

  const syncState = (trigger) => {
    const nextState = getStateIndex(trigger);

    if (nextState !== activeState) {
      activeState = nextState;
      setActiveReview(controls, getReviewIndex(activeState));
    }

    if (!isAnimating) {
      targetState = nextState;
    }
  };

  const setCapture = (enabled) => {
    if (!observer) return;

    if (enabled) {
      inputReady = true;
      section.setAttribute('data-lenis-prevent-touch', '');
      section.setAttribute('data-lenis-prevent-wheel', '');
      observer.enable();
      return;
    }

    observer.disable();
    section.removeAttribute('data-lenis-prevent-touch');
    section.removeAttribute('data-lenis-prevent-wheel');
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

  const tween = gsap.to(track, {
    ease: 'none',
    x: () => -getDistance(),
    scrollTrigger: {
      anticipatePin: 1,
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onEnter: (self) => {
        syncState(self);
        setCapture(true);
      },
      onEnterBack: (self) => {
        syncState(self);
        setCapture(true);
      },
      onLeave: () => setCapture(false),
      onLeaveBack: () => setCapture(false),
      onRefresh: syncState,
      onUpdate: syncState,
      pin: true,
      refreshPriority: 10,
      scrub: true,
      start: 'top top',
      trigger: section,
    },
  });

  const trigger = tween.scrollTrigger;

  const finishStep = () => {
    isAnimating = false;
    activeState = targetState;
    setActiveReview(controls, getReviewIndex(activeState));
  };

  const moveToState = (nextState) => {
    if (isAnimating || !trigger || nextState === targetState) return;

    const distance = getDistance();

    if (!distance) return;

    isAnimating = true;
    targetState = Math.max(0, Math.min(lastState, nextState));

    const stateOffset = getStateOffsets()[targetState];
    const progress = stateOffset / distance;
    const targetScroll = trigger.start + (trigger.end - trigger.start) * progress;

    scrollTo(targetScroll, finishStep);
  };

  const moveByDirection = (direction) => {
    if (isAnimating || !trigger) return;

    const nextState = targetState + direction;

    if (nextState < 0 || nextState > lastState) {
      isAnimating = true;
      setCapture(false);
      scrollTo(direction > 0 ? trigger.end + 2 : trigger.start - 2, () => {
        isAnimating = false;
      });
      return;
    }

    moveToState(nextState);
  };

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
    target: section,
    tolerance: 10,
    type: 'wheel,touch',
  });

  observer.disable();

  if (trigger?.isActive) {
    syncState(trigger);
    setCapture(true);
  }

  return {
    destroy() {
      setCapture(false);
      observer?.kill();
      fallbackTween?.kill();
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: 'transform' });
    },
    showReview(index) {
      moveToState(index + 1);
    },
  };
}

export function initReviews() {
  document.querySelectorAll('[data-reviews]').forEach((section) => {
    const viewport = section.querySelector('[data-reviews-viewport]');
    const track = section.querySelector('[data-reviews-track]');
    const cards = [...section.querySelectorAll('[data-review-card]')];
    const controls = [...section.querySelectorAll('[data-review-control]')];

    if (!viewport || !track || !cards.length) return;

    let desktopSequence = null;
    let mobileFrame = null;

    const updateMobileState = () => {
      if (desktopSequence) return;

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const distances = cards.map((card) =>
        Math.abs(card.offsetLeft + card.offsetWidth / 2 - viewportCenter),
      );
      const nearestIndex = distances.indexOf(Math.min(...distances));

      setActiveReview(controls, nearestIndex);
    };

    controls.forEach((control, index) => {
      control.addEventListener('click', () => {
        if (desktopSequence) {
          desktopSequence.showReview(index);
          return;
        }

        const card = cards[index];
        viewport.scrollTo({
          behavior: motionQuery.matches ? 'auto' : 'smooth',
          left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
        });
      });
    });

    viewport.addEventListener(
      'scroll',
      () => {
        if (mobileFrame) return;

        mobileFrame = requestAnimationFrame(() => {
          updateMobileState();
          mobileFrame = null;
        });
      },
      { passive: true },
    );

    setActiveReview(controls, 0);

    const media = gsap.matchMedia();

    media.add(desktopQuery, () => {
      const sequence = setupDesktopSequence(section, track, cards, controls);

      desktopSequence = sequence;
      ScrollTrigger.refresh();

      return () => {
        sequence.destroy();

        if (desktopSequence === sequence) {
          desktopSequence = null;
        }

        setActiveReview(controls, 0);
      };
    });
  });
}
