import { describe, expect, it } from 'vitest';

import {
  convertQuantityBetweenUnits,
  getCompatibleUnitOfMeasureValues,
  UnitOfMeasure,
} from '../../src/shared/unit-of-measure';

describe('unit-of-measure helpers', () => {
  describe('getCompatibleUnitOfMeasureValues', () => {
    it('returns mass-compatible units for mass bases', () => {
      expect(getCompatibleUnitOfMeasureValues(UnitOfMeasure.kg)).toEqual([
        UnitOfMeasure.kg,
        UnitOfMeasure.g,
        UnitOfMeasure.mg,
      ]);
      expect(getCompatibleUnitOfMeasureValues(UnitOfMeasure.g)).toEqual([
        UnitOfMeasure.kg,
        UnitOfMeasure.g,
        UnitOfMeasure.mg,
      ]);
      expect(getCompatibleUnitOfMeasureValues(UnitOfMeasure.mg)).toEqual([
        UnitOfMeasure.kg,
        UnitOfMeasure.g,
        UnitOfMeasure.mg,
      ]);
    });

    it('returns volume-compatible units for volume bases', () => {
      expect(getCompatibleUnitOfMeasureValues(UnitOfMeasure.l)).toEqual([
        UnitOfMeasure.l,
        UnitOfMeasure.ml,
      ]);
      expect(getCompatibleUnitOfMeasureValues(UnitOfMeasure.ml)).toEqual([
        UnitOfMeasure.l,
        UnitOfMeasure.ml,
      ]);
    });

    it('returns only unidade for count base', () => {
      expect(getCompatibleUnitOfMeasureValues(UnitOfMeasure.un)).toEqual([UnitOfMeasure.un]);
    });
  });

  describe('convertQuantityBetweenUnits', () => {
    it('converts mass units in both directions', () => {
      expect(convertQuantityBetweenUnits(1, UnitOfMeasure.kg, UnitOfMeasure.g)).toBe(1000);
      expect(convertQuantityBetweenUnits(1, UnitOfMeasure.kg, UnitOfMeasure.mg)).toBe(1_000_000);
      expect(convertQuantityBetweenUnits(20, UnitOfMeasure.g, UnitOfMeasure.kg)).toBe(0.02);
      expect(convertQuantityBetweenUnits(500, UnitOfMeasure.mg, UnitOfMeasure.g)).toBe(0.5);
    });

    it('converts volume units in both directions', () => {
      expect(convertQuantityBetweenUnits(1, UnitOfMeasure.l, UnitOfMeasure.ml)).toBe(1000);
      expect(convertQuantityBetweenUnits(250, UnitOfMeasure.ml, UnitOfMeasure.l)).toBe(0.25);
    });

    it('keeps count unit as-is', () => {
      expect(convertQuantityBetweenUnits(3, UnitOfMeasure.un, UnitOfMeasure.un)).toBe(3);
    });

    it('handles zero and negative values', () => {
      expect(convertQuantityBetweenUnits(0, UnitOfMeasure.g, UnitOfMeasure.kg)).toBe(0);
      expect(convertQuantityBetweenUnits(-500, UnitOfMeasure.g, UnitOfMeasure.kg)).toBe(-0.5);
      expect(convertQuantityBetweenUnits(-1, UnitOfMeasure.l, UnitOfMeasure.ml)).toBe(-1000);
    });

    it('throws for incompatible families', () => {
      expect(() =>
        convertQuantityBetweenUnits(1, UnitOfMeasure.kg, UnitOfMeasure.ml),
      ).toThrowError('Cannot convert from 2 to 3.');
      expect(() =>
        convertQuantityBetweenUnits(1, UnitOfMeasure.un, UnitOfMeasure.g),
      ).toThrowError('Cannot convert from 5 to 1.');
    });
  });
});
