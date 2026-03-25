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

const MASS_UNITS: UnitOfMeasure[] = [UnitOfMeasure.kg, UnitOfMeasure.g, UnitOfMeasure.mg];
const VOLUME_UNITS: UnitOfMeasure[] = [UnitOfMeasure.l, UnitOfMeasure.ml];
const COUNT_UNITS: UnitOfMeasure[] = [UnitOfMeasure.un];

const MASS_FACTORS: Record<UnitOfMeasure, number> = {
  [UnitOfMeasure.kg]: 1_000_000,
  [UnitOfMeasure.g]: 1_000,
  [UnitOfMeasure.mg]: 1,
  [UnitOfMeasure.ml]: 0,
  [UnitOfMeasure.l]: 0,
  [UnitOfMeasure.un]: 0,
};

const VOLUME_FACTORS: Record<UnitOfMeasure, number> = {
  [UnitOfMeasure.l]: 1_000,
  [UnitOfMeasure.ml]: 1,
  [UnitOfMeasure.mg]: 0,
  [UnitOfMeasure.g]: 0,
  [UnitOfMeasure.kg]: 0,
  [UnitOfMeasure.un]: 0,
};

const getUnitFamily = (unit: UnitOfMeasure): 'mass' | 'volume' | 'count' => {
  if (MASS_UNITS.includes(unit)) {
    return 'mass';
  }
  if (VOLUME_UNITS.includes(unit)) {
    return 'volume';
  }
  return 'count';
};

export const getCompatibleUnitOfMeasureValues = (baseUnit: UnitOfMeasure): UnitOfMeasure[] => {
  const family = getUnitFamily(baseUnit);
  if (family === 'mass') {
    return MASS_UNITS;
  }
  if (family === 'volume') {
    return VOLUME_UNITS;
  }
  return COUNT_UNITS;
};

export const convertQuantityBetweenUnits = (
  quantity: number,
  fromUnit: UnitOfMeasure,
  toUnit: UnitOfMeasure,
): number => {
  const fromFamily = getUnitFamily(fromUnit);
  const toFamily = getUnitFamily(toUnit);
  if (fromFamily !== toFamily) {
    throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}.`);
  }

  if (fromFamily === 'count') {
    return quantity;
  }

  if (fromFamily === 'mass') {
    return (quantity * MASS_FACTORS[fromUnit]) / MASS_FACTORS[toUnit];
  }

  return (quantity * VOLUME_FACTORS[fromUnit]) / VOLUME_FACTORS[toUnit];
};
