import { getEnumStrings } from './enum';

export enum UnitOfMeasure {
  mg = 0,
  g = 1,
  kg = 2,
  ml = 3,
  l = 4,
  un = 5,
  box = 6,
  package = 7,
  bag = 8,
  bottle = 9,
  can = 10,
  pot = 11,
  tube = 12,
  sachet = 13,
  roll = 14,
  sheet = 15,
  pair = 16,
  dozen = 17,
  set = 18,
  kit = 19,
  other = 20,
}

const unitLabels: Record<UnitOfMeasure, string> = {
  [UnitOfMeasure.mg]: 'mg',
  [UnitOfMeasure.g]: 'g',
  [UnitOfMeasure.kg]: 'kg',
  [UnitOfMeasure.ml]: 'ml',
  [UnitOfMeasure.l]: 'l',
  [UnitOfMeasure.un]: 'un',
  [UnitOfMeasure.box]: 'box',
  [UnitOfMeasure.package]: 'package',
  [UnitOfMeasure.bag]: 'bag',
  [UnitOfMeasure.bottle]: 'bottle',
  [UnitOfMeasure.can]: 'can',
  [UnitOfMeasure.pot]: 'pot',
  [UnitOfMeasure.tube]: 'tube',
  [UnitOfMeasure.sachet]: 'sachet',
  [UnitOfMeasure.roll]: 'roll',
  [UnitOfMeasure.sheet]: 'sheet',
  [UnitOfMeasure.pair]: 'pair',
  [UnitOfMeasure.dozen]: 'dozen',
  [UnitOfMeasure.set]: 'set',
  [UnitOfMeasure.kit]: 'kit',
  [UnitOfMeasure.other]: 'other',
};

export const getUnitOfMeasureLabel = (unit: UnitOfMeasure): string => unitLabels[unit];

export const getUnitOfMeasureValues = (): UnitOfMeasure[] =>
  getEnumStrings(UnitOfMeasure).map((key) => UnitOfMeasure[key as keyof typeof UnitOfMeasure]);
