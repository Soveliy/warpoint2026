import { isEscapeKey, toggleScrollLock } from '../_functions.js';

const focusableSelector = 'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])';
const mobileMediaQuery = '(max-width: 64rem)';

export function initMobileMenu() {
  const header = document.querySelector('.header');
  const menu = header?.querySelector('[data-mobile-menu]');
  const toggle = header?.querySelector('[data-mobile-menu-toggle]');

  if (!header || !menu || !toggle) {
    return;
  }

  const headerTop = header.querySelector('.header__top');
  const mobileActions = document.querySelector('.mobile-actions');
  const menuActions = [...menu.querySelectorAll('a[href], [data-mobile-menu-close]')];
  const mobileQuery = window.matchMedia(mobileMediaQuery);
  let isOpen = false;
  let resizeFrame = null;

  const updateMenuOffset = () => {
    if (!isOpen) {
      return;
    }

    if (resizeFrame !== null) {
      window.cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = window.requestAnimationFrame(() => {
      const headerBottom = Math.max(0, Math.ceil(header.getBoundingClientRect().bottom));

      header.style.setProperty('--mobile-menu-top', `${headerBottom}px`);
      resizeFrame = null;
    });
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

      menu.removeAttribute('aria-hidden');
      menu.inert = false;
      toggleScrollLock(true);
      updateMenuOffset();

      window.requestAnimationFrame(() => {
        menu.querySelector(focusableSelector)?.focus();
      });

      return;
    }

    if (resizeFrame !== null) {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = null;
    }

    syncClosedAccessibility();
    toggleScrollLock(false);
    header.style.removeProperty('--mobile-menu-top');

    if (restoreFocus) {
      toggle.focus();
    }
  };

  const handleKeydown = (event) => {
    if (!isOpen) {
      return;
    }

    if (isEscapeKey(event)) {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = [
      toggle,
      ...[...menu.querySelectorAll(focusableSelector)].filter(
        (element) => element.getClientRects().length,
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

  toggle.addEventListener('click', () => setOpen(!isOpen));
  menuActions.forEach((action) => {
    action.addEventListener('click', () => setOpen(false, { restoreFocus: false }));
  });
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', updateMenuOffset, { passive: true });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(updateMenuOffset);

    resizeObserver.observe(header);
  }

  mobileQuery.addEventListener('change', () => {
    if (isOpen) {
      setOpen(false, { restoreFocus: false });
    }

    syncClosedAccessibility();
  });

  syncClosedAccessibility();
}
