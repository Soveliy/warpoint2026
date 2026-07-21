import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getSmoothScroll } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const desktopQuery = '(min-width: 48rem) and (prefers-reduced-motion: no-preference)';
const stepDuration = 0.72;
const stepEase = gsap.parseEase('power2.inOut');

function setActiveSlide(slides, activeIndex) {
  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === activeIndex);
  });
}

function setupSequence(root) {
  const track = root.querySelector('[data-zone-sequence-track]');
  const slides = track ? [...track.children].filter((item) => item.matches('.zone')) : [];
  const rows = slides.map((slide) => slide.querySelector('.zone__row'));
  const leftItems = rows.map((row) => row?.children[0]).filter(Boolean);
  const rightItems = rows.map((row) => row?.children[1]).filter(Boolean);

  if (
    !track ||
    slides.length < 2 ||
    leftItems.length !== slides.length ||
    rightItems.length !== slides.length
  ) {
    return null;
  }

  let activeIndex = 0;
  let targetIndex = 0;
  let isAnimating = false;
  let inputReady = true;
  let observer = null;
  let fallbackTween = null;
  const lastIndex = slides.length - 1;
  const getDistance = () => (slides.length - 1) * root.clientHeight;
  const getStep = () => root.clientHeight;

  const syncState = (trigger) => {
    const nextIndex = Math.round(trigger.progress * lastIndex);

    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      setActiveSlide(slides, activeIndex);
    }

    if (!isAnimating) {
      targetIndex = nextIndex;
    }
  };

  const setCapture = (enabled) => {
    if (!observer) {
      return;
    }

    if (enabled) {
      inputReady = true;
      root.setAttribute('data-lenis-prevent-touch', '');
      root.setAttribute('data-lenis-prevent-wheel', '');
      observer.enable();
      return;
    }

    observer.disable();
    root.removeAttribute('data-lenis-prevent-touch');
    root.removeAttribute('data-lenis-prevent-wheel');
  };

  const scrollTo = (target, onComplete) => {
    const smoothScroll = getSmoothScroll();

    if (smoothScroll) {
      smoothScroll.scrollTo(target, {
        duration: stepDuration,
        easing: stepEase,
        force: true,
        lock: true,
        onComplete,
      });
      return;
    }

    const scrollState = { value: window.scrollY };

    fallbackTween?.kill();
    fallbackTween = gsap.to(scrollState, {
      value: target,
      duration: stepDuration,
      ease: 'power2.inOut',
      onComplete,
      onUpdate: () => window.scrollTo(0, scrollState.value),
    });
  };

  root.classList.add('zones-wrap--animated');
  setActiveSlide(slides, activeIndex);

  const timeline = gsap.timeline({
    scrollTrigger: {
      anticipatePin: 1,
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onEnter: () => setCapture(true),
      onEnterBack: () => setCapture(true),
      onLeave: () => setCapture(false),
      onLeaveBack: () => setCapture(false),
      onRefresh: syncState,
      onUpdate: syncState,
      pin: true,
      refreshPriority: 30,
      scrub: true,
      start: 'top top',
      trigger: root,
    },
  });

  timeline.fromTo(
    leftItems,
    {
      y: (index) => -index * getStep(),
    },
    {
      y: (index) => (lastIndex - index) * getStep(),
      duration: 1,
      ease: 'none',
      force3D: true,
    },
    0,
  );

  timeline.fromTo(
    rightItems,
    {
      y: (index) => index * getStep(),
    },
    {
      y: (index) => (index - lastIndex) * getStep(),
      duration: 1,
      ease: 'none',
      force3D: true,
    },
    0,
  );

  const trigger = timeline.scrollTrigger;

  const finishStep = () => {
    isAnimating = false;
    activeIndex = targetIndex;
    setActiveSlide(slides, activeIndex);
  };

  const moveToState = (direction) => {
    if (isAnimating || !trigger) {
      return;
    }

    const nextIndex = targetIndex + direction;

    if (nextIndex < 0 || nextIndex > lastIndex) {
      isAnimating = true;
      setCapture(false);
      scrollTo(direction > 0 ? trigger.end + 2 : trigger.start - 2, () => {
        isAnimating = false;
      });
      return;
    }

    isAnimating = true;
    targetIndex = nextIndex;

    const targetScroll = trigger.start + (trigger.end - trigger.start) * (targetIndex / lastIndex);

    scrollTo(targetScroll, finishStep);
  };

  observer = ScrollTrigger.observe({
    allowClicks: true,
    dragMinimum: 8,
    lockAxis: true,
    onChangeY: (self) => {
      const inputDirection = Math.sign(self.deltaY);

      if (!inputDirection || !inputReady) {
        return;
      }

      inputReady = false;
      const direction = self.event.type === 'wheel' ? inputDirection : -inputDirection;
      moveToState(direction);
    },
    onStop: () => {
      inputReady = true;
    },
    onStopDelay: 0.18,
    preventDefault: true,
    target: root,
    tolerance: 10,
    type: 'wheel,touch',
  });

  observer.disable();

  if (trigger?.isActive) {
    setCapture(true);
  }

  return () => {
    setCapture(false);
    observer?.kill();
    fallbackTween?.kill();
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set([...leftItems, ...rightItems], { clearProps: 'transform' });
    slides.forEach((slide) => slide.classList.remove('is-active'));
    root.classList.remove('zones-wrap--animated');
  };
}

export function initZoneSequence() {
  const roots = [...document.querySelectorAll('[data-zone-sequence]')];

  if (!roots.length) {
    return;
  }

  const media = gsap.matchMedia();

  media.add(desktopQuery, () => {
    const cleanupCallbacks = roots.map(setupSequence).filter(Boolean);

    ScrollTrigger.refresh();

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  });
}
