import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const revealProperties = 'opacity,translate,willChange';
let initialized = false;

export function initCardAnimations() {
  if (initialized) return;
  initialized = true;

  const media = gsap.matchMedia();

  media.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1025px)',
      mobile: '(max-width: 47.9375rem)',
    },
    ({ conditions }) => {
      const groups = [
        ['.events', conditions.desktop ? '.events__state' : '.events__slider'],
        ['.reviews', '.reviews__card, .reviews__score'],
        ['.bloggers', '.bloggers__media'],
      ];
      const gridCards = [...document.querySelectorAll('.gallery__item, .extras__item')];
      const animatedElements = new Set(gridCards);
      const triggers = [];
      let active = true;

      groups.forEach(([selector, cards]) => {
        document
          .querySelectorAll(`${selector} :is(${cards}, .slider-controls)`)
          .forEach((element) => {
            animatedElements.add(element);
          });
      });

      // Clear reveal styles that a carousel copy may have inherited during a resize.
      const clearStyles = () => {
        const elements = [...animatedElements];

        gsap.killTweensOf(elements, 'opacity,translate');
        gsap.set(elements, { clearProps: revealProperties });
      };

      clearStyles();
      if (!conditions.motion) return undefined;

      const reveal = (cards, controls = []) => {
        if (!active || !cards.length) return;

        const elements = [...cards, ...controls];
        elements.forEach((element) => animatedElements.add(element));
        gsap.killTweensOf(elements, 'opacity,translate');
        gsap.set(elements, { willChange: 'translate, opacity' });

        // Independent translate preserves the scale of blogger slides and carousel transforms.
        gsap.fromTo(
          cards,
          { opacity: 0, translate: '0px 180px' },
          {
            opacity: 1,
            translate: '0px 0px',
            duration: 0.82,
            ease: 'power3.out',
            stagger: 0.07,
            clearProps: revealProperties,
          },
        );

        if (controls.length) {
          gsap.fromTo(
            controls,
            { opacity: 0, translate: '0px 28px' },
            {
              opacity: 1,
              translate: '0px 0px',
              duration: 0.48,
              delay: 0.4,
              ease: 'power2.out',
              clearProps: revealProperties,
            },
          );
        }
      };

      groups.forEach(([selector, cardSelector]) => {
        document.querySelectorAll(selector).forEach((root) => {
          let hasPlayed = false;
          const play = () => {
            hasPlayed = true;
            const cards = [...root.querySelectorAll(cardSelector)];
            const controls = [...root.querySelectorAll('.slider-controls:not([hidden])')];

            reveal(cards, controls);
          };
          const trigger = ScrollTrigger.create({
            trigger: root,
            start: 'top 88%',
            end: 'bottom 20%',
            onEnter: play,
            onEnterBack: play,
          });

          triggers.push(trigger);
          if (trigger.isActive && !hasPlayed) play();
        });
      });

      if (gridCards.length) {
        triggers.push(
          ...ScrollTrigger.batch(gridCards, {
            start: 'top bottom',
            end: 'bottom top',
            interval: 0.07,
            onEnter: (cards) => reveal(cards),
            onEnterBack: (cards) => reveal(cards),
          }),
        );
      }

      return () => {
        active = false;
        triggers.forEach((trigger) => trigger.kill());
        clearStyles();
      };
    },
  );
}
