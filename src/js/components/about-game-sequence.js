import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = '(prefers-reduced-motion: no-preference)';

function getDirectSpans(element) {
  if (!element) return [];

  const spans = [...element.children].filter((child) => child.matches('span'));

  return spans.length ? spans : [element];
}

function setupSectionReveals(sections) {
  const cleanups = sections.map((section, sectionIndex) => {
    const visuals = [...section.querySelectorAll('.about-game__visual, .about-game__character')];
    const titleParts = getDirectSpans(section.querySelector('.about-game__title'));
    const descriptionParts = getDirectSpans(section.querySelector('.about-game__desc'));
    const animatedElements = [...visuals, ...titleParts, ...descriptionParts];
    const isImmersion = section.classList.contains('about-game--immersion');
    const sideDirection = sectionIndex === 0 ? 1 : -1;

    if (!animatedElements.length) return null;

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        gsap.set(visuals, {
          clearProps: 'opacity,transform,transformOrigin,visibility,willChange',
        });
        gsap.set([...titleParts, ...descriptionParts], {
          clearProps: 'clipPath,opacity,transform,visibility,willChange',
        });
      },
    });

    visuals.forEach((visual, visualIndex) => {
      timeline.to(
        visual,
        {
          autoAlpha: 1,
          duration: 0.92,
          ease: 'power3.out',
          scale: 1,
          x: 0,
          y: 0,
        },
        visualIndex * 0.08,
      );
    });

    timeline
      .to(
        titleParts,
        {
          autoAlpha: 1,
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.68,
          ease: 'power3.out',
          stagger: 0.07,
          y: 0,
        },
        0.14,
      )
      .to(
        descriptionParts,
        {
          autoAlpha: 1,
          duration: 0.58,
          ease: 'power3.out',
          stagger: 0.045,
          y: 0,
        },
        0.4,
      );

    const reset = () => {
      timeline.pause(0);

      visuals.forEach((visual) => {
        const characterDirection = visual.classList.contains('about-game__character--left')
          ? -1
          : visual.classList.contains('about-game__character--right')
            ? 1
            : sideDirection;

        gsap.set(visual, {
          autoAlpha: 0,
          scale: 0.9,
          transformOrigin: '50% 100%',
          willChange: 'transform, opacity',
          x: isImmersion ? characterDirection * 56 : characterDirection * 82,
          y: () => Math.min(window.innerHeight * 0.24, 190),
        });
      });

      gsap.set(titleParts, {
        autoAlpha: 0,
        clipPath: 'inset(0 0 100% 0)',
        willChange: 'transform, opacity, clip-path',
        y: 48,
      });
      gsap.set(descriptionParts, {
        autoAlpha: 0,
        willChange: 'transform, opacity',
        y: 28,
      });
    };

    const play = () => {
      reset();
      timeline.play(0);
    };

    reset();

    const trigger = ScrollTrigger.create({
      end: 'bottom 24%',
      onEnter: play,
      onEnterBack: play,
      onLeave: reset,
      onLeaveBack: reset,
      start: 'top 76%',
      trigger: section,
    });

    if (trigger.isActive) {
      play();
    }

    return () => {
      trigger.kill();
      timeline.kill();
      gsap.set(animatedElements, {
        clearProps: 'clipPath,opacity,transform,transformOrigin,visibility,willChange',
      });
    };
  });

  return () => cleanups.forEach((cleanup) => cleanup?.());
}

export function initAboutGameSequence() {
  const sections = [...document.querySelectorAll('.main > .about-game')];

  if (sections.length < 2) return;

  const media = gsap.matchMedia();

  media.add(motionQuery, () => {
    const cleanup = setupSectionReveals(sections);

    ScrollTrigger.refresh();

    return cleanup;
  });
}
