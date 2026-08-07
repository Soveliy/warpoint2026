import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 48rem) and (prefers-reduced-motion: no-preference)';
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const setActiveReview = (controls, index) => {
  controls.forEach((control, controlIndex) => {
    const isActive = controlIndex === index;
    control.classList.toggle('is-active', isActive);
    control.setAttribute('aria-pressed', String(isActive));
  });
};

const getIndicatorOffset = (controls, index) => {
  const firstControl = controls[0];
  const targetControl = controls[index];

  if (!firstControl || !targetControl) return 0;

  return targetControl.offsetLeft - firstControl.offsetLeft;
};

const moveIndicator = (indicator, controls, index, animate = true) => {
  if (!indicator) return;

  const x = getIndicatorOffset(controls, index);

  if (!animate || motionQuery.matches) {
    gsap.set(indicator, { x });
    return;
  }

  gsap.to(indicator, {
    duration: 0.38,
    ease: 'power2.inOut',
    overwrite: true,
    x,
  });
};

function setupDesktopSequence(section, track, cards, controls, indicator) {
  const score = track.querySelector('.reviews__score');
  const panels = score ? [score, ...cards] : [];

  if (panels.length !== cards.length + 1) return null;

  let activeState = 0;
  const lastState = cards.length;
  const getStateOffsets = () => {
    const firstOffset = panels[0].offsetLeft;

    return panels.map((panel) => panel.offsetLeft - firstOffset);
  };
  const getDistance = () => getStateOffsets()[lastState] ?? 0;
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
  };

  gsap.set([track, ...panels], { x: 0 });
  moveIndicator(indicator, controls, 0, false);

  const timeline = gsap.timeline({
    scrollTrigger: {
      anticipatePin: 1,
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onEnter: (self) => {
        syncState(self);
      },
      onEnterBack: (self) => {
        syncState(self);
      },
      onRefresh: syncState,
      onUpdate: syncState,
      pin: true,
      refreshPriority: 10,
      scrub: true,
      start: 'top 1px',
      trigger: section,
    },
  });

  panels.slice(1).forEach((_, index) => {
    const nextState = index + 1;
    const position = index;
    const stackedPanels = panels.slice(1, nextState);

    timeline.to(
      track,
      {
        duration: 1,
        ease: 'none',
        force3D: true,
        x: () => -getStateOffsets()[nextState],
      },
      position,
    );
    if (stackedPanels.length) {
      timeline.to(
        stackedPanels,
        {
          duration: 1,
          ease: 'none',
          force3D: true,
          x: (panelIndex) => {
            const offsets = getStateOffsets();

            return offsets[nextState] - offsets[panelIndex + 1];
          },
        },
        position,
      );
    }

    if (indicator) {
      timeline.to(
        indicator,
        {
          duration: 1,
          ease: 'none',
          force3D: true,
          x: () => getIndicatorOffset(controls, getReviewIndex(nextState)),
        },
        position,
      );
    }
  });

  const trigger = timeline.scrollTrigger;

  const moveToState = (nextState) => {
    if (!trigger) return;

    const distance = getDistance();

    if (!distance) return;

    const targetState = Math.max(0, Math.min(lastState, nextState));
    const stateOffset = getStateOffsets()[targetState];
    const progress = stateOffset / distance;
    const targetScroll = trigger.start + (trigger.end - trigger.start) * progress;

    window.scrollTo({
      behavior: motionQuery.matches ? 'auto' : 'smooth',
      top: targetScroll,
    });
  };

  return {
    destroy() {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.killTweensOf(indicator);
      gsap.set([track, ...panels, indicator].filter(Boolean), {
        clearProps: 'transform',
      });
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
    const indicator = section.querySelector('[data-review-indicator]');

    if (!viewport || !track || !cards.length || !controls.length || !indicator) return;

    let desktopSequence = null;
    let mobileFrame = null;
    let mobileActiveIndex = 0;

    const updateMobileState = () => {
      if (desktopSequence) return;

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const distances = cards.map((card) =>
        Math.abs(card.offsetLeft + card.offsetWidth / 2 - viewportCenter),
      );
      const nearestIndex = distances.indexOf(Math.min(...distances));

      if (nearestIndex === mobileActiveIndex) return;

      mobileActiveIndex = nearestIndex;
      setActiveReview(controls, nearestIndex);
      moveIndicator(indicator, controls, nearestIndex);
    };

    controls.forEach((control, index) => {
      control.addEventListener('click', () => {
        if (desktopSequence) {
          desktopSequence.showReview(index);
          return;
        }

        const card = cards[index];
        mobileActiveIndex = index;
        setActiveReview(controls, index);
        moveIndicator(indicator, controls, index);
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
    moveIndicator(indicator, controls, 0, false);

    const media = gsap.matchMedia();

    media.add(desktopQuery, () => {
      const sequence = setupDesktopSequence(section, track, cards, controls, indicator);

      if (!sequence) return undefined;

      desktopSequence = sequence;
      ScrollTrigger.refresh();

      return () => {
        sequence.destroy();

        if (desktopSequence === sequence) {
          desktopSequence = null;
        }

        setActiveReview(controls, 0);
        mobileActiveIndex = 0;
        moveIndicator(indicator, controls, 0, false);
      };
    });
  });
}
