import Swiper from 'swiper';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import { toggleScrollLock } from '../_functions.js';
import { games } from '../data/games.js';

export function initGameModal() {
  const modal = document.querySelector('[data-game-modal]');
  if (!modal) return;

  const gallery = modal.querySelector('[data-game-gallery]');
  const slides = modal.querySelector('[data-game-slides]');
  const description = modal.querySelector('[data-game-description]');
  const expand = modal.querySelector('[data-game-expand]');
  const previous = modal.querySelector('[data-game-prev]');
  const next = modal.querySelector('[data-game-next]');
  let slider;
  let currentIndex = 0;
  let activeTrigger;
  let wasScrollLocked = false;
  let backdropPointerDown = false;

  const stopTrailer = () => {
    gallery.querySelector('iframe')?.remove();
    gallery.querySelector('[data-game-play]')?.removeAttribute('hidden');
  };

  const updateDescription = () => {
    if (!modal.open) return;
    const expanded = expand.getAttribute('aria-expanded') === 'true';
    description.classList.remove('is-expanded');
    const overflowing = description.scrollHeight > description.clientHeight + 1;
    description.classList.toggle('is-expanded', expanded);
    expand.hidden = !overflowing;
  };

  const render = (index) => {
    currentIndex = index;
    const game = games[index];
    slider?.destroy(true, true);
    stopTrailer();
    modal.querySelector('[data-game-title]').textContent = game.title;
    modal.querySelector('[data-game-tags]').replaceChildren(
      ...game.tags.map((text) => {
        const tag = document.createElement('li');
        tag.textContent = text;
        return tag;
      }),
    );
    description.replaceChildren(
      ...game.description.map((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      }),
    );
    description.classList.remove('is-expanded');
    expand.setAttribute('aria-expanded', 'false');
    expand.textContent = 'Читать полностью';
    previous.disabled = index === 0;
    next.disabled = index === games.length - 1;

    slides.replaceChildren(
      ...[game.cover, ...game.images].map((src, slideIndex) => {
        const slide = document.createElement('div');
        slide.className = 'game-modal__slide swiper-slide';
        const image = document.createElement('img');
        image.src = src;
        image.alt = `${game.title} — ${slideIndex ? `изображение ${slideIndex}` : 'обложка'}`;
        image.className = `game-modal__image${slideIndex === 0 ? ' game-modal__image--cover' : ''}`;
        image.decoding = 'async';
        slide.append(image);
        if (slideIndex === 0 && game.trailer) {
          const play = document.createElement('div');
          play.className = 'game-modal__play';
          play.dataset.gamePlay = '';
          play.innerHTML = `<button class="play-button" type="button" aria-label="Смотреть трейлер игры" data-game-trailer>
            <svg class="play-button__icon" aria-hidden="true"><use href="img/sprite.svg#icon-play"></use></svg>
          </button><span>Смотреть геймплей</span>`;
          slide.append(play);
        }
        return slide;
      }),
    );
    slider = new Swiper(gallery, {
      modules: [A11y, Navigation, Pagination],
      slidesPerView: 1,
      speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
      watchOverflow: true,
      navigation: {
        prevEl: modal.querySelector('[data-game-slide-prev]'),
        nextEl: modal.querySelector('[data-game-slide-next]'),
      },
      pagination: {
        el: modal.querySelector('[data-game-pagination]'),
        clickable: true,
      },
      a11y: {
        prevSlideMessage: 'Предыдущее изображение',
        nextSlideMessage: 'Следующее изображение',
        paginationBulletMessage: 'Изображение {{index}}',
      },
      on: { slideChange: stopTrailer },
    });
    modal.scrollTop = 0;
    updateDescription();
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-game-open]');
    const index = games.findIndex((game) => game.id === trigger?.dataset.gameOpen);
    if (index < 0) return;
    event.preventDefault();
    activeTrigger = trigger;
    wasScrollLocked = document.documentElement.classList.contains('is-scroll-locked');
    modal.showModal();
    toggleScrollLock(true);
    render(index);
  });

  modal.querySelector('[data-game-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => {
    stopTrailer();
    toggleScrollLock(wasScrollLocked);
    activeTrigger?.focus({ preventScroll: true });
  });
  const isBackdrop = (event) => {
    const rect = modal.getBoundingClientRect();
    return (
      event.target === modal &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    );
  };
  modal.addEventListener('pointerdown', (event) => {
    backdropPointerDown = isBackdrop(event);
  });
  modal.addEventListener('click', (event) => {
    if (backdropPointerDown && isBackdrop(event)) modal.close();
    backdropPointerDown = false;
    if (!event.target.closest('[data-game-trailer]')) return;
    const game = games[currentIndex];
    const url = new URL(game.trailer);
    const videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1);
    const frame = document.createElement('iframe');
    frame.className = 'game-modal__video';
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    frame.title = `Трейлер: ${game.title}`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    gallery.querySelector('[data-game-play]').hidden = true;
    slides.firstElementChild.append(frame);
  });
  modal.addEventListener('keydown', (event) => {
    // Keep page sliders still while navigating the dialog with the keyboard.
    event.stopPropagation();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (event.key === 'ArrowLeft') slider.slidePrev();
      else slider.slideNext();
    }
  });
  previous.addEventListener('click', () => {
    if (currentIndex > 0) render(currentIndex - 1);
  });
  next.addEventListener('click', () => {
    if (currentIndex < games.length - 1) render(currentIndex + 1);
  });
  expand.addEventListener('click', () => {
    const expanded = expand.getAttribute('aria-expanded') !== 'true';
    expand.setAttribute('aria-expanded', String(expanded));
    expand.textContent = expanded ? 'Свернуть' : 'Читать полностью';
    description.classList.toggle('is-expanded', expanded);
  });
  new ResizeObserver(updateDescription).observe(gallery);
  document.fonts?.ready.then(updateDescription);
}
