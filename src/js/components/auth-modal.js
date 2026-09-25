import { toggleScrollLock } from '../_functions.js';
import { countries, getCountry } from '../data/location-data.js';

export function initAuthModal() {
  const modal = document.querySelector('[data-auth-modal]');

  if (!modal) {
    return;
  }

  const tabs = [...modal.querySelectorAll('[data-auth-tab]')];
  const forms = [...modal.querySelectorAll('[data-auth-form]')];
  const subtitle = modal.querySelector('[data-auth-subtitle]');
  const countrySelect = modal.querySelector('[data-auth-country]');
  const prefix = modal.querySelector('[data-auth-prefix]');
  const phoneInput = modal.querySelector('#auth-phone');
  let activeTrigger = null;
  let wasScrollLocked = false;
  let backdropPointerDown = false;

  countries.forEach((country) => {
    if (country.id !== 'ru') {
      countrySelect.add(new Option(`${country.name} (+${country.phone.prefix})`, country.id));
    }
  });

  const getPhoneConfig = () => getCountry(countrySelect.value).phone;
  const getNationalMask = () => getPhoneConfig().mask.replace(/^\+\d+\s*/, '');

  const formatPhone = (value) => {
    const config = getPhoneConfig();
    let digits = value.replace(/\D/g, '');

    if (digits.length > config.nationalLength) {
      const dialPrefix = [config.prefix, ...(config.trunkPrefixes || [])].find((item) =>
        digits.startsWith(item),
      );

      if (dialPrefix) {
        digits = digits.slice(dialPrefix.length);
      }
    }

    digits = digits.slice(0, config.nationalLength);
    let index = 0;
    let formatted = '';

    for (const character of getNationalMask()) {
      if (index >= digits.length) {
        break;
      }

      formatted += character === '#' ? digits[index++] : character;
    }

    return formatted;
  };

  const clearStatus = (form) => {
    const status = form.querySelector('[data-auth-status]');
    status.textContent = '';
    status.hidden = true;
    form
      .querySelectorAll('[aria-invalid]')
      .forEach((input) => input.removeAttribute('aria-invalid'));
  };

  const showStatus = (form, message, input) => {
    const status = form.querySelector('[data-auth-status]');
    status.textContent = message;
    status.hidden = false;

    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
  };

  const setTab = (tab) => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    forms.forEach((form) => {
      form.hidden = form.dataset.authForm !== tab.dataset.authTab;
      clearStatus(form);
    });
    subtitle.textContent =
      tab.dataset.authTab === 'phone'
        ? 'Введите номер телефона — пришлём код подтверждения'
        : 'Введите логин и пароль для входа в личный кабинет';
  };

  const updateCountry = () => {
    prefix.textContent = `+${getPhoneConfig().prefix}`;
    phoneInput.placeholder = getNationalMask().replaceAll('#', '0');
    phoneInput.value = '';
    clearStatus(phoneInput.form);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      } else if (event.key === 'Home' || event.key === 'End') {
        nextIndex = event.key === 'Home' ? 0 : tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      setTab(tabs[nextIndex]);
      tabs[nextIndex].focus();
    });
  });

  phoneInput.addEventListener('beforeinput', (event) => {
    const start = phoneInput.selectionStart;
    const end = phoneInput.selectionEnd;
    const direction = event.inputType === 'deleteContentBackward' ? -1 : 1;

    if (
      !['deleteContentBackward', 'deleteContentForward'].includes(event.inputType) ||
      start !== end
    ) {
      return;
    }

    let index = direction < 0 ? start - 1 : start;

    while (index >= 0 && index < phoneInput.value.length && /\D/.test(phoneInput.value[index])) {
      index += direction;
    }

    if (index < 0 || index >= phoneInput.value.length) {
      return;
    }

    event.preventDefault();
    phoneInput.setRangeText('', Math.min(index, start), Math.max(index + 1, start), 'start');
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  phoneInput.addEventListener('input', () => {
    const caret = phoneInput.selectionStart ?? phoneInput.value.length;
    const digitsBeforeCaret = phoneInput.value.slice(0, caret).replace(/\D/g, '').length;
    const wasAtEnd = caret === phoneInput.value.length;
    phoneInput.value = formatPhone(phoneInput.value);

    let nextCaret = phoneInput.value.length;

    if (!wasAtEnd) {
      let digits = 0;
      nextCaret = 0;

      while (nextCaret < phoneInput.value.length && digits < digitsBeforeCaret) {
        if (/\d/.test(phoneInput.value[nextCaret])) {
          digits += 1;
        }
        nextCaret += 1;
      }
    }

    phoneInput.setSelectionRange(nextCaret, nextCaret);
  });
  countrySelect.addEventListener('change', updateCountry);

  forms.forEach((form) => {
    form.addEventListener('input', () => clearStatus(form));
    form.addEventListener('change', () => clearStatus(form));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearStatus(form);

      if (form.dataset.authForm === 'phone') {
        phoneInput.value = formatPhone(phoneInput.value);

        if (phoneInput.value.replace(/\D/g, '').length !== getPhoneConfig().nationalLength) {
          showStatus(form, 'Введите номер телефона полностью.', phoneInput);
          return;
        }
      } else {
        const login = form.elements.login;
        const password = form.elements.password;

        if (!login.value.trim() || !password.value) {
          const input = !login.value.trim() ? login : password;
          showStatus(form, input === login ? 'Введите логин.' : 'Введите пароль.', input);
          return;
        }
      }

      // The authentication service can handle this event and call preventDefault().
      // No request or successful login is simulated when a handler is not connected.
      const request = new CustomEvent('warpoint:auth-submit', {
        bubbles: true,
        cancelable: true,
        detail: {
          method: form.dataset.authForm,
          formData: new FormData(form),
          phone:
            form.dataset.authForm === 'phone'
              ? `+${getPhoneConfig().prefix}${phoneInput.value.replace(/\D/g, '')}`
              : null,
          setStatus: (message) => showStatus(form, message),
        },
      });

      if (form.dispatchEvent(request)) {
        showStatus(form, 'Сервис входа пока недоступен. Попробуйте позже.');
      }
    });
  });

  document.querySelectorAll('[data-js-auth], [data-auth-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();

      if (modal.open) {
        return;
      }

      activeTrigger = trigger;
      wasScrollLocked = document.documentElement.classList.contains('is-scroll-locked');
      setTab(tabs[0]);
      modal.showModal();
      toggleScrollLock(true);
      modal.scrollTop = 0;
    });
  });

  modal.querySelector('[data-auth-close]').addEventListener('click', () => modal.close());
  const isOutsideDialog = (event) => {
    const rect = modal.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };
  modal.addEventListener('pointerdown', (event) => {
    backdropPointerDown = event.target === modal && isOutsideDialog(event);
  });
  modal.addEventListener('click', (event) => {
    if (backdropPointerDown && event.target === modal && isOutsideDialog(event)) {
      modal.close();
    }
    backdropPointerDown = false;
  });
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
    }
  });
  modal.addEventListener('close', () => {
    toggleScrollLock(wasScrollLocked);
    modal.querySelector('#auth-password').value = '';
    activeTrigger?.focus({ preventScroll: true });
  });

  countrySelect.value = getCountry(document.documentElement.dataset.country || 'ru').id;
  updateCountry();
}
