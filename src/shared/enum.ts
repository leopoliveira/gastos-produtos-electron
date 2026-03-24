export const getEnumStrings = <TEnum extends Record<string, string | number>>(
  enumObject: TEnum,
): string[] => Object.keys(enumObject).filter((key) => Number.isNaN(Number(key)));
