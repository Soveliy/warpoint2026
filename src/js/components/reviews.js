import Swiper from 'swiper';
import { A11y, Keyboard, Navigation } from 'swiper/modules';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 47.9375rem)');
const REVIEW_LOOP_SETS = 2;
const REVIEW_LOOP_BUFFER = 4;
const scoreLabel = 'Средняя оценка гостей 5 из 5';

const prepareReviewLoopSlides = (wrapper, cards) => {
  const existingCopies = [...wrapper.querySelectorAll('[data-review-loop-copy]')];
  const copiesCount = cards.length * (REVIEW_LOOP_SETS - 1);
  const fragment = document.createDocumentFragment();

  for (let index = existingCopies.length; index < copiesCount; index += 1) {
    const clone = cards[index % cards.length]?.cloneNode(true);

    if (!clone) continue;

    clone.removeAttribute('data-review-card');
    clone.setAttribute('data-review-loop-copy', '');
    fragment.append(clone);
  }

  wrapper.append(fragment);
};

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
    const wrapper = sliderElement?.querySelector('.swiper-wrapper');
    const score = section.querySelector('[data-review-score]');
    const cards = [...section.querySelectorAll('[data-review-card]')];
    const controls = [...section.querySelectorAll('[data-review-control]')];
    const indicator = section.querySelector('[data-review-indicator]');
    const previousButton = section.querySelector('[data-review-prev]');
    const nextButton = section.querySelector('[data-review-next]');

    if (
      !sliderElement ||
      !wrapper ||
      !score ||
      !cards.length ||
      controls.length !== cards.length ||
      !previousButton ||
      !nextButton
    ) {
      return;
    }

    let slider = null;
    let activeState = mobileQuery.matches ? { type: 'score' } : { type: 'review', index: 0 };
    const scoreAnchor = document.createComment('reviews-score-anchor');

    score.before(scoreAnchor);
    cards.forEach((card, index) => {
      card.dataset.reviewIndex = String(index);
    });
    prepareReviewLoopSlides(wrapper, cards);

    const getReviewIndex = (slide) => {
      const index = Number(slide?.dataset.reviewIndex);

      return Number.isInteger(index) ? index : -1;
    };

    const readActiveState = () => {
      if (!slider || slider.destroyed) {
        return activeState;
      }

      const activeSlide = slider.slides[slider.activeIndex];

      if (activeSlide?.hasAttribute('data-review-score')) {
        return { type: 'score' };
      }

      const reviewIndex = getReviewIndex(activeSlide);

      return reviewIndex >= 0 ? { type: 'review', index: reviewIndex } : activeState;
    };

    const syncState = (swiper) => {
      const activeSlide = swiper.slides[swiper.activeIndex];
      const reviewIndex = getReviewIndex(activeSlide);
      const hasActiveReview = reviewIndex >= 0;

      setActiveReview(controls, hasActiveReview ? reviewIndex : -1);
      indicator?.classList.toggle('is-hidden', !hasActiveReview);

      if (hasActiveReview) {
        activeState = { type: 'review', index: reviewIndex };
        moveIndicator(indicator, controls, reviewIndex);
      } else {
        activeState = { type: 'score' };
      }
    };

    const placeScore = (isMobileMode) => {
      if (isMobileMode) {
        score.classList.add('swiper-slide');
        wrapper.prepend(score);
        return;
      }

      score.classList.remove('swiper-slide');
      score.removeAttribute('data-swiper-slide-index');
      score.removeAttribute('role');
      score.removeAttribute('aria-roledescription');
      score.setAttribute('aria-label', scoreLabel);
      scoreAnchor.after(score);
    };

    const createSlider = (preservedState, isFirstBuild = false) => {
      const isMobileMode = mobileQuery.matches;
      let initialSlide = 0;

      placeScore(isMobileMode);
      const slidesCount = wrapper.children.length;
      const loopAdditionalSlides = Math.min(REVIEW_LOOP_BUFFER, Math.max(0, slidesCount - 2));

      if (!isFirstBuild && preservedState.type === 'review') {
        initialSlide = preservedState.index + Number(isMobileMode);
      }

      slider = new Swiper(sliderElement, {
        modules: [A11y, Keyboard, Navigation],
        a11y: {
          enabled: true,
          firstSlideMessage: 'Это первая карточка',
          lastSlideMessage: 'Это последняя карточка',
          nextSlideMessage: 'Следующая карточка',
          prevSlideMessage: 'Предыдущая карточка',
        },
        initialSlide,
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        loop: slidesCount > 1,
        loopAdditionalSlides,
        navigation: {
          nextEl: nextButton,
          prevEl: previousButton,
        },
        slidesPerView: isMobileMode ? 1 : 'auto',
        spaceBetween: 16,
        speed: motionQuery.matches ? 0 : 650,
        watchOverflow: true,
        on: {
          init: syncState,
          resize: syncState,
          slideChange: syncState,
        },
      });
    };

    const rebuildSlider = (isFirstBuild = false) => {
      const preservedState = readActiveState();

      if (slider && !slider.destroyed) {
        slider.destroy(true, true);
        slider = null;
      }

      createSlider(preservedState, isFirstBuild);
    };

    controls.forEach((control, index) => {
      control.addEventListener('click', () => {
        if (!slider || slider.destroyed) {
          return;
        }

        const card = cards[index];
        const loopIndex = Number(card.dataset.swiperSlideIndex);

        if (slider.params.loop && Number.isInteger(loopIndex)) {
          slider.slideToLoop(loopIndex);
          return;
        }

        slider.slideTo(slider.slides.indexOf(card));
      });
    });

    mobileQuery.addEventListener('change', () => rebuildSlider());
    rebuildSlider(true);
  });
}
