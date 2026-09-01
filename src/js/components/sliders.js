import Swiper from 'swiper';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';

const BLOGGERS_LOOP_SETS = 2;

const prepareBloggersLoopSlides = (slider) => {
  const wrapper = slider.querySelector('.swiper-wrapper');

  if (!wrapper) return 0;

  const originalSlides = [...wrapper.children].filter(
    (slide) => slide.matches('.swiper-slide') && !slide.hasAttribute('data-bloggers-loop-copy'),
  );
  const existingCopies = [...wrapper.querySelectorAll('[data-bloggers-loop-copy]')];
  const copiesCount = originalSlides.length * (BLOGGERS_LOOP_SETS - 1);
  const fragment = document.createDocumentFragment();

  for (let index = existingCopies.length; index < copiesCount; index += 1) {
    const clone = originalSlides[index % originalSlides.length]?.cloneNode(true);

    if (!clone) continue;

    clone.setAttribute('data-bloggers-loop-copy', '');
    clone.querySelectorAll('[data-fancybox]').forEach((trigger, triggerIndex) => {
      const group = trigger.dataset.fancybox;

      if (group) {
        trigger.dataset.fancybox = `${group}-loop-${index + 1}-${triggerIndex + 1}`;
      }
    });
    fragment.append(clone);
  }

  wrapper.append(fragment);

  return wrapper.querySelectorAll('.swiper-slide').length;
};

export function initSliders() {
  const sliders = document.querySelectorAll('[data-slider]');

  sliders.forEach((slider) => {
    const root = slider.closest('[data-slider-root]') ?? slider;
    const isBloggersSlider = slider.matches('[data-bloggers-slider]');
    const slidesCount = isBloggersSlider
      ? prepareBloggersLoopSlides(slider)
      : slider.querySelectorAll('.swiper-slide').length;
    const nextEl = root.querySelector('[data-slider-next]');
    const paginationEl = root.querySelector('[data-slider-pagination]');
    const prevEl = root.querySelector('[data-slider-prev]');
    const modules = [A11y, Keyboard];

    if (nextEl && prevEl) modules.push(Navigation);
    if (paginationEl) modules.push(Pagination);

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
      loop: isBloggersSlider && slidesCount > 1,
      loopAdditionalSlides: isBloggersSlider ? 2 : 0,
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
    });
  });
}
