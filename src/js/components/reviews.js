import Swiper from 'swiper';
import { A11y, Keyboard, Navigation } from 'swiper/modules';
import { defaultLocationState, getLocation } from '../data/location-data.js';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function initReviews() {
  const reviewLinks = [...document.querySelectorAll('.reviews__service[data-review-link]')].map(
    (link) => ({ link, defaultUrl: link.getAttribute('href') }),
  );
  const updateReviewLinks = (location) => {
    reviewLinks.forEach(({ link, defaultUrl }) => {
      const locationUrl = location?.reviewLinks?.[link.dataset.reviewLink];
      // Keep the URL supplied in the markup until this club has its own review page.
      const url = /^https?:\/\//i.test(locationUrl || '') ? locationUrl : defaultUrl;
      if (url && /^https?:\/\//i.test(url)) link.href = url;
      else link.removeAttribute('href');
    });
  };
  const { country, city, location } = document.documentElement.dataset;
  updateReviewLinks(
    getLocation(
      location
        ? {
            countryId: country,
            cityName: city,
            locationId: location,
          }
        : defaultLocationState,
    ),
  );
  document.addEventListener('warpoint:location-change', (event) => {
    updateReviewLinks(event.detail.location || getLocation(event.detail));
  });

  document.querySelectorAll('[data-reviews]').forEach((section) => {
    const sliderElement = section.querySelector('[data-reviews-slider]');
    const wrapper = sliderElement?.querySelector('.swiper-wrapper');
    const cards = [...section.querySelectorAll('[data-review-card]')];

    if (!wrapper || sliderElement.swiper || !cards.length) return;

    // Keep enough cards for a continuous loop on wide screens.
    if (!wrapper.querySelector('[data-review-loop-copy]')) {
      for (let set = 1; set < 3; set += 1) {
        cards.forEach((card) => {
          const clone = card.cloneNode(true);
          clone.removeAttribute('data-review-card');
          clone.setAttribute('data-review-loop-copy', '');
          wrapper.append(clone);
        });
      }
    }

    new Swiper(sliderElement, {
      modules: [A11y, Keyboard, Navigation],
      a11y: {
        enabled: true,
        nextSlideMessage: 'Следующий отзыв',
        prevSlideMessage: 'Предыдущий отзыв',
      },
      keyboard: { enabled: true, onlyInViewport: true },
      loop: cards.length > 1,
      loopAdditionalSlides: 4,
      navigation: {
        prevEl: section.querySelector('[data-review-prev]'),
        nextEl: section.querySelector('[data-review-next]'),
      },
      slidesPerView: 'auto',
      spaceBetween: 16,
      speed: motionQuery.matches ? 0 : 650,
      watchOverflow: true,
    });
  });
}
