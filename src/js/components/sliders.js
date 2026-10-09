import Swiper from 'swiper';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';

const LOOP_SETS = 3;

const prepareLoopSlides = (slider, copyAttribute) => {
  const wrapper = slider.querySelector('.swiper-wrapper');

  if (!wrapper) return 0;

  const originalSlides = [...wrapper.children].filter(
    (slide) => slide.matches('.swiper-slide') && !slide.hasAttribute(copyAttribute),
  );

  if (originalSlides.length < 2) return originalSlides.length;

  const existingCopies = [...wrapper.querySelectorAll(`[${copyAttribute}]`)];
  // Keep enough slides for a continuous loop even on the widest desktop layout.
  const copiesCount = originalSlides.length * (LOOP_SETS - 1);
  const fragment = document.createDocumentFragment();

  for (let index = existingCopies.length; index < copiesCount; index += 1) {
    const clone = originalSlides[index % originalSlides.length]?.cloneNode(true);

    if (!clone) continue;

    clone.setAttribute(copyAttribute, '');
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
    if (slider.swiper) return;

    const root = slider.closest('[data-slider-root]') ?? slider;
    const isBloggersSlider = slider.matches('[data-bloggers-slider]');
    const isGamesSlider = slider.matches('[data-games-slider]');
    const isEventTariffsSlider = slider.matches('[data-event-tariffs-slider]');
    const isImmersiveSlider = slider.matches('[data-immersive-slider]');
    const isLoopSlider = isBloggersSlider || isGamesSlider || isEventTariffsSlider;
    const slidesCount = isLoopSlider
      ? prepareLoopSlides(
          slider,
          isBloggersSlider
            ? 'data-bloggers-loop-copy'
            : isEventTariffsSlider
              ? 'data-event-tariffs-loop-copy'
              : 'data-games-loop-copy',
        )
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
        nextSlideMessage: nextEl?.getAttribute('aria-label') || 'Следующий слайд',
        prevSlideMessage: prevEl?.getAttribute('aria-label') || 'Предыдущий слайд',
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      modules,
      centeredSlides: isBloggersSlider,
      initialSlide: isBloggersSlider ? 1 : 0,
      loop: (isLoopSlider || isImmersiveSlider) && slidesCount > 1,
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
      watchSlidesProgress: isGamesSlider || isEventTariffsSlider,
      watchOverflow: true,
    });
  });
}
