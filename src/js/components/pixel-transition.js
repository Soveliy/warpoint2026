import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const sectionSelector =
  '.main > :is(section, .hero, .video-section, [data-pixel-transition="on"], [data-pixel-section]), .footer';
const defaultColumns = 48;
const defaultRows = 6;
const defaultScrub = 0.3;
const defaultPixelDuration = 0.1;
const defaultStaggerAmount = 1.5;

const breakpoints = {
  landscape: '(max-width: 47.9375rem)',
  mobile: '(max-width: 29.875rem)',
  tablet: '(max-width: 61.9375rem)',
};

function parseColor(color) {
  const channels = color.match(/[\d.]+/g)?.map(Number);

  if (!channels || channels.length < 3 || channels[3] === 0) {
    return null;
  }

  return color;
}

function getSectionColor(section) {
  if (section.dataset.pixelColor) {
    return section.dataset.pixelColor;
  }

  return (
    parseColor(getComputedStyle(section).backgroundColor) ??
    parseColor(getComputedStyle(document.body).backgroundColor) ??
    '#000000'
  );
}

function getResponsiveValue(wrapper, name, fallback) {
  const base = Number.parseInt(wrapper.dataset[name], 10) || fallback;

  if (window.matchMedia(breakpoints.mobile).matches) {
    return Number.parseInt(wrapper.dataset[`${name}Mobile`], 10) || base;
  }

  if (window.matchMedia(breakpoints.landscape).matches) {
    return Number.parseInt(wrapper.dataset[`${name}Landscape`], 10) || base;
  }

  if (window.matchMedia(breakpoints.tablet).matches) {
    return Number.parseInt(wrapper.dataset[`${name}Tablet`], 10) || base;
  }

  return base;
}

function createWrapper(section, nextSection) {
  const wrapper = document.createElement('div');

  wrapper.className = 'pixelated-scroll-transition';
  wrapper.dataset.columns = section.dataset.pixelColumns || defaultColumns;
  wrapper.dataset.columnsLandscape = section.dataset.pixelColumnsLandscape || 30;
  wrapper.dataset.columnsMobile = section.dataset.pixelColumnsMobile || 18;
  wrapper.dataset.columnsTablet = section.dataset.pixelColumnsTablet || 30;
  wrapper.dataset.pixelatedScrollTransition = '';
  wrapper.dataset.rows = section.dataset.pixelRows || defaultRows;
  wrapper.dataset.rowsLandscape = section.dataset.pixelRowsLandscape || 4;
  wrapper.dataset.rowsMobile = section.dataset.pixelRowsMobile || 4;
  wrapper.dataset.rowsTablet = section.dataset.pixelRowsTablet || 5;
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.style.setProperty('--pixel-color', getSectionColor(nextSection));

  return wrapper;
}

function createColumn() {
  const column = document.createElement('div');

  column.className = 'pixelated-scroll-transition__column';
  column.dataset.pixelatedScrollColumn = '';

  return column;
}

function createPixel() {
  const pixel = document.createElement('div');

  pixel.className = 'pixelated-scroll-transition__pixel';
  pixel.dataset.pixelatedScrollPixel = '';

  return pixel;
}

function buildGrid(wrapper, columns, rows) {
  const panel = document.createElement('div');
  const fragment = document.createDocumentFragment();

  panel.className = 'pixelated-scroll-transition__panel';
  panel.dataset.pixelatedScrollPanel = '';

  for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
    const column = createColumn();

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      column.append(createPixel());
    }

    fragment.append(column);
  }

  panel.append(fragment);
  wrapper.append(panel);

  return panel;
}

function collectPixels(panel, rows) {
  const columns = panel.querySelectorAll('[data-pixelated-scroll-column]');
  const pixelData = [];

  for (let row = 0; row < rows; row += 1) {
    columns.forEach((column, columnIndex) => {
      const pixel = column.children[row];

      if (!pixel) {
        return;
      }

      const distanceFromBottom = rows - 1 - row;
      const priority =
        distanceFromBottom * 50 + Math.random() * 300 + Math.sin(columnIndex * 0.3) * 30;

      pixelData.push({ pixel, priority });
    });
  }

  return pixelData
    .sort((first, second) => first.priority - second.priority)
    .map(({ pixel }) => pixel);
}

function createAnimation(pixels, section) {
  const timeline = gsap.timeline({
    scrollTrigger: {
      end: section.dataset.pixelScrollEnd || 'bottom top',
      invalidateOnRefresh: true,
      refreshPriority: 0,
      scrub: defaultScrub,
      start: section.dataset.pixelScrollStart || 'bottom bottom',
      trigger: section,
    },
  });

  gsap.set(pixels, { autoAlpha: 0 });
  timeline.to(pixels, {
    autoAlpha: 1,
    duration: defaultPixelDuration,
    ease: 'none',
    stagger: {
      amount: defaultStaggerAmount,
      from: 'start',
    },
  });

  return timeline;
}

function setupInstance(wrapper) {
  const section = wrapper.parentElement;
  const columns = getResponsiveValue(wrapper, 'columns', defaultColumns);
  const rows = getResponsiveValue(wrapper, 'rows', defaultRows);
  const panel = buildGrid(wrapper, columns, rows);
  const pixels = collectPixels(panel, rows);
  const timeline = createAnimation(pixels, section);

  return { timeline, wrapper };
}

function destroyInstance({ timeline, wrapper }) {
  timeline.scrollTrigger?.kill();
  timeline.kill();
  wrapper.querySelector('[data-pixelated-scroll-panel]')?.remove();
}

export function initPixelTransitions() {
  const sections = [...document.querySelectorAll(sectionSelector)];
  const wrappers = [];

  sections.slice(0, -1).forEach((section, index) => {
    if (section.dataset.pixelTransition !== 'on') {
      return;
    }

    const wrapper = createWrapper(section, sections[index + 1]);

    section.classList.add('has-pixel-transition');
    section.append(wrapper);
    wrappers.push(wrapper);
  });

  if (!wrappers.length) {
    return;
  }

  const media = gsap.matchMedia();

  media.add(
    {
      desktop: '(min-width: 62rem)',
      landscape: '(min-width: 29.9375rem) and (max-width: 47.9375rem)',
      mobile: '(max-width: 29.875rem)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
      tablet: '(min-width: 48rem) and (max-width: 61.9375rem)',
    },
    ({ conditions }) => {
      if (conditions.reduceMotion) {
        return undefined;
      }

      const instances = wrappers.map(setupInstance);

      ScrollTrigger.refresh();

      return () => {
        instances.forEach(destroyInstance);
      };
    },
  );
}
