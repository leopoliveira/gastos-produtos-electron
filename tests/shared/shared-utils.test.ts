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
      'box',
      'package',
      'bag',
      'bottle',
      'can',
      'pot',
      'tube',
      'sachet',
      'roll',
      'sheet',
      'pair',
      'dozen',
      'set',
      'kit',
      'other',
    ]);
  });

  it('returns all numeric unit values in enum order', () => {
    expect(getUnitOfMeasureValues()).toEqual([
      UnitOfMeasure.mg,
      UnitOfMeasure.g,
      UnitOfMeasure.kg,
      UnitOfMeasure.ml,
      UnitOfMeasure.l,
      UnitOfMeasure.un,
      UnitOfMeasure.box,
      UnitOfMeasure.package,
      UnitOfMeasure.bag,
      UnitOfMeasure.bottle,
      UnitOfMeasure.can,
      UnitOfMeasure.pot,
      UnitOfMeasure.tube,
      UnitOfMeasure.sachet,
      UnitOfMeasure.roll,
      UnitOfMeasure.sheet,
      UnitOfMeasure.pair,
      UnitOfMeasure.dozen,
      UnitOfMeasure.set,
      UnitOfMeasure.kit,
      UnitOfMeasure.other,
    ]);
  });
});
