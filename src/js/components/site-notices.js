const consentKey = 'warpoint:cookie-consent';
const cookieDismissKey = 'warpoint:cookie-dismissed';

const read = (storage, key) => {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
};
const write = (storage, key, value) => {
  try {
    window[storage].setItem(key, value);
  } catch {
    /* Storage can be unavailable in private mode. */
  }
};

export function initSiteNotices() {
  const notice = document.querySelector('[data-cookie-notice]');
  const announcement = document.querySelector('[data-announcement]');
  const slot = document.querySelector('[data-announcement-slot]');
  const hero = document.querySelector('.hero');
  const dismissedKey = `warpoint:announcement:${announcement?.dataset.announcement}`;
  let floating = false;
  let frame = null;

  const syncCookieSpace = () => {
    const height = notice && !notice.hidden ? notice.getBoundingClientRect().height + 12 : 0;
    document.documentElement.style.setProperty('--cookie-notice-height', `${height}px`);
  };
  const dismissCookie = (accepted) => {
    if (accepted) {
      write('localStorage', consentKey, 'accepted');
      document.dispatchEvent(
        new CustomEvent('warpoint:cookie-consent-change', { detail: { accepted: true } }),
      );
    } else {
      write('sessionStorage', cookieDismissKey, 'true');
    }
    notice.hidden = true;
    syncCookieSpace();
  };

  if (notice) {
    notice.hidden =
      read('localStorage', consentKey) === 'accepted' ||
      read('sessionStorage', cookieDismissKey) === 'true';
    notice
      .querySelector('[data-cookie-accept]')
      .addEventListener('click', () => dismissCookie(true));
    notice
      .querySelector('[data-cookie-close]')
      .addEventListener('click', () => dismissCookie(false));
    new ResizeObserver(syncCookieSpace).observe(notice);
    syncCookieSpace();
  }

  if (!announcement || !slot || !hero) return;
  announcement.hidden ||= read('sessionStorage', dismissedKey) === 'true';
  if (announcement.hidden) {
    slot.hidden = true;
    return;
  }

  const positionAnnouncement = () => {
    frame = null;
    const shouldFloat = hero.getBoundingClientRect().bottom <= window.innerHeight * 0.45;
    if (shouldFloat === floating) return;
    floating = shouldFloat;
    if (floating) {
      slot.style.minHeight = `${slot.getBoundingClientRect().height}px`;
      document.body.append(announcement);
    } else {
      slot.append(announcement);
      slot.style.removeProperty('min-height');
    }
    announcement.classList.toggle('is-floating', floating);
  };
  const schedulePosition = () => {
    frame ??= requestAnimationFrame(positionAnnouncement);
  };
  window.addEventListener('scroll', schedulePosition, { passive: true });
  window.addEventListener('resize', schedulePosition);
  positionAnnouncement();
  announcement.querySelector('[data-announcement-close]').addEventListener('click', () => {
    write('sessionStorage', dismissedKey, 'true');
    announcement.hidden = true;
    slot.hidden = true;
    window.removeEventListener('scroll', schedulePosition);
    window.removeEventListener('resize', schedulePosition);
    if (frame !== null) cancelAnimationFrame(frame);
  });
  announcement.querySelector('a').addEventListener('click', (event) => {
    if (event.currentTarget.getAttribute('href') === '#') event.preventDefault();
  });
}
