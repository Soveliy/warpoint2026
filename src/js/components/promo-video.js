import previewVideoUrl from '../../video/video_preview.mp4?url';

const sectionSelector = '[data-promo-video-section]';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const openDuration = 720;
const closeDuration = 720;

function setupPromoVideo(section) {
  const playButton = section.querySelector('[data-promo-video]');
  const player = section.querySelector('[data-promo-video-player]');
  const video = section.querySelector('[data-promo-video-media]');
  const closeButton = section.querySelector('[data-promo-video-close]');

  if (!playButton || !player || !video || !closeButton) return;

  let state = 'closed';
  let stateTimer = 0;

  video.src = previewVideoUrl;
  video.controls = false;

  const clearStateTimer = () => {
    window.clearTimeout(stateTimer);
    stateTimer = 0;
  };

  const setButtonOrigin = () => {
    const sectionRect = section.getBoundingClientRect();
    const buttonRect = playButton.getBoundingClientRect();
    const centerX = buttonRect.left - sectionRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top - sectionRect.top + buttonRect.height / 2;

    section.style.setProperty('--promo-play-x', `${centerX}px`);
    section.style.setProperty('--promo-play-y', `${centerY}px`);
    section.style.setProperty('--promo-play-size', `${buttonRect.width}px`);
    section.style.setProperty('--promo-play-radius', getComputedStyle(playButton).borderRadius);
  };

  const finishOpen = () => {
    if (state !== 'opening') return;

    state = 'open';
    section.classList.remove('is-video-opening');
    section.classList.add('is-video-open');
    video.controls = true;
    closeButton.tabIndex = 0;
    closeButton.focus({ preventScroll: true });
  };

  const openPlayer = () => {
    if (state !== 'closed') return;

    state = 'opening';
    clearStateTimer();
    setButtonOrigin();
    section.classList.add('is-video-preparing');
    playButton.disabled = true;
    playButton.setAttribute('aria-expanded', 'true');
    player.setAttribute('aria-hidden', 'false');

    try {
      video.currentTime = 0;
    } catch {
      // Metadata may still be loading; playback will begin from the first frame.
    }

    video.play().catch(() => {
      video.controls = true;
    });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (state !== 'opening') return;

        section.classList.add('is-video-opening');

        if (reducedMotion.matches) {
          finishOpen();
          return;
        }

        stateTimer = window.setTimeout(finishOpen, openDuration);
      });
    });
  };

  const finishClose = () => {
    if (state !== 'closing') return;

    state = 'closed';
    section.classList.remove('is-video-closing', 'is-video-preparing');
    section.style.removeProperty('--promo-play-x');
    section.style.removeProperty('--promo-play-y');
    section.style.removeProperty('--promo-play-size');
    section.style.removeProperty('--promo-play-radius');
    player.setAttribute('aria-hidden', 'true');
    playButton.disabled = false;

    try {
      video.currentTime = 0;
    } catch {
      // Metadata may not be ready yet.
    }

    playButton.focus({ preventScroll: true });
  };

  const closePlayer = () => {
    if (state === 'closed' || state === 'closing') return;

    state = 'closing';
    clearStateTimer();
    setButtonOrigin();
    video.pause();
    video.controls = false;
    closeButton.tabIndex = -1;
    playButton.setAttribute('aria-expanded', 'false');
    section.classList.remove('is-video-opening', 'is-video-open');
    section.classList.add('is-video-closing');

    if (reducedMotion.matches) {
      finishClose();
      return;
    }

    stateTimer = window.setTimeout(finishClose, closeDuration);
  };

  playButton.addEventListener('click', openPlayer);
  closeButton.addEventListener('click', closePlayer);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state !== 'closed') {
      event.preventDefault();
      closePlayer();
    }
  });
}

export function initPromoVideo() {
  document.querySelectorAll(sectionSelector).forEach(setupPromoVideo);
}
