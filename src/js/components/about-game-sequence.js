import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = '(prefers-reduced-motion: no-preference)';
const desktopQuery = '(min-width: 64.0625rem)';
const revealProperties = 'clipPath,opacity,scale,transform,transformOrigin,visibility,willChange';

const getTitleLines = (section) => [...section.querySelectorAll('.about-game__title > span')];

const getBenefitParts = (benefits) =>
  benefits.map((benefit) => ({
    content: benefit.querySelector('.about-game__benefit-content'),
    number: benefit.querySelector('.about-game__number'),
  }));

const clearRevealStyles = (elements) => {
  gsap.set(elements.filter(Boolean), {
    clearProps: revealProperties,
  });
};

const addOnceTrigger = (timeline, triggerElement, start) => {
  let hasPlayed = false;
  const play = () => {
    if (hasPlayed) return;

    hasPlayed = true;
    timeline.play(0);
  };

  const trigger = ScrollTrigger.create({
    end: 'bottom top',
    onEnter: play,
    once: true,
    start,
    trigger: triggerElement,
  });

  if (trigger.isActive || trigger.progress > 0) {
    play();
  }

  return trigger;
};

function setupDesktopReveal(section) {
  const titleLines = getTitleLines(section);
  const lead = section.querySelector('.about-game__lead');
  const visual = section.querySelector('.about-game__visual');
  const benefits = [...section.querySelectorAll('.about-game__benefit')];
  const benefitParts = getBenefitParts(benefits);
  const animatedElements = [
    ...titleLines,
    lead,
    visual,
    ...benefits,
    ...benefitParts.flatMap(({ content, number }) => [content, number]),
  ];

  if (!titleLines.length || !visual || !benefits.length) return null;

  const context = gsap.context(() => {
    gsap.set(titleLines, {
      autoAlpha: 0,
      clipPath: 'inset(0 0 100% 0)',
      willChange: 'transform, opacity, clip-path',
      x: -44,
      y: 24,
    });
    gsap.set(lead, {
      autoAlpha: 0,
      scaleY: 0.78,
      transformOrigin: '0% 0%',
      willChange: 'transform, opacity',
      x: 28,
    });
    gsap.set(visual, {
      autoAlpha: 0,
      scale: 0.88,
      transformOrigin: '50% 88%',
      willChange: 'transform, opacity',
      x: 0,
      xPercent: -50,
      y: 64,
    });
    gsap.set(benefits, {
      autoAlpha: 0,
      willChange: 'opacity',
    });

    benefitParts.forEach(({ content, number }, index) => {
      const direction = index === 0 ? -1 : index === 2 ? 1 : 0;

      gsap.set(number, {
        autoAlpha: 0,
        scale: 0.92,
        transformOrigin: '50% 50%',
        willChange: 'transform, opacity',
        y: 8,
      });
      gsap.set(content, {
        autoAlpha: 0,
        willChange: 'transform, opacity',
        x: direction * 14,
        y: 8,
      });
    });

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => clearRevealStyles(animatedElements),
    });

    timeline
      .to(titleLines, {
        autoAlpha: 1,
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.76,
        ease: 'power4.out',
        stagger: 0.07,
        x: 0,
        y: 0,
      })
      .to(
        lead,
        {
          autoAlpha: 1,
          duration: 0.68,
          ease: 'power3.out',
          scaleY: 1,
          x: 0,
        },
        0.16,
      )
      .to(
        visual,
        {
          autoAlpha: 1,
          duration: 1.2,
          ease: 'power4.out',
          scale: 1,
          x: 0,
          xPercent: -50,
          y: 0,
        },
        0.22,
      );

    benefits.forEach((benefit, index) => {
      const { content, number } = benefitParts[index];
      const cardStart = 1.2 + index * 0.62;

      timeline
        .to(
          benefit,
          {
            autoAlpha: 1,
            duration: 0.68,
            ease: 'power2.out',
          },
          cardStart,
        )
        .to(
          number,
          {
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power3.out',
            scale: 1,
            y: 0,
          },
          cardStart + 0.18,
        )
        .to(
          content,
          {
            autoAlpha: 1,
            duration: 0.72,
            ease: 'power3.out',
            x: 0,
            y: 0,
          },
          cardStart + 0.22,
        );
    });

    addOnceTrigger(timeline, section, 'top 72%');
  }, section);

  return () => context.revert();
}

