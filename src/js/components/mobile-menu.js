import { isEscapeKey, toggleScrollLock } from '../_functions.js';

const focusableSelector = 'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])';
const mobileMediaQuery = '(max-width: 64rem)';
const backdropTransitionDuration = 300;

export function initMobileMenu() {
  const header = document.querySelector('.header');
  const menu = header?.querySelector('[data-mobile-menu]');
  const toggle = header?.querySelector('[data-mobile-menu-toggle]');
  const backdrop = header?.querySelector('[data-mobile-menu-backdrop]');

  if (!header || !menu || !toggle || !backdrop) {
    return;
  }

  const headerTop = header.querySelector('.header__top');
  const mobileActions = document.querySelector('.mobile-actions');
  const closeButton = menu.querySelector('[data-mobile-menu-close]');
  const menuActions = [...menu.querySelectorAll('a[href], [data-mobile-menu-close]')];
  const mobileQuery = window.matchMedia(mobileMediaQuery);
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const submenuEntries = [...menu.querySelectorAll('[data-menu-submenu-toggle]')]
    .map((submenuToggle) => {
      const submenuId = submenuToggle.getAttribute('aria-controls');
      const submenu = submenuId ? document.getElementById(submenuId) : null;

      return submenu && menu.contains(submenu) ? { submenu, toggle: submenuToggle } : null;
    })
    .filter(Boolean);

  let isOpen = false;
  let backdropTimer = null;
  let resizeFrame = null;

  const setSubmenuOpen = (entry, nextOpen) => {
    const { submenu, toggle: submenuToggle } = entry;

    submenuToggle.setAttribute('aria-expanded', String(nextOpen));
    submenu.setAttribute('aria-hidden', String(!nextOpen));
    submenu.inert = !nextOpen;

    if (isOpen) {
      submenu.style.maxHeight = nextOpen ? `${submenu.scrollHeight}px` : '0px';
    } else {
      submenu.style.removeProperty('max-height');
    }
  };

  const closeSubmenus = (exceptEntry = null) => {
    submenuEntries.forEach((entry) => {
      if (entry !== exceptEntry && entry.toggle.getAttribute('aria-expanded') === 'true') {
        setSubmenuOpen(entry, false);
      }
    });
  };

  const toggleSubmenu = (entry, { focusFirst = false } = {}) => {
    const shouldOpen = entry.toggle.getAttribute('aria-expanded') !== 'true';

    closeSubmenus(entry);
    setSubmenuOpen(entry, shouldOpen);

    if (shouldOpen && focusFirst) {
      window.requestAnimationFrame(() => {
        entry.submenu.querySelector(focusableSelector)?.focus();
      });
    }
  };

  const showBackdrop = () => {
    if (backdropTimer !== null) {
      window.clearTimeout(backdropTimer);
      backdropTimer = null;
    }

    backdrop.hidden = false;
    window.requestAnimationFrame(() => backdrop.classList.add('is-visible'));
  };

  const hideBackdrop = () => {
    backdrop.classList.remove('is-visible');

    const hide = () => {
      if (!isOpen) {
        backdrop.hidden = true;
      }

      backdropTimer = null;
    };

    if (reducedMotionQuery.matches) {
      hide();
      return;
    }

    backdropTimer = window.setTimeout(hide, backdropTransitionDuration);
  };

  const syncClosedAccessibility = () => {
    const isUnavailable = mobileQuery.matches && !isOpen;

    menu.setAttribute('aria-hidden', String(isUnavailable));
    menu.inert = isUnavailable;
  };

  const setOpen = (nextOpen, { restoreFocus = true } = {}) => {
    if (isOpen === nextOpen) {
      return;
    }

    isOpen = nextOpen;
    toggle.classList.toggle('is-active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', isOpen);
    header.classList.toggle('header--menu-open', isOpen);
    document.documentElement.classList.toggle('is-mobile-menu-open', isOpen);

    if (mobileActions) {
      mobileActions.inert = isOpen;
    }

    if (isOpen) {
      header.classList.remove('header--top-hidden');

      if (headerTop) {
        headerTop.inert = false;
      }

      closeSubmenus();
      menu.removeAttribute('aria-hidden');
      menu.inert = false;
      toggleScrollLock(true);
      showBackdrop();

      window.requestAnimationFrame(() => {
        closeButton?.focus();
      });

      return;
    }

    closeSubmenus();
    syncClosedAccessibility();
    toggleScrollLock(false);
    hideBackdrop();

    if (restoreFocus) {
      toggle.focus();
    }
  };

  const refreshOpenSubmenuHeight = () => {
    if (!isOpen || resizeFrame !== null) {
      return;
    }

    resizeFrame = window.requestAnimationFrame(() => {
      submenuEntries.forEach((entry) => {
        if (entry.toggle.getAttribute('aria-expanded') === 'true') {
          entry.submenu.style.maxHeight = `${entry.submenu.scrollHeight}px`;
        }
      });
      resizeFrame = null;
    });
  };

  const handleKeydown = (event) => {
    if (isEscapeKey(event)) {
      const openSubmenu = submenuEntries.find(
        (entry) => entry.toggle.getAttribute('aria-expanded') === 'true',
      );

      if (openSubmenu) {
        event.preventDefault();
        setSubmenuOpen(openSubmenu, false);
        openSubmenu.toggle.focus();
        return;
      }

      if (isOpen) {
        event.preventDefault();
        setOpen(false);
      }

      return;
    }

    if (!isOpen || event.key !== 'Tab') {
      return;
    }

    const focusableElements = [
      toggle,
      ...[...menu.querySelectorAll(focusableSelector)].filter(
        (element) => element.getClientRects().length && !element.closest('[inert]'),
      ),
    ];
    const currentIndex = focusableElements.indexOf(document.activeElement);
    const lastIndex = focusableElements.length - 1;
    let nextIndex = currentIndex + (event.shiftKey ? -1 : 1);

    if (currentIndex < 0) {
      nextIndex = event.shiftKey ? lastIndex : 0;
    } else if (nextIndex < 0) {
      nextIndex = lastIndex;
    } else if (nextIndex > lastIndex) {
      nextIndex = 0;
    }

    event.preventDefault();
    focusableElements[nextIndex]?.focus();
  };

  submenuEntries.forEach((entry) => {
    setSubmenuOpen(entry, false);
    entry.toggle.addEventListener('click', () => toggleSubmenu(entry));
    entry.toggle.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') {
        return;
      }

      event.preventDefault();

      if (entry.toggle.getAttribute('aria-expanded') !== 'true') {
        toggleSubmenu(entry, { focusFirst: true });
      } else {
        entry.submenu.querySelector(focusableSelector)?.focus();
      }
    });
  });

  toggle.addEventListener('click', () => setOpen(!isOpen));
  backdrop.addEventListener('click', () => setOpen(false));
  menuActions.forEach((action) => {
    action.addEventListener('click', () => {
      closeSubmenus();

      if (isOpen) {
        setOpen(false, { restoreFocus: false });
      }
    });
  });
  document.addEventListener('click', (event) => {
    if (!isOpen && !menu.contains(event.target)) {
      closeSubmenus();
    }
  });
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', refreshOpenSubmenuHeight, { passive: true });

  mobileQuery.addEventListener('change', () => {
    if (isOpen) {
      setOpen(false, { restoreFocus: false });
    }

    closeSubmenus();
    syncClosedAccessibility();
  });

  syncClosedAccessibility();
}
