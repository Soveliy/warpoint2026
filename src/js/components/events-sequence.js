function setActiveState(root, states, controls, activeIndex) {
  root.style.setProperty('--events-accent', states[activeIndex].dataset.eventColor);

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

function getNextIndex(event, currentIndex, controlsCount) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    return (currentIndex + 1) % controlsCount;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    return (currentIndex - 1 + controlsCount) % controlsCount;
  }

  if (event.key === 'Home') {
    return 0;
  }

  if (event.key === 'End') {
    return controlsCount - 1;
  }

  return null;
}

function setupTabs(root) {
  const states = [...root.querySelectorAll('[data-event-state]')];
  const controls = [...root.querySelectorAll('[data-event-control]')];

  if (states.length < 2 || states.length !== controls.length) {
    return;
  }

  let activeIndex = Math.max(
    0,
    controls.findIndex((control) => control.classList.contains('is-active')),
  );

  const activate = (index) => {
    if (index === activeIndex && states[index].classList.contains('is-active')) {
      return;
    }

    activeIndex = index;
    setActiveState(root, states, controls, activeIndex);
  };

  controls.forEach((control, index) => {
    control.addEventListener('click', () => activate(index));
    control.addEventListener('keydown', (event) => {
      const nextIndex = getNextIndex(event, index, controls.length);

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();
      controls[nextIndex].focus();
      activate(nextIndex);
    });
  });

  setActiveState(root, states, controls, activeIndex);
}

export function initEventsSequence() {
  const roots = document.querySelectorAll('[data-events-sequence]');

  if (!roots.length) {
    return;
  }

  roots.forEach(setupTabs);
}
