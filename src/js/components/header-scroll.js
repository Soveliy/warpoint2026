const hiddenClass = 'header--top-hidden';
const scrolledClass = 'header--scrolled';
const directionThreshold = 10;
const topHideThreshold = 12;
const bookingRevealThreshold = 24;

export function initHeaderScroll() {
  const header = document.querySelector('.header');
  const headerTop = header?.querySelector('.header__top');

  if (!header || !headerTop) {
    return;
  }

  let previousPosition = window.scrollY;
  let scrollFrame = null;

  const updateTopOffset = () => {
    const marginBottom = Number.parseFloat(getComputedStyle(headerTop).marginBottom) || 0;

    header.style.setProperty('--header-top-offset', `${headerTop.offsetHeight + marginBottom}px`);
  };

  const setTopHidden = (hidden) => {
    header.classList.toggle(hiddenClass, hidden);
    headerTop.inert = hidden;
  };

  const updateHeader = (position) => {
    const delta = position - previousPosition;

    header.classList.toggle(scrolledClass, position > bookingRevealThreshold);

    if (position <= topHideThreshold) {
      setTopHidden(false);
      previousPosition = position;
      return;
    }

    if (Math.abs(delta) < directionThreshold) {
      return;
    }

    setTopHidden(delta > 0);
    previousPosition = position;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (scrollFrame !== null) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        updateHeader(window.scrollY);
        scrollFrame = null;
      });
    },
    { passive: true },
  );

  updateTopOffset();
  updateHeader(window.scrollY);

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(updateTopOffset);

    resizeObserver.observe(headerTop);
  } else {
    window.addEventListener('resize', updateTopOffset, { passive: true });
  }
}
