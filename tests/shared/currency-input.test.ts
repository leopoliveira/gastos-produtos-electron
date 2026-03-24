import { describe, expect, it } from 'vitest';

import {
  amountFromCurrencyDigitString,
  currencyDigitStringFromAmount,
  formatCurrencyMaskedDisplay,
} from '../../src/shared/currency-input';

describe('currency-input', () => {
  it('amountFromCurrencyDigitString maps centavos digitados to número', () => {
    expect(amountFromCurrencyDigitString('')).toBe(0);
    expect(amountFromCurrencyDigitString('1')).toBe(0.01);
    expect(amountFromCurrencyDigitString('50')).toBe(0.5);
    expect(amountFromCurrencyDigitString('12345')).toBe(123.45);
  });

  it('currencyDigitStringFromAmount inverte valores positivos', () => {
    expect(currencyDigitStringFromAmount(0)).toBe('');
    expect(currencyDigitStringFromAmount(-1)).toBe('');
    expect(currencyDigitStringFromAmount(123.45)).toBe('12345');
  });

  it('formatCurrencyMaskedDisplay vazio quando sem dígitos', () => {
    expect(formatCurrencyMaskedDisplay('')).toBe('');
  });

  it('formatCurrencyMaskedDisplay usa pt-BR', () => {
    expect(formatCurrencyMaskedDisplay('12345')).toMatch(/R\$/);
    expect(formatCurrencyMaskedDisplay('12345')).toContain('123,45');
  });
});
