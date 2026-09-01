const rootSelector = '[data-zone-tabs]';
const tabSelector = '[data-zone-tab]';
const panelSelector = '[data-zone-panel]';
const mobileSelectSelector = '[data-zone-mobile-select]';
const mobileTriggerSelector = '[data-zone-mobile-trigger]';
const mobileValueSelector = '[data-zone-mobile-value]';
const mobileMenuSelector = '[data-zone-mobile-menu]';
const initializedAttribute = 'data-zone-tabs-initialized';
const mobileBreakpoint = '(max-width: 47.9375rem)';

function getPairs(root) {
  const tabs = [...root.querySelectorAll(tabSelector)];
  const panels = [...root.querySelectorAll(panelSelector)];

  return tabs
    .map((tab, index) => {
      const controlledId = tab.getAttribute('aria-controls');
      const controlledPanel = controlledId
        ? panels.find((panel) => panel.id === controlledId)
        : panels[index];

      return controlledPanel ? { panel: controlledPanel, tab } : null;
    })
    .filter(Boolean);
}

function getZoneLabel({ tab }) {
  return tab.textContent.replace(/\s+/g, ' ').trim();
}

function cloneZoneIcon(tab) {
  return tab.querySelector('.zones__tab-icon')?.cloneNode(true) ?? null;
}

function createMobileOption(pair, index) {
  const option = document.createElement('button');
  const label = document.createElement('span');
  const mark = document.createElement('span');
  const icon = cloneZoneIcon(pair.tab);

  option.className = 'zones__mobile-option button-reset';
  option.id = `${pair.tab.id || `zone-${index}`}-mobile-option`;
  option.type = 'button';
  option.role = 'option';
  option.tabIndex = -1;
  option.dataset.zoneMobileOption = String(index);
  option.setAttribute('aria-selected', 'false');

  if (pair.panel.id) {
    option.setAttribute('aria-controls', pair.panel.id);
  }

  if (icon) {
    option.append(icon);
  }

  label.className = 'zones__mobile-option-label';
  label.textContent = getZoneLabel(pair);
  mark.className = 'zones__mobile-option-mark';
  mark.setAttribute('aria-hidden', 'true');
  option.append(label, mark);

  return option;
}

function renderMobileValue(container, pair) {
  if (!container) {
    return;
  }

  const label = document.createElement('span');
  const icon = cloneZoneIcon(pair.tab);

  label.className = 'zones__mobile-trigger-text';
  label.textContent = getZoneLabel(pair);
  container.replaceChildren(...(icon ? [icon, label] : [label]));
}

function syncPanelGallery(panel) {
  const galleryItems = [...panel.querySelectorAll('[data-fancybox], [data-zone-fancybox-group]')];

  galleryItems.forEach((item) => {
    if (!item.dataset.zoneFancyboxGroup && item.dataset.fancybox) {
      item.dataset.zoneFancyboxGroup = item.dataset.fancybox;
    }

    if (item.dataset.zoneFancyboxGroup) {
      item.dataset.fancybox = item.dataset.zoneFancyboxGroup;
    }
  });
}

