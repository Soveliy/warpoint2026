import Swiper from 'swiper';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';

export function initSliders() {
  const sliders = document.querySelectorAll('[data-slider]');

  sliders.forEach((slider) => {
    const root = slider.closest('[data-slider-root]') ?? slider;
    const isBloggersSlider = slider.matches('[data-bloggers-slider]');
    const nextEl = root.querySelector('[data-slider-next]');
    const paginationEl = root.querySelector('[data-slider-pagination]');
    const prevEl = root.querySelector('[data-slider-prev]');
    const captionEl = root.querySelector('[data-bloggers-caption]');
    const modules = [A11y, Keyboard];

    if (nextEl && prevEl) modules.push(Navigation);
    if (paginationEl) modules.push(Pagination);

    const updateCaption = (swiper) => {
      if (!captionEl) return;

      const activeSlide = swiper.slides[swiper.activeIndex];
      captionEl.textContent = activeSlide?.dataset.bloggerCaption || '';
    };

    new Swiper(slider, {
      a11y: {
        enabled: true,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      modules,
      centeredSlides: isBloggersSlider,
      initialSlide: isBloggersSlider ? 1 : 0,
      navigation:
        nextEl && prevEl
          ? {
              nextEl,
              prevEl,
            }
          : undefined,
      pagination: paginationEl
        ? {
            clickable: true,
            el: paginationEl,
          }
        : undefined,
      slidesPerView: 'auto',
      slideToClickedSlide: isBloggersSlider,
      spaceBetween: 16,
      speed: 650,
      watchOverflow: true,
      on: isBloggersSlider
        ? {
            init: updateCaption,
            slideChange: updateCaption,
          }
        : undefined,
    });
  });
}
