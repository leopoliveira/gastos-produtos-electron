import { formatCurrency } from './format';

export const amountFromCurrencyDigitString = (digits: string): number => {
  if (!digits) {
    return 0;
  }

  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed / 100;
};

export const currencyDigitStringFromAmount = (amount: number): string => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  const cents = Math.round(amount * 100);
  return cents > 0 ? String(cents) : '';
};

export const formatCurrencyMaskedDisplay = (digits: string): string => {
  if (!digits) {
    return '';
  }

  return formatCurrency(amountFromCurrencyDigitString(digits));
};
