export function initEventAddons() {
  document.querySelectorAll('[data-event-addons]').forEach((section) => {
    const slides = [...section.querySelectorAll('[data-event-addons-slide]')];
    const steps = [...section.querySelectorAll('[data-event-addons-step]')];
    const previous = section.querySelector('[data-event-addons-prev]');
    const next = section.querySelector('[data-event-addons-next]');

    if (slides.length < 2 || slides.length !== steps.length || !previous || !next) return;

    let activeIndex = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains('is-active')),
    );

    const show = (index) => {
      if (index < 0 || index >= slides.length || index === activeIndex) return;

      slides[activeIndex].classList.remove('is-active');
      slides[activeIndex].setAttribute('aria-hidden', 'true');
      slides[activeIndex].inert = true;
      steps[activeIndex].classList.remove('is-active');
      steps[activeIndex].removeAttribute('aria-current');

      activeIndex = index;
      slides[activeIndex].classList.add('is-active');
      slides[activeIndex].removeAttribute('aria-hidden');
      slides[activeIndex].inert = false;
      steps[activeIndex].classList.add('is-active');
      steps[activeIndex].setAttribute('aria-current', 'true');
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === slides.length - 1;
    };

    previous.addEventListener('click', () => show(activeIndex - 1));
    next.addEventListener('click', () => show(activeIndex + 1));
    steps.forEach((step, index) => step.addEventListener('click', () => show(index)));

    section.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (
        !event.target.closest(
          '[data-event-addons-step], [data-event-addons-prev], [data-event-addons-next]',
        )
      )
        return;

      event.preventDefault();
      show(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });
  });
}
