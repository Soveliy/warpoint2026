import { Fancybox } from '@fancyapps/ui/dist/fancybox/fancybox.js';
import previewVideoUrl from '../../video/video_preview.mp4?url';
import { defaultLocationState, getLocation } from '../data/location-data.js';
import { zoneVideos } from '../data/zone-videos.js';

const fancyboxSelector = '[data-fancybox]';
const bloggerVideoSelector = '[data-blogger-video]';

function prepareBloggerVideos() {
  document.querySelectorAll(bloggerVideoSelector).forEach((button, index) => {
    button.dataset.fancybox = `blogger-video-${index + 1}`;
    button.dataset.src = previewVideoUrl;
    button.dataset.type = 'html5video';
  });
}

function prepareZoneVideos(location) {
  document.querySelectorAll('[data-zone-video]').forEach((button) => {
    const zone = button.dataset.zoneVideo;
    const source = location?.zoneVideos?.[zone] || zoneVideos[zone];

    button.dataset.fancybox = `zone-video-${zone}`;
    button.dataset.src = source || previewVideoUrl;
    // Fancybox detects YouTube, Vimeo and direct video URLs automatically.
    if (source) delete button.dataset.type;
    else button.dataset.type = 'html5video';
  });
}

export function initFancybox() {
  prepareBloggerVideos();
  const { country, city, location } = document.documentElement.dataset;
  prepareZoneVideos(
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
    prepareZoneVideos(event.detail.location || getLocation(event.detail));
  });

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
