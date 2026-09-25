export function initMessengerMenus() {
  document.querySelectorAll('[data-messenger-menu]').forEach((menu) => {
    const toggle = menu.querySelector('[data-messenger-toggle]');
    const dropdown = menu.querySelector('[data-messenger-dropdown]');
    const links = [...menu.querySelectorAll('[data-messenger-link]')];

    if (!toggle || !dropdown || menu.dataset.messengerReady === 'true') {
      return;
    }

    menu.dataset.messengerReady = 'true';

    const setOpen = (open, { restoreFocus = false } = {}) => {
      toggle.setAttribute('aria-expanded', String(open));
      dropdown.hidden = !open;

      if (restoreFocus) {
        toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener('click', () => setOpen(dropdown.hidden));
    toggle.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      event.preventDefault();
      setOpen(true);
      (event.key === 'ArrowDown' ? links[0] : links.at(-1))?.focus();
    });

    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !dropdown.hidden) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false, { restoreFocus: true });
        return;
      }

      const index = links.indexOf(document.activeElement);

      if (index < 0 || event.target === toggle) {
        return;
      }

      let nextIndex;

      switch (event.key) {
        case 'ArrowDown':
          nextIndex = (index + 1) % links.length;
          break;
        case 'ArrowUp':
          nextIndex = (index - 1 + links.length) % links.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = links.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      links[nextIndex].focus();
    });

    menu.addEventListener('focusout', (event) => {
      if (!menu.contains(event.relatedTarget)) {
        setOpen(false);
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!menu.contains(event.target)) {
        setOpen(false);
      }
    });
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        const isPlaceholder = link.getAttribute('href') === '#';

        if (isPlaceholder) {
          event.preventDefault();
        }

        setOpen(false, { restoreFocus: isPlaceholder });
      });
    });
    window.addEventListener('resize', () => setOpen(false), { passive: true });
    window.addEventListener('scroll', () => setOpen(false), { passive: true });
    setOpen(false);
  });
}