function setupTabs(root) {
  if (root.hasAttribute(initializedAttribute)) {
    return;
  }

  const pairs = getPairs(root);
  const activityList = root.querySelector('.zones__tabs');
  const mobileSelect = root.querySelector(mobileSelectSelector);
  const mobileTrigger = root.querySelector(mobileTriggerSelector);
  const mobileValue = root.querySelector(mobileValueSelector);
  const mobileMenu = root.querySelector(mobileMenuSelector);
  const mobileMedia = window.matchMedia(mobileBreakpoint);

  if (!pairs.length) {
    return;
  }

  const hasMobileSelect = Boolean(mobileSelect && mobileTrigger && mobileValue && mobileMenu);
  const mobileOptions = hasMobileSelect
    ? pairs.map((pair, index) => createMobileOption(pair, index))
    : [];

  if (hasMobileSelect) {
    mobileMenu.replaceChildren(...mobileOptions);
  }

  const initialPairIndex = pairs.findIndex(
    ({ panel, tab }) => tab.getAttribute('aria-pressed') === 'true' || !panel.hidden,
  );
  let activeIndex = initialPairIndex >= 0 ? initialPairIndex : 0;

  const revealTab = (tab) => {
    if (
      !activityList ||
      !activityList.contains(tab) ||
      activityList.scrollWidth <= activityList.clientWidth
    ) {
      return;
    }

    const tabRect = tab.getBoundingClientRect();
    const listRect = activityList.getBoundingClientRect();

    if (tabRect.left < listRect.left) {
      activityList.scrollLeft += tabRect.left - listRect.left;
    } else if (tabRect.right > listRect.right) {
      activityList.scrollLeft += tabRect.right - listRect.right;
    }
  };

  const syncMobileSelect = () => {
    if (!hasMobileSelect) {
      return;
    }

    mobileOptions.forEach((option, index) => {
      const isActive = index === activeIndex;

      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-selected', String(isActive));
      option.tabIndex = isActive ? 0 : -1;
    });

    renderMobileValue(mobileValue, pairs[activeIndex]);
  };

  const activate = (nextIndex, { focus = false, reveal = false } = {}) => {
    activeIndex = nextIndex >= 0 && nextIndex < pairs.length ? nextIndex : 0;

    pairs.forEach(({ panel, tab }, index) => {
      const isActive = index === activeIndex;

      tab.hidden = false;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;

      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.inert = !isActive;
      syncPanelGallery(panel);

      if (tab.id && !panel.hasAttribute('aria-labelledby')) {
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });

    syncMobileSelect();

    const activeTab = pairs[activeIndex].tab;

    if (focus) {
      activeTab.focus({ preventScroll: true });
    }

    if (focus || reveal) {
      revealTab(activeTab);
    }
  };

  const closeMobileSelect = ({ restoreFocus = false } = {}) => {
    if (!hasMobileSelect || mobileMenu.hidden) {
      return;
    }

    mobileMenu.hidden = true;
    mobileSelect.classList.remove('is-open');
    mobileTrigger.setAttribute('aria-expanded', 'false');

    if (restoreFocus) {
      mobileTrigger.focus({ preventScroll: true });
    }
  };

  const openMobileSelect = ({ focusSelected = false } = {}) => {
    if (!hasMobileSelect || !mobileMedia.matches) {
      return;
    }

    mobileMenu.hidden = false;
    mobileSelect.classList.add('is-open');
    mobileTrigger.setAttribute('aria-expanded', 'true');

    if (focusSelected) {
      window.requestAnimationFrame(() => {
        mobileOptions[activeIndex]?.focus({ preventScroll: true });
      });
    }
  };

  const focusMobileOption = (index) => {
    mobileOptions[index]?.focus({ preventScroll: true });
  };

  pairs.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => activate(index));

    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;

      switch (event.key) {
        case 'ArrowRight':
          nextIndex = index + 1;
          break;
        case 'ArrowLeft':
          nextIndex = index - 1;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = pairs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      activate((nextIndex + pairs.length) % pairs.length, { focus: true, reveal: true });
    });
  });

  if (hasMobileSelect) {
    mobileTrigger.addEventListener('click', () => {
      if (mobileMenu.hidden) {
        openMobileSelect();
      } else {
        closeMobileSelect();
      }
    });

    mobileTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileSelect();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      event.preventDefault();
      openMobileSelect({ focusSelected: true });
    });

    mobileOptions.forEach((option, index) => {
      option.addEventListener('click', () => {
        activate(index);
        closeMobileSelect({ restoreFocus: true });
      });

      option.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMobileSelect({ restoreFocus: true });
          return;
        }

        if (event.key === 'Tab') {
          closeMobileSelect();
          return;
        }

        let nextIndex = null;

        switch (event.key) {
          case 'ArrowDown':
            nextIndex = index + 1;
            break;
          case 'ArrowUp':
            nextIndex = index - 1;
            break;
          case 'Home':
            nextIndex = 0;
            break;
          case 'End':
            nextIndex = mobileOptions.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        focusMobileOption((nextIndex + mobileOptions.length) % mobileOptions.length);
      });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!mobileSelect.contains(event.target)) {
        closeMobileSelect();
      }
    });

    mobileMedia.addEventListener('change', (event) => {
      if (!event.matches) {
        closeMobileSelect();
      }
    });
  }

  root.setAttribute(initializedAttribute, '');
  activate(activeIndex);
}

export function initZoneSequence() {
  document.querySelectorAll(rootSelector).forEach(setupTabs);
}
