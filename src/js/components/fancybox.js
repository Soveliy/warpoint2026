import { Fancybox } from '@fancyapps/ui/dist/fancybox/fancybox.js';

import { getSmoothScroll } from './smooth-scroll.js';

const fancyboxSelector = '[data-fancybox]';

export function initFancybox() {
  if (!document.querySelector(fancyboxSelector)) {
    return;
  }

  Fancybox.unbind(fancyboxSelector);
  Fancybox.bind(fancyboxSelector, {
    placeFocusBack: true,
    on: {
      init: () => getSmoothScroll()?.stop(),
      destroy: () => getSmoothScroll()?.start(),
    },
  });
}
