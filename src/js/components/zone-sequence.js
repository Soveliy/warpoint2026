const rootSelector = '[data-zone-tabs]';
const tabSelector = '[data-zone-tab]';
const panelSelector = '[data-zone-panel]';
const initializedAttribute = 'data-zone-tabs-initialized';

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

function setupTabs(root) {
  if (root.hasAttribute(initializedAttribute)) {
    return;
  }

  const pairs = getPairs(root);

  if (!pairs.length) {
    return;
  }

  const activePairIndex = pairs.findIndex(
    ({ panel, tab }) => tab.getAttribute('aria-selected') === 'true' || !panel.hidden,
  );
  let activeIndex = activePairIndex >= 0 ? activePairIndex : 0;

  const activate = (nextIndex, { focus = false } = {}) => {
    activeIndex = (nextIndex + pairs.length) % pairs.length;

    pairs.forEach(({ panel, tab }, index) => {
      const isActive = index === activeIndex;

      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;

      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;

      if (tab.id && !panel.hasAttribute('aria-labelledby')) {
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });

    if (focus) {
      const activeTab = pairs[activeIndex].tab;

      activeTab.focus({ preventScroll: true });
      activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  pairs.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => activate(index));

    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = index + 1;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
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
      activate(nextIndex, { focus: true });
    });
  });

  root.setAttribute(initializedAttribute, '');
  activate(activeIndex);
}

export function initZoneSequence() {
  document.querySelectorAll(rootSelector).forEach(setupTabs);
}
