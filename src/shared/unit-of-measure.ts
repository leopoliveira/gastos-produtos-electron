export enum UnitOfMeasure {
  mg = 0,
  g = 1,
  kg = 2,
  ml = 3,
  l = 4,
  un = 5,
}

const unitLabels: Record<UnitOfMeasure, string> = {
  [UnitOfMeasure.mg]: 'mg',
  [UnitOfMeasure.g]: 'g',
  [UnitOfMeasure.kg]: 'kg',
  [UnitOfMeasure.ml]: 'ml',
  [UnitOfMeasure.l]: 'l',
  [UnitOfMeasure.un]: 'unidade',
};

export const getUnitOfMeasureLabel = (unit: UnitOfMeasure): string => unitLabels[unit];

const PRIMARY_UNIT_VALUES: UnitOfMeasure[] = [
  UnitOfMeasure.mg,
  UnitOfMeasure.g,
  UnitOfMeasure.kg,
  UnitOfMeasure.ml,
  UnitOfMeasure.l,
  UnitOfMeasure.un,
];

export const getUnitOfMeasureValues = (): UnitOfMeasure[] => PRIMARY_UNIT_VALUES;
