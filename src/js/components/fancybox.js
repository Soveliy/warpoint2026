import { Fancybox } from '@fancyapps/ui/dist/fancybox/fancybox.js';
import previewVideoUrl from '../../video/video_preview.mp4?url';

const fancyboxSelector = '[data-fancybox]';
const bloggerVideoSelector = '[data-blogger-video]';
const promoVideoSelector = '[data-promo-video]';

function preparePromoVideo() {
  document.querySelectorAll(promoVideoSelector).forEach((button) => {
    button.dataset.fancybox = 'promo-video';
    button.dataset.src = previewVideoUrl;
    button.dataset.type = 'html5video';
  });
}

function prepareBloggerVideos() {
  document.querySelectorAll(bloggerVideoSelector).forEach((button, index) => {
    button.dataset.fancybox = `blogger-video-${index + 1}`;
    button.dataset.src = previewVideoUrl;
    button.dataset.type = 'html5video';
  });
}

export function initFancybox() {
  preparePromoVideo();
  prepareBloggerVideos();

  if (!document.querySelector(fancyboxSelector)) {
    return;
  }

  Fancybox.unbind(fancyboxSelector);
  Fancybox.bind(fancyboxSelector, {
    Carousel: {
      Video: {
        autoplay: true,
      },
    },
    placeFocusBack: true,
  });
}
