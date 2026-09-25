import Swiper from 'swiper';
import { A11y, Keyboard, Navigation } from 'swiper/modules';

const desktopMedia = window.matchMedia('(min-width: 1025px)');
const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
const initializedRoots = new WeakSet();

function setCompactState(states, controls, activeIndex) {
  states.forEach((state, index) => {
    const isActive = index === activeIndex;

    state.classList.toggle('is-active', isActive);
    state.inert = !isActive;
    state.setAttribute('role', 'tabpanel');
    state.setAttribute('aria-labelledby', controls[index].id);
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
    state.removeAttribute('aria-labelledby');
    state.setAttribute('role', 'group');
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
  if (initializedRoots.has(root)) return;

  const states = [...root.querySelectorAll('[data-event-state]')];
  const controls = [...root.querySelectorAll('[data-event-control]')];
  const tabs = root.querySelector('[data-events-tabs]');
  const sliderElement = root.querySelector('[data-events-slider]');
  const wrapper = root.querySelector('[data-events-states]');
  const navigation = root.querySelector('[data-events-navigation]');
  const prevEl = root.querySelector('[data-events-prev]');
  const nextEl = root.querySelector('[data-events-next]');

  if (
    !tabs ||
    !sliderElement ||
    !wrapper ||
    states.length < 2 ||
    states.length !== controls.length
  ) {
    return;
  }

  initializedRoots.add(root);
  let slider = null;
  let activeIndex = Math.max(
    0,
    controls.findIndex((control) => control.classList.contains('is-active')),
  );

  const createSlider = () => {
    if (slider) return;

    // A full extra set lets three visible cards loop without blank slides.
    states.forEach((state) => {
      const clone = state.cloneNode(true);

      clone.removeAttribute('id');
      clone.removeAttribute('data-event-state');
      clone.setAttribute('data-event-loop-copy', '');
      clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      wrapper.append(clone);
    });

    slider = new Swiper(sliderElement, {
      modules: [A11y, Keyboard, Navigation],
      a11y: {
        enabled: true,
        nextSlideMessage: 'Следующее мероприятие',
        prevSlideMessage: 'Предыдущее мероприятие',
        slideLabelMessage: 'Мероприятие {{index}} из {{slidesLength}}',
      },
      initialSlide: activeIndex,
      keyboard: { enabled: true, onlyInViewport: true },
      loop: true,
      navigation: { prevEl, nextEl },
      slidesPerView: 3,
      spaceBetween: 24,
      speed: motionMedia.matches ? 0 : 650,
      watchOverflow: true,
      on: {
        slideChange: (instance) => {
          activeIndex = instance.realIndex % states.length;
        },
      },
    });
  };

  const destroySlider = () => {
    if (!slider) return;

    slider.destroy(true, true);
    slider = null;
    wrapper.querySelectorAll('[data-event-loop-copy]').forEach((clone) => clone.remove());
    wrapper.append(...states);
    states.forEach((state) => {
      state.removeAttribute('aria-label');
      state.removeAttribute('aria-roledescription');
    });
  };

  const syncLayout = () => {
    const isDesktop = desktopMedia.matches;

    tabs.hidden = isDesktop;
    tabs.setAttribute('aria-hidden', String(isDesktop));
    if (navigation) navigation.hidden = !isDesktop;

    if (isDesktop) {
      setDesktopState(states, controls);
      createSlider();
      return;
    }

    destroySlider();
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