function setupCompactReveal(section) {
  const titleLines = getTitleLines(section);
  const lead = section.querySelector('.about-game__lead');
  const visual = section.querySelector('.about-game__visual');
  const benefits = [...section.querySelectorAll('.about-game__benefit')];
  const benefitParts = getBenefitParts(benefits);
  const context = gsap.context(() => {
    const headingElements = [...titleLines, lead, visual];

    gsap.set(titleLines, {
      autoAlpha: 0,
      clipPath: 'inset(0 0 100% 0)',
      willChange: 'transform, opacity, clip-path',
      x: -30,
      y: 20,
    });
    gsap.set(lead, {
      autoAlpha: 0,
      willChange: 'transform, opacity',
      x: 22,
    });
    gsap.set(visual, {
      autoAlpha: 0,
      scale: 0.92,
      transformOrigin: '50% 90%',
      willChange: 'transform, opacity',
      xPercent: 0,
      y: 48,
    });

    const headingTimeline = gsap.timeline({
      paused: true,
      onComplete: () => clearRevealStyles(headingElements),
    });

    headingTimeline
      .to(titleLines, {
        autoAlpha: 1,
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.7,
        ease: 'power4.out',
        stagger: 0.07,
        x: 0,
        y: 0,
      })
      .to(
        lead,
        {
          autoAlpha: 1,
          duration: 0.6,
          ease: 'power3.out',
          x: 0,
        },
        0.14,
      )
      .to(
        visual,
        {
          autoAlpha: 1,
          duration: 1,
          ease: 'power4.out',
          scale: 1,
          xPercent: 0,
          y: 0,
        },
        0.22,
      );

    addOnceTrigger(headingTimeline, section, 'top 78%');

    benefits.forEach((benefit, index) => {
      const { content, number } = benefitParts[index];
      const elements = [benefit, content, number];

      gsap.set(benefit, {
        autoAlpha: 0,
        willChange: 'opacity',
      });
      gsap.set(number, {
        autoAlpha: 0,
        scale: 0.94,
        willChange: 'transform, opacity',
        y: 6,
      });
      gsap.set(content, {
        autoAlpha: 0,
        willChange: 'transform, opacity',
        x: index % 2 === 0 ? -12 : 12,
        y: 8,
      });

      const timeline = gsap.timeline({
        paused: true,
        onComplete: () => {
          clearRevealStyles(elements);
        },
      });

      timeline
        .to(benefit, {
          autoAlpha: 1,
          duration: 0.62,
          ease: 'power2.out',
        })
        .to(
          number,
          {
            autoAlpha: 1,
            duration: 0.56,
            ease: 'power3.out',
            scale: 1,
            y: 0,
          },
          0.16,
        )
        .to(
          content,
          {
            autoAlpha: 1,
            duration: 0.68,
            ease: 'power3.out',
            x: 0,
            y: 0,
          },
          0.2,
        );

      addOnceTrigger(timeline, benefit, 'top 88%');
    });
  }, section);

  return () => context.revert();
}

function setupBackgroundParallax(group) {
  const image = group.querySelector('.about-game-group__background-image');

  if (!image) return null;

  const timeline = gsap.fromTo(
    image,
    { scale: 1.04, yPercent: -1.5 },
    {
      ease: 'none',
      scale: 1.04,
      scrollTrigger: {
        end: 'bottom top',
        invalidateOnRefresh: true,
        scrub: 0.8,
        start: 'top bottom',
        trigger: group,
      },
      yPercent: 1.5,
    },
  );

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set(image, { clearProps: 'transform' });
  };
}

export function initAboutGameSequence() {
  const group = document.querySelector('[data-about-game-group]');
  const section = group?.querySelector(':scope > .about-game');

  if (!group || !section) return;

  const media = gsap.matchMedia();

  media.add(
    {
      desktop: desktopQuery,
      motion: motionQuery,
    },
    ({ conditions }) => {
      if (!conditions.motion) return undefined;

      const cleanupReveal = conditions.desktop
        ? setupDesktopReveal(section)
        : setupCompactReveal(section);
      const cleanupParallax = conditions.desktop ? setupBackgroundParallax(group) : null;

      ScrollTrigger.refresh();

      return () => {
        cleanupParallax?.();
        cleanupReveal?.();
      };
    },
  );
}
