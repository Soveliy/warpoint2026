import Swiper from 'swiper';
import { A11y, Keyboard, Navigation } from 'swiper/modules';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const setActiveReview = (controls, index) => {
  controls.forEach((control, controlIndex) => {
    const isActive = controlIndex === index;

    control.classList.toggle('is-active', isActive);
    control.setAttribute('aria-pressed', String(isActive));
  });
};

const moveIndicator = (indicator, controls, index) => {
  const firstControl = controls[0];
  const targetControl = controls[index];

  if (!indicator || !firstControl || !targetControl) return;

  const x = targetControl.offsetLeft - firstControl.offsetLeft;

  indicator.style.transform = `translate3d(${x}px, 0, 0)`;
};

export function initReviews() {
  document.querySelectorAll('[data-reviews]').forEach((section) => {
    const sliderElement = section.querySelector('[data-reviews-slider]');
    const cards = [...section.querySelectorAll('[data-review-card]')];
    const controls = [...section.querySelectorAll('[data-review-control]')];
    const indicator = section.querySelector('[data-review-indicator]');
    const previousButton = section.querySelector('[data-review-prev]');
    const nextButton = section.querySelector('[data-review-next]');

    if (
      !sliderElement ||
      !cards.length ||
      controls.length !== cards.length ||
      !previousButton ||
      !nextButton
    ) {
      return;
    }

    const syncState = (swiper) => {
      const activeIndex = swiper.realIndex ?? swiper.activeIndex;

      setActiveReview(controls, activeIndex);
      moveIndicator(indicator, controls, activeIndex);
    };

    const slider = new Swiper(sliderElement, {
      modules: [A11y, Keyboard, Navigation],
      a11y: {
        enabled: true,
        firstSlideMessage: 'Это первый отзыв',
        lastSlideMessage: 'Это последний отзыв',
        nextSlideMessage: 'Следующий отзыв',
        prevSlideMessage: 'Предыдущий отзыв',
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      loop: cards.length > 1,
      navigation: {
        nextEl: nextButton,
        prevEl: previousButton,
      },
      slidesPerView: 1,
      spaceBetween: 16,
      speed: motionQuery.matches ? 0 : 650,
      watchOverflow: true,
      on: {
        init: syncState,
        resize: syncState,
        slideChange: syncState,
      },
    });

    controls.forEach((control, index) => {
      control.addEventListener('click', () => {
        slider.slideToLoop(index);
      });
    });
  });
}
