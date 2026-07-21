import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getSmoothScroll } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 64.0625rem) and (prefers-reduced-motion: no-preference)';
const stepDuration = 0.72;
const stepEase = gsap.parseEase('power2.inOut');

function setActiveState(states, activeIndex) {
  states.forEach((state, index) => {
    const isActive = index === activeIndex;

    state.classList.toggle('is-active', isActive);
    state.inert = !isActive;
    state.setAttribute('aria-hidden', String(!isActive));
  });
}

function resetStates(states) {
  states.forEach((state, index) => {
    state.classList.toggle('is-active', index === 0);
    state.inert = false;
    state.removeAttribute('aria-hidden');
  });
}

function setupSequence(root) {
  const states = [...root.querySelectorAll('[data-event-state]')];
  const visuals = states.map((state) => state.querySelector('[data-event-visual]'));
  const details = states.map((state) => state.querySelector('[data-event-details]'));

  if (
    states.length < 2 ||
    visuals.some((visual) => !visual) ||
    details.some((content) => !content)
  ) {
    return null;
  }

  let activeIndex = 0;
  let targetIndex = 0;
  let isAnimating = false;
  let inputReady = true;
  let observer = null;
  let fallbackTween = null;
  const lastIndex = states.length - 1;
  const getDistance = () => lastIndex * window.innerHeight;

  const syncState = (trigger) => {
    const nextIndex = Math.round(trigger.progress * lastIndex);

    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      setActiveState(states, activeIndex);
    }

    if (!isAnimating) {
      targetIndex = nextIndex;
    }
  };

  const setCapture = (enabled) => {
    if (!observer) {
      return;
    }

    if (enabled) {
      inputReady = true;
      root.setAttribute('data-lenis-prevent-touch', '');
      root.setAttribute('data-lenis-prevent-wheel', '');
      observer.enable();
      return;
    }

    observer.disable();
    root.removeAttribute('data-lenis-prevent-touch');
    root.removeAttribute('data-lenis-prevent-wheel');
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

  root.classList.add('events--animated');
  root.style.setProperty('--events-accent', states[0].dataset.eventColor);
  setActiveState(states, activeIndex);
  gsap.set(states, { visibility: 'hidden' });
  gsap.set(states[0], { visibility: 'visible' });
  gsap.set([...visuals.slice(1), ...details.slice(1)], { autoAlpha: 0 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      anticipatePin: 1,
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onEnter: () => setCapture(true),
      onEnterBack: () => setCapture(true),
      onLeave: () => setCapture(false),
      onLeaveBack: () => setCapture(false),
      onRefresh: syncState,
      onUpdate: syncState,
      pin: true,
      refreshPriority: 20,
      scrub: true,
      start: 'top top',
      trigger: root,
    },
  });

  states.slice(1).forEach((nextState, index) => {
    const currentState = states[index];
    const position = index;

    timeline.to(
      root,
      {
        '--events-accent': nextState.dataset.eventColor,
        duration: 1,
        ease: 'none',
      },
      position,
    );
    timeline.to(
      visuals[index],
      {
        autoAlpha: 0,
        duration: 0.32,
        ease: 'power2.in',
        scale: 0.97,
        y: -40,
      },
      position,
    );
    timeline.to(
      details[index],
      {
        autoAlpha: 0,
        duration: 0.28,
        ease: 'power2.in',
        x: -36,
      },
      position + 0.04,
    );
    timeline.set(nextState, { visibility: 'visible' }, position + 0.14);
    timeline.fromTo(
      visuals[index + 1],
      { autoAlpha: 0, scale: 0.96, y: 48 },
      {
        autoAlpha: 1,
        duration: 0.56,
        ease: 'power3.out',
        immediateRender: false,
        scale: 1,
        y: 0,
      },
      position + 0.18,
    );
    timeline.fromTo(
      details[index + 1],
      { autoAlpha: 0, x: 44 },
      {
        autoAlpha: 1,
        duration: 0.48,
        ease: 'power3.out',
        immediateRender: false,
        x: 0,
      },
      position + 0.26,
    );
    timeline.set(currentState, { visibility: 'hidden' }, position + 0.48);
  });

  const trigger = timeline.scrollTrigger;

  const finishStep = () => {
    isAnimating = false;
    activeIndex = targetIndex;
    setActiveState(states, activeIndex);
  };

  const moveToState = (direction) => {
    if (isAnimating || !trigger) {
      return;
    }

    const nextIndex = targetIndex + direction;

    if (nextIndex < 0 || nextIndex > lastIndex) {
      isAnimating = true;
      setCapture(false);
      scrollTo(direction > 0 ? trigger.end + 2 : trigger.start - 2, () => {
        isAnimating = false;
      });
      return;
    }

    isAnimating = true;
    targetIndex = nextIndex;

    const targetScroll = trigger.start + (trigger.end - trigger.start) * (targetIndex / lastIndex);

    scrollTo(targetScroll, finishStep);
  };

  observer = ScrollTrigger.observe({
    allowClicks: true,
    dragMinimum: 8,
    lockAxis: true,
    onChangeY: (self) => {
      const inputDirection = Math.sign(self.deltaY);

      if (!inputDirection || !inputReady) {
        return;
      }

      inputReady = false;
      const direction = self.event.type === 'wheel' ? inputDirection : -inputDirection;
      moveToState(direction);
    },
    onStop: () => {
      inputReady = true;
    },
    onStopDelay: 0.18,
    preventDefault: true,
    target: root,
    tolerance: 10,
    type: 'wheel,touch',
  });

  observer.disable();

  if (trigger?.isActive) {
    setCapture(true);
  }

  return () => {
    setCapture(false);
    observer?.kill();
    fallbackTween?.kill();
    timeline.scrollTrigger?.kill();
    timeline.kill();
    root.classList.remove('events--animated');
    root.style.removeProperty('--events-accent');
    gsap.set([...states, ...visuals, ...details], {
      clearProps: 'opacity,transform,visibility',
    });
    resetStates(states);
  };
}

export function initEventsSequence() {
  const roots = [...document.querySelectorAll('[data-events-sequence]')];

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
