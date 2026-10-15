import { toggleScrollLock } from '../_functions.js';

const details = {
  start: {
    included: ['VR-игры на арене', 'Продолжительность программы — 1 ч 45 мин'],
    benefits: ['Подходит для небольших компаний', 'Большой выбор VR-игр'],
  },
  basic: {
    included: [
      '60 минут на арене — погружение в виртуальную реальность, где каждый почувствует себя настоящим героем',
      'Координатор на всё время мероприятия',
      'Лаунж-зона: уютное пространство для отдыха и общения на всё время праздника',
      'Игровая приставка и настольные игры',
      'Поздравление для именинника от команды нашего VR-парка',
      'Памятный подарок имениннику',
      'Пригласительные для гостей',
    ],
    benefits: [
      '7 игр на выбор',
      '15 катаний на VR-аттракционах',
      'Украшение шарами (фонтаны из 3 гелиевых шаров)',
      'Бесплатные чай и кофе для ваших гостей',
    ],
  },
  standard: {
    included: ['VR-игры на арене', 'Продолжительность программы — 1 ч 45 мин'],
    benefits: ['Самый популярный тариф', 'Большой выбор VR-игр'],
  },
};

const generalBasicDetails = {
  included: ['VR-игры на арене', 'Продолжительность программы — 1 ч 45 мин'],
  benefits: ['Подходит для небольших компаний', 'Путешествие по виртуальным мирам'],
};

const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function initTariffModal() {
  const modal = document.querySelector('[data-tariff-modal]');
  if (!modal) return;

  const dialog = modal.querySelector('[data-tariff-dialog]');
  const tags = modal.querySelector('[data-tariff-tags]');
  const title = modal.querySelector('[data-tariff-title]');
  const description = modal.querySelector('[data-tariff-description]');
  const included = modal.querySelector('[data-tariff-included]');
  const benefits = modal.querySelector('[data-tariff-benefits]');
  const prices = modal.querySelector('[data-tariff-prices]');
  let activeTrigger = null;
  let wasScrollLocked = false;

  const fillList = (list, items) => {
    list.replaceChildren(
      ...items.map((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        return li;
      }),
    );
  };

  const closeModal = (restoreFocus = true) => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!wasScrollLocked) toggleScrollLock(false);
    if (restoreFocus) activeTrigger?.focus({ preventScroll: true });
    activeTrigger = null;
  };

  const openModal = (trigger) => {
    const card = trigger.closest('.event-tariffs__card');
    const isBirthday = card?.closest('[data-tariff-context]')?.dataset.tariffContext === 'birthday';
    const content =
      trigger.dataset.tariffOpen === 'basic' && !isBirthday
        ? generalBasicDetails
        : details[trigger.dataset.tariffOpen];
    if (!card || !content) return;

    activeTrigger = trigger;
    wasScrollLocked = document.documentElement.classList.contains('is-scroll-locked');
    tags.replaceChildren(
      ...[...card.querySelectorAll('.event-tariffs__card-tags span')].map((tag) =>
        tag.cloneNode(true),
      ),
    );
    title.textContent = card.querySelector('.event-tariffs__card-title')?.textContent.trim() || '';
    description.textContent =
      card.querySelector('.event-tariffs__card-description')?.textContent.trim() || '';
    prices.replaceChildren(
      ...[...card.querySelectorAll('.event-tariffs__card-prices > div')].map((price) =>
        price.cloneNode(true),
      ),
    );
    fillList(included, content.included);
    fillList(benefits, content.benefits);
    dialog.scrollTop = 0;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    toggleScrollLock(true);
    requestAnimationFrame(() => dialog.focus({ preventScroll: true }));
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-tariff-open]');
    if (trigger) openModal(trigger);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-tariff-close]')) {
      closeModal();
    } else if (event.target.closest('[data-tariff-request]')) {
      closeModal(false);
    }
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...dialog.querySelectorAll(focusableSelector)].filter(
      (element) => element.getClientRects().length,
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
