import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAboutGameSequence } from './components/about-game-sequence.js';
import { initAnimations } from './components/animations.js';
import { initBookingPanel } from './components/booking-panel.js';
import { initCallbackForms, initFaq } from './components/faq.js';
import { initCityConfirm } from './components/city-confirm.js';
import { initEventModal } from './components/event-modal.js';
import { initEventsSequence } from './components/events-sequence.js';
import { initFancybox } from './components/fancybox.js';
import { initGamesSequence } from './components/games-sequence.js';
import { initHeaderScroll } from './components/header-scroll.js';
import { initHeaderTheme } from './components/header-theme.js';
import { initLocationModal } from './components/location-modal.js';
import { initMobileMenu } from './components/mobile-menu.js';
import { initPageState } from './components/page-state.js';
import { initPhoneMasks } from './components/phone-mask.js';
import { initPixelTransitions } from './components/pixel-transition.js';
import { initPreloader } from './components/preloader.js';
import { initReviews } from './components/reviews.js';
import { initSliders } from './components/sliders.js';
import { initVideoParallax } from './components/video-parallax.js';
import { initYandexMaps } from './components/yandex-map.js';
import { initZoneSequence } from './components/zone-sequence.js';

ScrollTrigger.config({
  ignoreMobileResize: true,
});

initPreloader();
initPageState();
initHeaderScroll();
initHeaderTheme();
initMobileMenu();
initLocationModal();
initCityConfirm();
initEventModal();
initBookingPanel();
initPhoneMasks();
initFancybox();
initAnimations();
initVideoParallax();
initAboutGameSequence();
initZoneSequence();
initEventsSequence();
initReviews();
initPixelTransitions();
initSliders();
initGamesSequence();
initYandexMaps();
initFaq();
initCallbackForms();

let refreshFrame = null;

const refreshScrollAnimations = () => {
  if (refreshFrame !== null) {
    window.cancelAnimationFrame(refreshFrame);
  }

  refreshFrame = window.requestAnimationFrame(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    refreshFrame = null;
  });
};

refreshScrollAnimations();
document.fonts?.ready.then(refreshScrollAnimations);

if (document.readyState !== 'complete') {
  window.addEventListener('load', refreshScrollAnimations, { once: true });
}
