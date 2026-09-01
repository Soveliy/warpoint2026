import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = '(prefers-reduced-motion: no-preference)';
const mobileQuery = '(max-width: 47.9375rem)';

function setupVideoParallax(section, { distance, scale }) {
  const image = section.querySelector('.video-section__background');

  if (!image) return null;

  gsap.set(image, {
    transformOrigin: '50% 50%',
    willChange: 'transform',
  });

  const tween = gsap.fromTo(
    image,
    {
      scale,
      yPercent: -distance,
    },
    {
      ease: 'none',
      force3D: true,
      scale,
      scrollTrigger: {
        end: 'bottom top',
        invalidateOnRefresh: true,
        scrub: true,
        start: 'top bottom',
        trigger: section,
      },
      yPercent: distance,
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(image, { clearProps: 'transform,transformOrigin,willChange' });
  };
}

export function initVideoParallax() {
  const sections = [...document.querySelectorAll('.video-section')];

  if (!sections.length) return;

  const media = gsap.matchMedia();

  media.add(
    {
      mobile: mobileQuery,
      motion: motionQuery,
    },
    ({ conditions }) => {
      if (!conditions.motion) return undefined;

      const settings = conditions.mobile
        ? { distance: 2, scale: 1.06 }
        : { distance: 4, scale: 1.1 };
      const cleanups = sections.map((section) => setupVideoParallax(section, settings));

      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
  );
}
