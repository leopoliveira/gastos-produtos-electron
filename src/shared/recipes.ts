import type { UnitOfMeasure } from './unit-of-measure';

export interface IngredientDto {
  productId: string;
  productName: string;
  quantity: number;
  ingredientPrice: number;
}

export interface PackingDto {
  packingId: string;
  packingName: string;
  quantity: number;
  packingUnitPrice: number;
}

export interface IRecipeIngredientInput {
  ingredientId: string;
  quantity: number;
}

export interface IRecipePackingInput {
  packingId: string;
  quantity: number;
}

export interface RecipeWriteDto {
  name: string;
  description?: string;
  quantity?: number;
  sellingValue?: number;
  groupId?: string;
  ingredients: IngredientDto[];
  packings: PackingDto[];
}

export interface AddRecipeRequest extends RecipeWriteDto {}

export interface UpdateRecipeDto extends RecipeWriteDto {}

export interface AddRecipeResponse {
  recipeId: string;
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

export interface GetRecipeResponse extends Omit<RecipeWriteDto, 'ingredients' | 'packings'> {
  id: string;
  groupName?: string;
  quantity: number;
  sellingValue: number;
  ingredients: IRecipeIngredient[];
  packings: IRecipePacking[];
  totalCost: number;
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

export type IUpdateRecipe = ICreateRecipe & { id: string };
export type IReadRecipe = GetRecipeResponse;
