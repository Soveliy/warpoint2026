import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 64.0625rem) and (prefers-reduced-motion: no-preference)';

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

function getElements(root) {
  const states = [...root.querySelectorAll('[data-event-state]')];
  const visuals = states.map((state) => state.querySelector('[data-event-visual]'));
  const details = states.map((state) => state.querySelector('[data-event-details]'));
  const isValid = states.length > 1 && visuals.every(Boolean) && details.every(Boolean);

  return isValid ? { states, visuals, details } : null;
}

function setupSequence(root) {
  const elements = getElements(root);

  if (!elements) {
    return null;
  }

  const { states, visuals, details } = elements;
  let activeIndex = 0;
  const lastIndex = states.length - 1;
  const getStep = () => Math.max(root.clientHeight, window.innerHeight);
  const getDistance = () => lastIndex * getStep();

  const syncState = (trigger) => {
    const nextIndex = Math.round(trigger.progress * lastIndex);

    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      setActiveState(states, activeIndex);
    }
  };

  root.classList.add('events--animated');
  root.style.setProperty('--events-accent', states[0].dataset.eventColor);
  setActiveState(states, activeIndex);
  gsap.set(states, { visibility: 'hidden' });
  gsap.set(states[0], { visibility: 'visible' });
  gsap.set([...visuals, ...details], { autoAlpha: 1, x: 0, y: 0 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      anticipatePin: 1,
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onRefresh: syncState,
      onUpdate: syncState,
      pin: true,
      refreshPriority: 20,
      scrub: true,
      start: 'top 1px',
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
    timeline.set(nextState, { visibility: 'visible' }, position);
    timeline.to(
      [visuals[index], details[index]],
      {
        duration: 1,
        ease: 'none',
        force3D: true,
        y: () => -getStep(),
      },
      position,
    );
    timeline.fromTo(
      [visuals[index + 1], details[index + 1]],
      { y: () => getStep() },
      {
        duration: 1,
        ease: 'none',
        force3D: true,
        immediateRender: true,
        y: 0,
      },
      position,
    );
    timeline.set(currentState, { visibility: 'hidden' }, position + 1);
  });

  return () => {
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
