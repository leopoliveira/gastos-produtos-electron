import type { UnitOfMeasure } from './unit-of-measure';

export interface IRecipeIngredientInput {
  ingredientId: string;
  quantity: number;
}

export interface IRecipePackingInput {
  packingId: string;
  quantity: number;
}

export interface ICreateRecipe {
  name: string;
  description?: string;
  quantity: number;
  sellingValue: number;
  groupId?: string;
  ingredients: IRecipeIngredientInput[];
  packings: IRecipePackingInput[];
}

export interface IRecipeIngredient extends IRecipeIngredientInput {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: number;
  totalCost: number;
}

export interface IRecipePacking extends IRecipePackingInput {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: number;
  totalCost: number;
}

export interface IReadRecipe extends Omit<ICreateRecipe, 'ingredients' | 'packings'> {
  id: string;
  groupName?: string;
  ingredients: IRecipeIngredient[];
  packings: IRecipePacking[];
  totalCost: number;
}
