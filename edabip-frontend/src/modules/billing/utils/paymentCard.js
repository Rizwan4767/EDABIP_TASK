const CARD_NUMBER_MIN = 13;
const CARD_NUMBER_MAX = 16;

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatCardNumber(value) {
  return digitsOnly(value)
    .slice(0, CARD_NUMBER_MAX)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvc(value) {
  return digitsOnly(value).slice(0, 4);
}

export function detectCardBrand(digits) {
  if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
  return 'visa';
}

export function brandLabel(brand) {
  return brand === 'mastercard' ? 'Mastercard' : 'Visa';
}

export function isExpiryValid(expiry) {
  const match = /^(\d{2})\/(\d{4})$/.exec(expiry);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 20) return false;
  return true;
}

export function maskedCardNumber(digits) {
  const safe = digitsOnly(digits);
  if (!safe) return '•••• •••• •••• ••••';

  const padded = safe.padEnd(16, '•');
  return padded.replace(/(.{4})/g, '$1 ').trim();
}

export function validatePaymentForm({ number, expiry, name, cvc }) {
  const digits = digitsOnly(number);
  const nameTrimmed = String(name || '').trim();
  const cvcDigits = digitsOnly(cvc);

  if (!nameTrimmed) return { message: 'Enter the name on the card.', field: 'name' };
  if (digits.length < CARD_NUMBER_MIN || digits.length > CARD_NUMBER_MAX) {
    return { message: 'Enter a valid card number.', field: 'number' };
  }
  if (!isExpiryValid(expiry)) {
    return { message: 'Enter a valid expiry date (MM/YYYY).', field: 'expiry' };
  }
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    return { message: 'Enter a valid CVC.', field: 'cvc' };
  }
  return { message: '', field: '' };
}

export function buildPaymentMethod({ number, expiry, name, isPrimary }) {
  const digits = digitsOnly(number);
  const brand = detectCardBrand(digits);

  return {
    id: `card-${Date.now()}`,
    brand,
    label: `${brandLabel(brand)} ending in ${digits.slice(-4)}`,
    expiry: `Expires ${expiry}`,
    holderName: String(name || '').trim(),
    isPrimary,
  };
}
