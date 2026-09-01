import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = '(prefers-reduced-motion: no-preference)';
const desktopQuery = '(min-width: 64.0625rem)';
const hoverQuery = '(hover: hover) and (pointer: fine)';
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
  const visual = section.querySelector('.about-game__visual-wrap');
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
  const visual = section.querySelector('.about-game__visual-wrap');
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

function setupSceneInteractions(section) {
  const scene = section.querySelector('[data-about-game-scene]');
  const model = scene?.querySelector('.about-game__visual-model');
  const aura = scene?.querySelector('.about-game__visual-aura');
  const shadow = scene?.querySelector('.about-game__visual-shadow');
  const light = scene?.querySelector('.about-game__visual-light');
  const girl = scene?.querySelector('.about-game__character--girl');
  const boy = scene?.querySelector('.about-game__character--boy');
  const states = [...(scene?.querySelectorAll('[data-about-scene-state]') ?? [])];
  const benefits = [...section.querySelectorAll('[data-about-benefit]')];
  const stateMap = new Map(states.map((state) => [state.dataset.aboutSceneState, state]));
  const familyState = stateMap.get('family');

  if (!scene || !model || !aura || !shadow || !light || !familyState || !benefits.length) {
    return null;
  }

  const entranceByState = {
    family: { rotationY: -3, scale: 0.975, x: 16, y: 12, z: -18 },
    immersion: { rotationX: 3.5, scale: 0.965, x: 0, y: 18, z: -28 },
    team: { rotationY: 4, rotationZ: -0.5, scale: 0.965, x: -18, y: 16, z: -26 },
  };
  const poseByState = {
    family: { rotationX: -0.3, rotationY: -2, rotationZ: 0.18, scale: 1.006, x: 5, y: -4, z: 30 },
    immersion: { rotationX: -1.5, rotationY: 0.25, rotationZ: 0, scale: 1.012, x: 0, y: -8, z: 48 },
    team: { rotationX: -0.5, rotationY: 2, rotationZ: -0.25, scale: 1.009, x: -6, y: -6, z: 38 },
  };
  const sceneElements = [model, aura, shadow, light, ...states, girl, boy].filter(Boolean);
  const glitchHost = document.createElement('div');
  const listenerCleanups = [];
  let activeFloat = null;
  let activeState = 'family';
  let idleTween = null;
  let resetTimer = 0;
  let sceneIsVisible = false;
  let transitionTimeline = null;
  let visibilityTrigger = null;

  glitchHost.className = 'about-game__glitch-layers';
  glitchHost.setAttribute('aria-hidden', 'true');
  model.append(glitchHost);

  const stopFloat = () => {
    activeFloat?.kill();
    activeFloat = null;
  };

  const stopIdle = () => {
    idleTween?.kill();
    idleTween = null;
  };

  const clearGlitch = () => {
    glitchHost.replaceChildren();
  };

  const stopTransition = () => {
    transitionTimeline?.kill();
    transitionTimeline = null;
    clearGlitch();
  };

  const createGlitchLayers = (targetState) => {
    clearGlitch();

    const createLayer = (variant) => {
      const layer = targetState.cloneNode(true);

      layer.removeAttribute('data-about-scene-state');
      layer.removeAttribute('style');
      layer.classList.remove('is-active');
      layer.classList.add('about-game__glitch-layer', `about-game__glitch-layer--${variant}`);
      layer.setAttribute('aria-hidden', 'true');
      layer.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
      layer.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      layer.querySelectorAll('img').forEach((image) => image.setAttribute('alt', ''));

      return layer;
    };

    const layers = [createLayer('red'), createLayer('cyan')];

    glitchHost.append(...layers);

    return layers;
  };

  const addGlitch = (timeline, targetState, position = 0) => {
    const [redLayer, cyanLayer] = createGlitchLayers(targetState);

    timeline.set(
      [redLayer, cyanLayer],
      {
        autoAlpha: 0,
        clipPath: 'inset(0 0 100% 0)',
        x: 0,
      },
      position,
    );

    timeline
      .to(
        redLayer,
        {
          autoAlpha: 0.38,
          clipPath: 'inset(7% 0 67% 0)',
          duration: 0.04,
          ease: 'none',
          x: 9,
        },
        position,
      )
      .to(
        redLayer,
        {
          autoAlpha: 0.28,
          clipPath: 'inset(59% 0 13% 0)',
          duration: 0.05,
          ease: 'none',
          x: -6,
        },
        position + 0.04,
      )
      .to(
        redLayer,
        {
          autoAlpha: 0.3,
          clipPath: 'inset(31% 0 43% 0)',
          duration: 0.055,
          ease: 'none',
          x: 5,
        },
        position + 0.09,
      )
      .to(
        redLayer,
        {
          autoAlpha: 0,
          clipPath: 'inset(74% 0 7% 0)',
          duration: 0.1,
          ease: 'power2.out',
          x: 0,
        },
        position + 0.145,
      )
      .to(
        cyanLayer,
        {
          autoAlpha: 0.3,
          clipPath: 'inset(64% 0 9% 0)',
          duration: 0.045,
          ease: 'none',
          x: -8,
        },
        position + 0.018,
      )
      .to(
        cyanLayer,
        {
          autoAlpha: 0.24,
          clipPath: 'inset(18% 0 56% 0)',
          duration: 0.05,
          ease: 'none',
          x: 7,
        },
        position + 0.063,
      )
      .to(
        cyanLayer,
        {
          autoAlpha: 0.26,
          clipPath: 'inset(45% 0 28% 0)',
          duration: 0.055,
          ease: 'none',
          x: -4,
        },
        position + 0.113,
      )
      .to(
        cyanLayer,
        {
          autoAlpha: 0,
          clipPath: 'inset(9% 0 72% 0)',
          duration: 0.1,
          ease: 'power2.out',
          x: 0,
        },
        position + 0.168,
      )
      .call(clearGlitch, [], position + 0.29);
  };

  const startIdle = () => {
    stopIdle();
    if (!sceneIsVisible) return;

    idleTween = gsap.to(model, {
      duration: 4.2,
      ease: 'sine.inOut',
      repeat: -1,
      y: -3,
      yoyo: true,
    });
  };

  const startStateFloat = (name, state) => {
    stopFloat();

    if (name === 'immersion' && girl && boy) {
      activeFloat = gsap
        .timeline({ repeat: -1, yoyo: true })
        .to(girl, { duration: 2.8, ease: 'sine.inOut', rotationZ: -0.35, y: -5 }, 0)
        .to(boy, { duration: 2.5, ease: 'sine.inOut', rotationZ: 0.4, y: 4 }, 0);
    } else {
      activeFloat = gsap.to(state, {
        duration: name === 'team' ? 3.2 : 3.6,
        ease: 'sine.inOut',
        repeat: -1,
        rotationZ: name === 'team' ? 0.12 : -0.1,
        y: -3,
        yoyo: true,
      });
    }

    if (!sceneIsVisible) activeFloat.pause();
  };

  const setStateClasses = (name) => {
    states.forEach((state) => {
      state.classList.toggle('is-active', state.dataset.aboutSceneState === name);
    });
  };

  const activateBenefit = (benefit) => {
    const name = benefit.dataset.aboutBenefit;
    const targetState = stateMap.get(name);

    if (!targetState) return;

    window.clearTimeout(resetTimer);
    resetTimer = 0;
    stopIdle();
    stopFloat();
    stopTransition();
    gsap.killTweensOf(sceneElements);

    benefits.forEach((item) => item.classList.toggle('is-active', item === benefit));
    section.classList.add('has-active-benefit');
    scene.dataset.aboutSceneState = name;

    const isAlreadyVisible = activeState === name;
    const shouldGlitch = activeState !== name;
    const targetOpacity = Number(gsap.getProperty(targetState, 'opacity'));
    const inactiveStates = states.filter((state) => state !== targetState);

    activeState = name;
    targetState.classList.add('is-active');

    transitionTimeline = gsap.timeline({
      defaults: { overwrite: true },
      onComplete: () => {
        clearGlitch();
        setStateClasses(name);
        gsap.set(inactiveStates, {
          autoAlpha: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        });
        transitionTimeline = null;
        if (activeState === name) startStateFloat(name, targetState);
      },
    });
    const timeline = transitionTimeline;

    if (shouldGlitch) addGlitch(timeline, targetState);

    timeline.to(
      inactiveStates,
      {
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        scale: 0.985,
        y: 7,
      },
      0,
    );

    if (isAlreadyVisible || targetOpacity > 0.01) {
      timeline.to(
        targetState,
        {
          autoAlpha: 1,
          duration: 0.58,
          ease: 'power3.out',
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        },
        0,
      );
    } else {
      timeline.fromTo(
        targetState,
        { autoAlpha: 0, ...entranceByState[name] },
        {
          autoAlpha: 1,
          duration: 0.88,
          ease: 'power4.out',
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        },
        0.04,
      );
    }

    timeline
      .to(model, { duration: 0.96, ease: 'power3.out', ...poseByState[name] }, 0)
      .to(
        aura,
        {
          duration: 0.9,
          ease: 'power2.out',
          opacity: name === 'immersion' ? 0.5 : 0.36,
          scale: name === 'immersion' ? 1.12 : 1.04,
          x: name === 'team' ? -6 : name === 'family' ? 6 : 0,
          y: name === 'immersion' ? -4 : 0,
        },
        0,
      )
      .to(
        shadow,
        {
          duration: 0.9,
          ease: 'power2.out',
          opacity: name === 'immersion' ? 0.34 : 0.48,
          scaleX: name === 'immersion' ? 0.84 : 0.95,
          scaleY: name === 'immersion' ? 0.82 : 0.92,
        },
        0,
      )
      .to(
        light,
        {
          duration: 0.78,
          ease: 'power2.out',
          opacity: name === 'immersion' ? 0.36 : 0.22,
          scale: name === 'immersion' ? 1.08 : 1.02,
          x: name === 'team' ? -5 : name === 'family' ? 5 : 0,
          y: name === 'immersion' ? -6 : 0,
        },
        0.08,
      );
  };

  const resetScene = () => {
    const shouldGlitch = activeState !== 'family';
    const familyIsVisible =
      activeState === 'family' || Number(gsap.getProperty(familyState, 'opacity')) > 0.01;
    const inactiveStates = states.filter((state) => state !== familyState);

    stopFloat();
    stopIdle();
    stopTransition();
    gsap.killTweensOf(sceneElements);
    activeState = 'family';
    scene.dataset.aboutSceneState = 'family';
    section.classList.remove('has-active-benefit');
    benefits.forEach((benefit) => benefit.classList.remove('is-active'));
    familyState.classList.add('is-active');

    transitionTimeline = gsap.timeline({
      defaults: { overwrite: true },
      onComplete: () => {
        clearGlitch();
        setStateClasses('family');
        gsap.set(inactiveStates, {
          autoAlpha: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        });
        transitionTimeline = null;
        startIdle();
      },
    });
    const timeline = transitionTimeline;

    if (shouldGlitch) addGlitch(timeline, familyState);

    timeline.to(
      inactiveStates,
      {
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        scale: 0.985,
        y: 7,
      },
      0,
    );

    if (familyIsVisible) {
      timeline.to(
        familyState,
        {
          autoAlpha: 1,
          duration: 0.62,
          ease: 'power3.out',
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        },
        0,
      );
    } else {
      timeline.fromTo(
        familyState,
        { autoAlpha: 0, ...entranceByState.family },
        {
          autoAlpha: 1,
          duration: 0.88,
          ease: 'power4.out',
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        },
        0.04,
      );
    }

    timeline
      .to(
        [girl, boy].filter(Boolean),
        {
          duration: 0.64,
          ease: 'power2.out',
          rotationZ: 0,
          x: 0,
          y: 0,
        },
        0,
      )
      .to(
        model,
        {
          duration: 0.96,
          ease: 'power3.out',
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          x: 0,
          y: 0,
          z: 0,
        },
        0,
      )
      .to(
        aura,
        {
          duration: 0.9,
          ease: 'power2.out',
          opacity: 0.24,
          scale: 0.94,
          x: 0,
          y: 0,
        },
        0,
      )
      .to(
        shadow,
        {
          duration: 0.9,
          ease: 'power2.out',
          opacity: 0.46,
          scaleX: 1,
          scaleY: 1,
        },
        0,
      )
      .to(
        light,
        {
          duration: 0.78,
          ease: 'power2.out',
          opacity: 0.08,
          scale: 1,
          x: 0,
          y: 0,
        },
        0.04,
      );
  };

  const scheduleReset = () => {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      const hasActiveBenefit = benefits.some((benefit) => benefit.matches(':hover'));

      if (!hasActiveBenefit) resetScene();
    }, 420);
  };

  gsap.set(states, { autoAlpha: 0 });
  gsap.set(familyState, { autoAlpha: 1 });
  section.classList.add('is-interactive');
  scene.dataset.aboutSceneState = 'family';
  visibilityTrigger = ScrollTrigger.create({
    end: 'bottom top',
    onToggle: ({ isActive }) => {
      sceneIsVisible = isActive;

      if (isActive) {
        if (activeFloat) activeFloat.resume();
        else if (!section.classList.contains('has-active-benefit')) startIdle();
      } else {
        stopIdle();
        activeFloat?.pause();
      }
    },
    start: 'top bottom',
    trigger: section,
  });
  sceneIsVisible = visibilityTrigger.isActive;
  if (sceneIsVisible) startIdle();

  benefits.forEach((benefit) => {
    const enter = () => activateBenefit(benefit);
    const leave = () => scheduleReset();

    benefit.addEventListener('mouseenter', enter);
    benefit.addEventListener('mouseleave', leave);
    listenerCleanups.push(() => {
      benefit.removeEventListener('mouseenter', enter);
      benefit.removeEventListener('mouseleave', leave);
    });
  });

  return () => {
    window.clearTimeout(resetTimer);
    stopFloat();
    stopIdle();
    stopTransition();
    visibilityTrigger?.kill();
    listenerCleanups.forEach((cleanup) => cleanup());
    gsap.killTweensOf(sceneElements);
    gsap.set(sceneElements, {
      clearProps: 'opacity,scale,transform,visibility',
    });
    states.forEach((state) => state.classList.toggle('is-active', state === familyState));
    benefits.forEach((benefit) => {
      benefit.classList.remove('is-active');
    });
    section.classList.remove('has-active-benefit', 'is-interactive');
    delete scene.dataset.aboutSceneState;
    glitchHost.remove();
  };
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
      hover: hoverQuery,
      motion: motionQuery,
    },
    ({ conditions }) => {
      if (!conditions.motion) return undefined;

      const cleanupReveal = conditions.desktop
        ? setupDesktopReveal(section)
        : setupCompactReveal(section);
      const cleanupParallax = conditions.desktop ? setupBackgroundParallax(group) : null;
      const cleanupInteractions =
        conditions.desktop && conditions.hover ? setupSceneInteractions(section) : null;

      ScrollTrigger.refresh();

      return () => {
        cleanupInteractions?.();
        cleanupParallax?.();
        cleanupReveal?.();
      };
    },
  );
}
