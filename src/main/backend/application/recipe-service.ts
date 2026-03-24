import type {
  AddRecipeRequest,
  AddRecipeResponse,
  GetRecipeResponse,
  IRecipeIngredient,
  IRecipePacking,
  IngredientDto,
  PackingDto,
  UpdateRecipeDto,
} from '../../../shared/recipes';
import { UnitOfMeasure } from '../../../shared/unit-of-measure';

import { NotFoundError } from '../domain/errors';
import {
  createRecipeRecord,
  type GroupRecord,
  type PackingRecord,
  type ProductRecord,
  type RecipeIngredientRecord,
  type RecipePackingRecord,
  type RecipeRecord,
} from '../domain/entities';
import { AppDataStore } from '../infra/app-data-store';

const RECIPE_NOT_FOUND_MESSAGE = 'Recipe not found.';
const RECIPE_NOT_FOUND_DELETE_MESSAGE = 'Recipe not found. Nothing will be deleted.';

const calculateRecipeTotalCost = (
  ingredients: RecipeIngredientRecord[],
  packings: RecipePackingRecord[],
): number =>
  ingredients.reduce((total, ingredient) => total + ingredient.quantity * ingredient.ingredientPrice, 0) +
  packings.reduce((total, packing) => total + packing.quantity * packing.packingUnitPrice, 0);

const toRecipeIngredient = (
  ingredient: RecipeIngredientRecord,
  products: ProductRecord[],
): IRecipeIngredient => ({
  ingredientId: ingredient.productId,
  quantity: ingredient.quantity,
  name: ingredient.productName,
  unitPrice: ingredient.ingredientPrice,
  unitOfMeasure:
    products.find((product) => product.id === ingredient.productId && !product.isDeleted)?.unitOfMeasure ??
    UnitOfMeasure.un,
  totalCost: ingredient.quantity * ingredient.ingredientPrice,
});

const toRecipePacking = (
  packing: RecipePackingRecord,
  packings: PackingRecord[],
): IRecipePacking => ({
  packingId: packing.packingId,
  quantity: packing.quantity,
  name: packing.packingName,
  unitPrice: packing.packingUnitPrice,
  unitOfMeasure:
    packings.find((packingOption) => packingOption.id === packing.packingId && !packingOption.isDeleted)
      ?.unitOfMeasure ?? UnitOfMeasure.un,
  totalCost: packing.quantity * packing.packingUnitPrice,
});

const toReadRecipe = (
  recipe: RecipeRecord,
  products: ProductRecord[],
  packings: PackingRecord[],
  groups: GroupRecord[],
): GetRecipeResponse => ({
  id: recipe.id,
  name: recipe.name,
  description: recipe.description,
  quantity: recipe.quantity,
  sellingValue: recipe.sellingValue,
  groupId: recipe.groupId,
  groupName: groups.find((group) => group.id === recipe.groupId && !group.isDeleted)?.name,
  ingredients: recipe.ingredients.map((ingredient) => toRecipeIngredient(ingredient, products)),
  packings: recipe.packings.map((packing) => toRecipePacking(packing, packings)),
  totalCost: recipe.totalCost,
});

const findActiveRecipe = (recipes: RecipeRecord[], id: string): RecipeRecord => {
  const recipe = recipes.find((item) => item.id === id && !item.isDeleted);

  if (!recipe) {
    throw new NotFoundError(RECIPE_NOT_FOUND_MESSAGE);
  }

  return recipe;
};

const buildIngredientSnapshots = (ingredients: IngredientDto[]): RecipeIngredientRecord[] =>
  ingredients.map((ingredient) => ({
    productId: ingredient.productId,
    productName: ingredient.productName,
    quantity: ingredient.quantity,
    ingredientPrice: ingredient.ingredientPrice,
  }));

const buildPackingSnapshots = (packings: PackingDto[]): RecipePackingRecord[] =>
  packings.map((packing) => ({
    packingId: packing.packingId,
    packingName: packing.packingName,
    quantity: packing.quantity,
    packingUnitPrice: packing.packingUnitPrice,
  }));

export class RecipeService {
  constructor(private readonly store: AppDataStore) {}

  async getAll(groupId?: string): Promise<GetRecipeResponse[]> {
    return this.store.read((state) =>
      state.recipes
        .filter((recipe) => !recipe.isDeleted)
        .filter((recipe) => (groupId ? recipe.groupId === groupId : true))
        .map((recipe) => toReadRecipe(recipe, state.products, state.packings, state.groups)),
    );
  }

  async getById(id: string): Promise<GetRecipeResponse> {
    return this.store.read((state) =>
      toReadRecipe(findActiveRecipe(state.recipes, id), state.products, state.packings, state.groups),
    );
  }

  async create(payload: AddRecipeRequest): Promise<AddRecipeResponse> {
    return this.store.mutate((state) => {
      const ingredients = buildIngredientSnapshots(payload.ingredients);
      const packings = buildPackingSnapshots(payload.packings);
      const recipe = createRecipeRecord({
        name: payload.name,
        description: payload.description,
        quantity: payload.quantity ?? 0,
        sellingValue: payload.sellingValue ?? 0,
        groupId: payload.groupId ?? undefined,
        ingredients,
        packings,
        totalCost: calculateRecipeTotalCost(ingredients, packings),
      });

      state.recipes.push(recipe);

      return { recipeId: recipe.id };
    });
  }

  async update(id: string, payload: UpdateRecipeDto): Promise<void> {
    await this.store.mutate((state) => {
      const recipe = findActiveRecipe(state.recipes, id);
      const ingredients = buildIngredientSnapshots(payload.ingredients);
      const packings = buildPackingSnapshots(payload.packings);

      recipe.name = payload.name;
      recipe.description = payload.description;
      recipe.quantity = payload.quantity ?? 0;
      recipe.sellingValue = payload.sellingValue ?? 0;
      recipe.groupId = payload.groupId ?? undefined;
      recipe.ingredients = ingredients;
      recipe.packings = packings;
      recipe.totalCost = calculateRecipeTotalCost(ingredients, packings);
      recipe.updatedAt = new Date().toISOString();
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const recipe = state.recipes.find((item) => item.id === id && !item.isDeleted);

      if (!recipe) {
        throw new NotFoundError(RECIPE_NOT_FOUND_DELETE_MESSAGE);
      }

      recipe.isDeleted = true;
      recipe.updatedAt = new Date().toISOString();
    });
  }
}
