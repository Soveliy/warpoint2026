import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 64.0625rem)';
const motionQuery = '(prefers-reduced-motion: no-preference)';

function setActiveState(states, controls, activeIndex) {
  states.forEach((state, index) => {
    const isActive = index === activeIndex;

    state.classList.toggle('is-active', isActive);
    state.inert = !isActive;
    state.setAttribute('aria-hidden', String(!isActive));
  });

  controls.forEach((control, index) => {
    const isActive = index === activeIndex;

    control.classList.toggle('is-active', isActive);
    control.setAttribute('aria-selected', String(isActive));
    control.tabIndex = isActive ? 0 : -1;
  });
}

function resetStates(states, controls) {
  states.forEach((state, index) => {
    state.classList.toggle('is-active', index === 0);
    state.inert = false;
    state.removeAttribute('aria-hidden');
  });

  controls.forEach((control, index) => {
    const isActive = index === 0;

    control.classList.toggle('is-active', isActive);
    control.setAttribute('aria-selected', String(isActive));
    control.tabIndex = isActive ? 0 : -1;
  });
}

function bindControls(controls, onActivate) {
  const cleanups = controls.map((control, index) => {
    const handleClick = () => onActivate(index);
    const handleKeydown = (event) => {
      let nextIndex = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % controls.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + controls.length) % controls.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = controls.length - 1;
      }

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();
      controls[nextIndex].focus();
      onActivate(nextIndex);
    };

    control.addEventListener('click', handleClick);
    control.addEventListener('keydown', handleKeydown);

    return () => {
      control.removeEventListener('click', handleClick);
      control.removeEventListener('keydown', handleKeydown);
    };
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function getElements(root) {
  const states = [...root.querySelectorAll('[data-event-state]')];
  const controls = [...root.querySelectorAll('[data-event-control]')];
  const visuals = states.map((state) => state.querySelector('[data-event-visual]'));
  const details = states.map((state) => state.querySelector('[data-event-details]'));
  const isValid =
    states.length > 1 &&
    states.length === controls.length &&
    visuals.every(Boolean) &&
    details.every(Boolean);

  return isValid ? { states, controls, visuals, details } : null;
}

function setupSequence(root) {
  const elements = getElements(root);

  if (!elements) {
    return null;
  }

  const { states, controls, visuals, details } = elements;
  let activeIndex = 0;
  const lastIndex = states.length - 1;
  const getStep = () => Math.max(root.clientHeight, window.innerHeight);
  const getDistance = () => lastIndex * getStep();

  const syncState = (trigger) => {
    const nextIndex = Math.round(trigger.progress * lastIndex);

    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      setActiveState(states, controls, activeIndex);
    }
  };

  root.classList.add('events--animated');
  root.style.setProperty('--events-accent', states[0].dataset.eventColor);
  setActiveState(states, controls, activeIndex);
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

  const scrollTrigger = timeline.scrollTrigger;
  const unbindControls = bindControls(controls, (index) => {
    if (
      !scrollTrigger ||
      !Number.isFinite(scrollTrigger.start) ||
      !Number.isFinite(scrollTrigger.end)
    ) {
      return;
    }

    const progress = index / lastIndex;
    const top = scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * progress;

    window.scrollTo({ behavior: 'smooth', top });
  });

  return () => {
    unbindControls();
    timeline.scrollTrigger?.kill();
    timeline.kill();
    root.classList.remove('events--animated');
    root.style.removeProperty('--events-accent');
    gsap.set([...states, ...visuals, ...details], {
      clearProps: 'opacity,transform,visibility',
    });
    resetStates(states, controls);
  };
}

function setupStaticControls(root) {
  const elements = getElements(root);

  if (!elements) {
    return null;
  }

  const { states, controls } = elements;
  const activate = (index) => {
    root.style.setProperty('--events-accent', states[index].dataset.eventColor);
    setActiveState(states, controls, index);
  };

  root.classList.add('events--static');
  activate(0);
  const unbindControls = bindControls(controls, activate);

  return () => {
    unbindControls();
    root.classList.remove('events--static');
    root.style.removeProperty('--events-accent');
    resetStates(states, controls);
  };
}

export function initEventsSequence() {
  const roots = [...document.querySelectorAll('[data-events-sequence]')];

  if (!roots.length) {
    return;
  }

  const media = gsap.matchMedia();

  media.add({ desktop: desktopQuery, motion: motionQuery }, ({ conditions }) => {
    if (!conditions?.desktop) {
      return undefined;
    }

    const setup = conditions.motion ? setupSequence : setupStaticControls;
    const cleanupCallbacks = roots.map(setup).filter(Boolean);

    if (conditions.motion) {
      ScrollTrigger.refresh();
    }

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  });
}
