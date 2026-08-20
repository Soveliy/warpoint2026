import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = '(prefers-reduced-motion: no-preference)';

function setupCatalogReveal(catalog) {
  const cards = [...catalog.querySelectorAll('.game-card')];
  const controls = catalog.querySelector('.games-catalog__controls');

  if (!cards.length) return null;

  const reset = () => {
    gsap.set(cards, {
      autoAlpha: 0,
      transformOrigin: '50% 100%',
      willChange: 'transform, opacity',
      y: 180,
    });

    if (controls) {
      gsap.set(controls, {
        autoAlpha: 0,
        willChange: 'transform, opacity',
        y: 28,
      });
    }
  };

  const timeline = gsap
    .timeline({
      paused: true,
      onComplete: () => {
        gsap.set(cards, {
          clearProps: 'opacity,transform,transformOrigin,visibility,willChange',
        });

        if (controls) {
          gsap.set(controls, {
            clearProps: 'opacity,transform,visibility,willChange',
          });
        }
      },
    })
    .to(cards, {
      autoAlpha: 1,
      duration: 0.82,
      ease: 'power3.out',
      scale: 1,
      stagger: 0.07,
      y: 0,
    });

  if (controls) {
    timeline.to(
      controls,
      {
        autoAlpha: 1,
        duration: 0.48,
        ease: 'power2.out',
        y: 0,
      },
      0.4,
    );
  }

  const play = () => {
    timeline.pause(0);
    reset();
    timeline.play(0);
  };

  reset();

  const trigger = ScrollTrigger.create({
    end: 'bottom 20%',
    onEnter: play,
    onEnterBack: play,
    onLeaveBack: reset,
    start: 'top 88%',
    trigger: catalog,
  });

  if (trigger.isActive) play();

  return () => {
    trigger.kill();
    timeline.kill();
    gsap.set(controls ? [...cards, controls] : cards, {
      clearProps: 'opacity,transform,transformOrigin,visibility,willChange',
    });
  };
}

function setupBackgroundParallax(group) {
  const pattern = group.querySelector('.games-group__background-pattern');
  const gradient = group.querySelector('.games-group__background-gradient');

  if (!pattern || !gradient) return null;

  const timeline = gsap.timeline({
    scrollTrigger: {
      end: 'bottom top',
      invalidateOnRefresh: true,
      scrub: 0.6,
      start: 'top bottom',
      trigger: group,
    },
  });

  timeline
    .fromTo(pattern, { xPercent: -5, yPercent: -3 }, { ease: 'none', xPercent: 5, yPercent: 3 }, 0)
    .fromTo(
      gradient,
      { xPercent: 7, yPercent: -4 },
      { ease: 'none', xPercent: -7, yPercent: 4 },
      0,
    );

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set([pattern, gradient], { clearProps: 'transform' });
  };
}

export function initGamesSequence() {
  const group = document.querySelector('[data-games-group]');
  const catalog = group?.querySelector('.games-catalog');

  if (!group || !catalog) return;

  const media = gsap.matchMedia();

  media.add(
    {
      motion: motionQuery,
    },
    ({ conditions }) => {
      if (!conditions.motion) return undefined;

      const catalogCleanup = setupCatalogReveal(catalog);
      const backgroundCleanup = setupBackgroundParallax(group);

      ScrollTrigger.refresh();

      return () => {
        backgroundCleanup?.();
        catalogCleanup?.();
      };
    },
  );
}
