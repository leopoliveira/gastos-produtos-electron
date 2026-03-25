import { describe, expect, it } from 'vitest';

import { getEnumStrings } from '../../src/shared/enum';
import { formatCurrency } from '../../src/shared/format';
import { normalizeString } from '../../src/shared/string';
import { UnitOfMeasure, getUnitOfMeasureValues } from '../../src/shared/unit-of-measure';

describe('shared utils', () => {
  it('formats BRL currency with two decimal places', () => {
    expect(formatCurrency(12.5)).toBe('R$ 12,50');
  });

  it('normalizes accents and casing for text filtering', () => {
    expect(normalizeString(' Açúcar Cristal ')).toBe('acucar cristal');
  });

  it('returns only textual enum keys', () => {
    expect(getEnumStrings(UnitOfMeasure)).toEqual([
      'mg',
      'g',
      'kg',
      'ml',
      'l',
      'un',
    ]);
  });

  it('returns only the primary unit values for selection', () => {
    expect(getUnitOfMeasureValues()).toEqual([
      UnitOfMeasure.mg,
      UnitOfMeasure.g,
      UnitOfMeasure.kg,
      UnitOfMeasure.ml,
      UnitOfMeasure.l,
      UnitOfMeasure.un,
    ]);
  });
});
