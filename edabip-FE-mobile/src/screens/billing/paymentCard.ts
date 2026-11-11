export const CARD_NUMBER_MIN = 13;
export const CARD_NUMBER_MAX = 16;

export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, CARD_NUMBER_MAX)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvc(value: string): string {
  return digitsOnly(value).slice(0, 4);
}

export function detectCardBrand(digits: string): 'visa' | 'mastercard' {
  if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
  return 'visa';
}

export function brandLabel(brand: 'visa' | 'mastercard'): string {
  return brand === 'mastercard' ? 'Mastercard' : 'Visa';
}

export function isExpiryValid(expiry: string): boolean {
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

export function maskedCardNumber(digits: string): string {
  const safe = digitsOnly(digits);
  if (!safe) return '•••• •••• •••• ••••';

  const padded = safe.padEnd(16, '•');
  return padded.replace(/(.{4})/g, '$1 ').trim();
}

export interface PaymentFormValues {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
  setPrimary: boolean;
}

export interface PaymentFormError {
  message: string;
  field: '' | 'name' | 'number' | 'expiry' | 'cvc';
}

export function validatePaymentForm({
  number,
  expiry,
  name,
  cvc,
}: PaymentFormValues): PaymentFormError {
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
