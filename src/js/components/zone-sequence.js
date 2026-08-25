const rootSelector = '[data-zone-tabs]';
const tabSelector = '[data-zone-tab]';
const panelSelector = '[data-zone-panel]';
const venueStepSelector = '[data-zone-venue-step]';
const venueNameSelector = '[data-zone-venue-name]';
const mobileSelectSelector = '[data-zone-mobile-select]';
const mobileTriggerSelector = '[data-zone-mobile-trigger]';
const mobileValueSelector = '[data-zone-mobile-value]';
const mobileMenuSelector = '[data-zone-mobile-menu]';
const initializedAttribute = 'data-zone-tabs-initialized';
const mobileBreakpoint = '(max-width: 47.9375rem)';
const venueOrder = ['arena', 'park'];
const venueNames = {
  arena: 'Арена',
  park: 'Парк',
};

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

function getZoneTypes(tab) {
  return (tab.dataset.zoneTypes ?? '').split(/\s+/).filter(Boolean);
}

function getPairKey({ panel, tab }) {
  return tab.id || panel.id;
}

function getZoneLabel({ tab }) {
  if (tab.hasAttribute('data-zone-primary')) {
    return 'Арена';
  }

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

function syncPanelGallery(panel, isAvailable) {
  const galleryItems = [...panel.querySelectorAll('[data-fancybox], [data-zone-fancybox-group]')];

  galleryItems.forEach((item) => {
    if (!item.dataset.zoneFancyboxGroup && item.dataset.fancybox) {
      item.dataset.zoneFancyboxGroup = item.dataset.fancybox;
    }

    if (isAvailable && item.dataset.zoneFancyboxGroup) {
      item.dataset.fancybox = item.dataset.zoneFancyboxGroup;
    } else if (!isAvailable) {
      item.removeAttribute('data-fancybox');
    }
  });
}

function setupTabs(root) {
  if (root.hasAttribute(initializedAttribute)) {
    return;
  }

  const pairs = getPairs(root);
  const venueSteps = [...root.querySelectorAll(venueStepSelector)];
  const venueName = root.querySelector(venueNameSelector);
  const venueStatus = root.querySelector('[data-zone-venue-status]');
  const activityList = root.querySelector('.zones__tabs');
  const mobileSelect = root.querySelector(mobileSelectSelector);
  const mobileTrigger = root.querySelector(mobileTriggerSelector);
  const mobileValue = root.querySelector(mobileValueSelector);
  const mobileMenu = root.querySelector(mobileMenuSelector);
  const mobileMedia = window.matchMedia(mobileBreakpoint);
  const primaryIndex = pairs.findIndex(({ tab }) => tab.hasAttribute('data-zone-primary'));

  if (!pairs.length || primaryIndex < 0) {
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
  let activeIndex = initialPairIndex >= 0 ? initialPairIndex : primaryIndex;
  let activeVenue = venueOrder.includes(root.dataset.zoneVenueActive)
    ? root.dataset.zoneVenueActive
    : 'park';
  const rememberedTabs = new Map([[activeVenue, getPairKey(pairs[activeIndex])]]);

  const isAvailable = ({ tab }, venue = activeVenue) => {
    const zoneTypes = getZoneTypes(tab);

    return !venue || !zoneTypes.length || zoneTypes.includes(venue);
  };

  const getAvailableIndices = (venue = activeVenue) =>
    pairs.reduce((indices, pair, index) => {
      if (isAvailable(pair, venue)) {
        indices.push(index);
      }

      return indices;
    }, []);

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

  const syncMobileSelect = (availableIndices) => {
    if (!hasMobileSelect) {
      return;
    }

    mobileOptions.forEach((option, index) => {
      const available = availableIndices.includes(index);
      const isActive = available && index === activeIndex;

      option.hidden = !available;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-selected', String(isActive));
      option.tabIndex = isActive ? 0 : -1;
    });

    renderMobileValue(mobileValue, pairs[activeIndex]);
  };

  const activate = (nextIndex, { focus = false, reveal = false } = {}) => {
    const availableIndices = getAvailableIndices();

    if (!availableIndices.length) {
      return;
    }

    activeIndex = availableIndices.includes(nextIndex) ? nextIndex : availableIndices[0];

    pairs.forEach(({ panel, tab }, index) => {
      const available = availableIndices.includes(index);
      const isActive = available && index === activeIndex;

      tab.hidden = !available;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
      tab.tabIndex = available ? 0 : -1;

      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.inert = !isActive;
      syncPanelGallery(panel, available);

      if (tab.id && !panel.hasAttribute('aria-labelledby')) {
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });

    syncMobileSelect(availableIndices);

    rememberedTabs.set(activeVenue, getPairKey(pairs[activeIndex]));

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

  const getAvailableMobileIndices = () =>
    mobileOptions.reduce((indices, option, index) => {
      if (!option.hidden) {
        indices.push(index);
      }

      return indices;
    }, []);

  const focusMobileOption = (index) => {
    mobileOptions[index]?.focus({ preventScroll: true });
  };

  const getNextVenue = (step = 1) => {
    const currentIndex = venueOrder.indexOf(activeVenue);

    return venueOrder[(currentIndex + step + venueOrder.length) % venueOrder.length];
  };

  const updateVenueControls = () => {
    const currentName = venueNames[activeVenue];
    const nextName = venueNames[getNextVenue()];

    if (venueName) {
      venueName.textContent = currentName;
    }

    pairs[primaryIndex].tab.setAttribute(
      'aria-label',
      `Открыть основную зону формата «${currentName}»`,
    );

    venueSteps.forEach((button) => {
      button.setAttribute('aria-label', `Показать формат «${nextName}»`);
    });
  };

  const announceVenue = () => {
    if (!venueStatus) {
      return;
    }

    const zoneNames = getAvailableIndices().map((index) => {
      const { tab } = pairs[index];

      return tab.hasAttribute('data-zone-primary')
        ? 'Арена'
        : tab.textContent.replace(/\s+/g, ' ').trim();
    });
    const availability = zoneNames.length === 1 ? 'Доступна зона' : 'Доступны зоны';

    venueStatus.textContent = `Выбран формат «${venueNames[activeVenue]}». ${availability}: ${zoneNames.join(', ')}.`;
  };

  const setVenue = (nextVenue, { announce = true, reveal = true } = {}) => {
    if (!venueOrder.includes(nextVenue)) {
      return;
    }

    rememberedTabs.set(activeVenue, getPairKey(pairs[activeIndex]));
    activeVenue = nextVenue;
    root.dataset.zoneVenueActive = activeVenue;
    updateVenueControls();

    const availableIndices = getAvailableIndices();
    const rememberedTab = rememberedTabs.get(activeVenue);
    const rememberedIndex = pairs.findIndex((pair) => getPairKey(pair) === rememberedTab);

    activate(
      rememberedIndex >= 0 && availableIndices.includes(rememberedIndex)
        ? rememberedIndex
        : primaryIndex,
      { reveal },
    );

    if (announce) {
      announceVenue();
    }
  };

  pairs.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => activate(index));

    tab.addEventListener('keydown', (event) => {
      const availableIndices = getAvailableIndices();
      const currentPosition = availableIndices.indexOf(index);
      let nextPosition = null;

      switch (event.key) {
        case 'ArrowRight':
          nextPosition = currentPosition + 1;
          break;
        case 'ArrowLeft':
          nextPosition = currentPosition - 1;
          break;
        case 'Home':
          nextPosition = 0;
          break;
        case 'End':
          nextPosition = availableIndices.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      activate(
        availableIndices[(nextPosition + availableIndices.length) % availableIndices.length],
        { focus: true },
      );
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

        const availableIndices = getAvailableMobileIndices();
        const currentPosition = availableIndices.indexOf(index);
        let nextPosition = null;

        switch (event.key) {
          case 'ArrowDown':
            nextPosition = currentPosition + 1;
            break;
          case 'ArrowUp':
            nextPosition = currentPosition - 1;
            break;
          case 'Home':
            nextPosition = 0;
            break;
          case 'End':
            nextPosition = availableIndices.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        focusMobileOption(
          availableIndices[(nextPosition + availableIndices.length) % availableIndices.length],
        );
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

  venueSteps.forEach((button) => {
    button.addEventListener('click', () => {
      const step = Number.parseInt(button.dataset.zoneVenueStep, 10) || 1;

      closeMobileSelect();
      setVenue(getNextVenue(step));
    });
  });

  root.setAttribute(initializedAttribute, '');
  setVenue(activeVenue, { announce: false, reveal: false });
}

export function initZoneSequence() {
  document.querySelectorAll(rootSelector).forEach(setupTabs);
}
