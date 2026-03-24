import { randomUUID } from 'node:crypto';

import type { UnitOfMeasure } from '../../../shared/unit-of-measure';

interface BaseRecord {
  createdAt: string;
  id: string;
  isDeleted: boolean;
  updatedAt: string;
}

export interface ProductRecord extends BaseRecord {
  name: string;
  price: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface PackingRecord extends BaseRecord {
  description?: string;
  name: string;
  price: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface GroupRecord extends BaseRecord {
  description?: string;
  name: string;
}

export interface RecipeIngredientRecord {
  ingredientPrice: number;
  productId: string;
  productName: string;
  quantity: number;
}

export interface RecipePackingRecord {
  packingId: string;
  packingName: string;
  packingUnitPrice: number;
  quantity: number;
}

export interface RecipeRecord extends BaseRecord {
  description?: string;
  groupId?: string;
  ingredients: RecipeIngredientRecord[];
  name: string;
  packings: RecipePackingRecord[];
  quantity: number;
  sellingValue: number;
  totalCost: number;
}

export interface DatabaseState {
  groups: GroupRecord[];
  packings: PackingRecord[];
  products: ProductRecord[];
  recipes: RecipeRecord[];
}

const createBaseRecord = (): BaseRecord => {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };
};

export const createProductRecord = (
  product: Omit<ProductRecord, keyof BaseRecord>,
): ProductRecord => ({
  ...createBaseRecord(),
  ...product,
});

export const createPackingRecord = (
  packing: Omit<PackingRecord, keyof BaseRecord>,
): PackingRecord => ({
  ...createBaseRecord(),
  ...packing,
});

export const createGroupRecord = (group: Omit<GroupRecord, keyof BaseRecord>): GroupRecord => ({
  ...createBaseRecord(),
  ...group,
});

export const createEmptyDatabaseState = (): DatabaseState => ({
  products: [],
  packings: [],
  groups: [],
  recipes: [],
});

export const createRecipeRecord = (recipe: Omit<RecipeRecord, keyof BaseRecord>): RecipeRecord => ({
  ...createBaseRecord(),
  ...recipe,
});
