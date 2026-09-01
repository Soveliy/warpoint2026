const defaultTheme = 'brand';

function getThemeBelowHeader(header) {
  const headerBounds = header.getBoundingClientRect();
  const sampleX = Math.min(Math.max(window.innerWidth / 2, 1), window.innerWidth - 1);
  const sampleY = Math.min(Math.max(headerBounds.bottom + 1, 1), window.innerHeight - 1);
  const elements = document.elementsFromPoint(sampleX, sampleY);

  for (const element of elements) {
    if (element === header || header.contains(element)) {
      continue;
    }

    const themedSection = element.closest('[data-header-theme]');

    if (themedSection) {
      return themedSection.dataset.headerTheme === 'dark' ? 'dark' : defaultTheme;
    }
  }

  return defaultTheme;
}

export function initHeaderTheme() {
  const header = document.querySelector('.header');

  if (!header) {
    return;
  }

  let updateFrame = null;

  const updateTheme = () => {
    const nextTheme = getThemeBelowHeader(header);

    if (header.dataset.theme !== nextTheme) {
      header.dataset.theme = nextTheme;
    }

    updateFrame = null;
  };

  const scheduleUpdate = () => {
    if (updateFrame !== null) {
      return;
    }

    updateFrame = window.requestAnimationFrame(updateTheme);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate, { once: true });
  scheduleUpdate();
}
