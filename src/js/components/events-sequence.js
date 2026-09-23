const desktopMedia = window.matchMedia('(min-width: 1025px)');

function setCompactState(states, controls, activeIndex) {
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

function setDesktopState(states, controls) {
  states.forEach((state) => {
    state.inert = false;
    state.removeAttribute('aria-hidden');
  });

  controls.forEach((control) => {
    control.tabIndex = -1;
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
  const tabs = root.querySelector('[data-events-tabs]');

  if (!tabs || states.length < 2 || states.length !== controls.length) {
    return;
  }

  let activeIndex = Math.max(
    0,
    controls.findIndex((control) => control.classList.contains('is-active')),
  );

  const syncLayout = () => {
    const isDesktop = desktopMedia.matches;

    tabs.hidden = isDesktop;
    tabs.setAttribute('aria-hidden', String(isDesktop));

    if (isDesktop) {
      setDesktopState(states, controls);
      return;
    }

    setCompactState(states, controls, activeIndex);
  };

  const activate = (index) => {
    if (desktopMedia.matches || index === activeIndex) {
      return;
    }

    activeIndex = index;
    setCompactState(states, controls, activeIndex);
  };

  controls.forEach((control, index) => {
    control.addEventListener('click', () => activate(index));
    control.addEventListener('keydown', (event) => {
      if (desktopMedia.matches) {
        return;
      }

      const nextIndex = getNextIndex(event, index, controls.length);

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();
      controls[nextIndex].focus();
      activeIndex = nextIndex;
      setCompactState(states, controls, activeIndex);
    });
  });

  desktopMedia.addEventListener('change', syncLayout);
  syncLayout();
}

export function initEventsSequence() {
  const roots = document.querySelectorAll('[data-events-sequence]');

  roots.forEach(setupTabs);
}
