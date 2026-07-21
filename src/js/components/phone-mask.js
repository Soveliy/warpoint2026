import { defaultLocationState, getCountry } from '../data/location-data.js';

let activeCountryId = defaultLocationState.countryId;

const getPhoneConfig = (countryId = activeCountryId) => getCountry(countryId).phone;

const getMaskPrefix = (mask) => mask.slice(0, mask.indexOf('#'));

export function getPhoneNationalDigits(value, countryId = activeCountryId) {
  const config = getPhoneConfig(countryId);
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith(config.prefix)) {
    digits = digits.slice(config.prefix.length);
  } else {
    const trunkPrefix = config.trunkPrefixes?.find((prefix) => digits.startsWith(prefix));

    if (trunkPrefix) {
      digits = digits.slice(trunkPrefix.length);
    }
  }

  return digits.slice(0, config.nationalLength);
}

export function formatPhone(value, countryId = activeCountryId) {
  const config = getPhoneConfig(countryId);
  const digits = getPhoneNationalDigits(value, countryId);
  const prefix = getMaskPrefix(config.mask);

  if (!digits.length) {
    return prefix;
  }

  let digitIndex = 0;
  let result = '';

  for (const character of config.mask) {
    if (character !== '#') {
      result += character;
      continue;
    }

    if (digitIndex >= digits.length) {
      break;
    }

    result += digits[digitIndex];
    digitIndex += 1;
  }

  return result.trimEnd();
}

export function isPhoneComplete(input) {
  const countryId = input.dataset.phoneCountry || activeCountryId;
  const config = getPhoneConfig(countryId);

  return getPhoneNationalDigits(input.value, countryId).length === config.nationalLength;
}

function moveCaretToEnd(input) {
  const end = input.value.length;

  input.setSelectionRange(end, end);
}

function updateInputCountry(input, countryId, clearValue) {
  const config = getPhoneConfig(countryId);

  input.dataset.phoneCountry = countryId;
  input.placeholder = config.mask.replaceAll('#', '0');

  if (clearValue) {
    input.value = '';
    input.setCustomValidity('');
    input.classList.remove('is-invalid', 'is-touched');
    input.setAttribute('aria-invalid', 'false');
  } else if (input.value) {
    input.value = formatPhone(input.value, countryId);
  }
}

export function setPhoneCountry(countryId, { clearValue = true } = {}) {
  activeCountryId = getCountry(countryId).id;

  document.querySelectorAll('[data-phone-mask]').forEach((input) => {
    updateInputCountry(input, activeCountryId, clearValue);
  });

  document.dispatchEvent(
    new CustomEvent('phone-mask:country-change', {
      detail: {
        countryId: activeCountryId,
        mask: getPhoneConfig().mask,
      },
    }),
  );
}

export function initPhoneMask(input) {
  if (input.dataset.phoneMaskReady === 'true') {
    return;
  }

  input.dataset.phoneMaskReady = 'true';
  updateInputCountry(input, activeCountryId, false);

  input.addEventListener('focus', () => {
    if (!input.value) {
      input.value = getMaskPrefix(getPhoneConfig(input.dataset.phoneCountry).mask);
    }

    requestAnimationFrame(() => moveCaretToEnd(input));
  });

  input.addEventListener('input', () => {
    input.value = formatPhone(input.value, input.dataset.phoneCountry);
    moveCaretToEnd(input);
  });

  input.addEventListener('keydown', (event) => {
    const isCaretAtEnd =
      input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    const countryId = input.dataset.phoneCountry;
    const digits = getPhoneNationalDigits(input.value, countryId);

    if (event.key !== 'Backspace' || !isCaretAtEnd || !digits.length) {
      return;
    }

    event.preventDefault();
    input.value = formatPhone(
      `${getPhoneConfig(countryId).prefix}${digits.slice(0, -1)}`,
      countryId,
    );
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  input.addEventListener('blur', () => {
    if (!getPhoneNationalDigits(input.value, input.dataset.phoneCountry).length) {
      input.value = '';
    }
  });
}

export function initPhoneMasks() {
  document.querySelectorAll('[data-phone-mask]').forEach(initPhoneMask);
}
