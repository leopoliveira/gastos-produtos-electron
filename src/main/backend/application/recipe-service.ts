import type {
  ICreateRecipe,
  IReadRecipe,
  IRecipeIngredient,
  IRecipePacking,
} from '../../../shared/recipes';
import { UnitOfMeasure } from '../../../shared/unit-of-measure';

import { InvalidOperationError, NotFoundError } from '../domain/errors';
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
): IReadRecipe => ({
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

const buildIngredientSnapshots = (
  payload: ICreateRecipe,
  products: ProductRecord[],
): RecipeIngredientRecord[] =>
  payload.ingredients.map((ingredient) => {
    const product = products.find((item) => item.id === ingredient.ingredientId && !item.isDeleted);

    if (!product) {
      throw new InvalidOperationError(
        `Não foi possível localizar o ingrediente ${ingredient.ingredientId}.`,
      );
    }

    return {
      productId: ingredient.ingredientId,
      productName: product.name,
      quantity: ingredient.quantity,
      ingredientPrice: product.quantity === 0 ? 0 : product.price / product.quantity,
    };
  });

const buildPackingSnapshots = (
  payload: ICreateRecipe,
  packings: PackingRecord[],
): RecipePackingRecord[] =>
  payload.packings.map((packing) => {
    const packingOption = packings.find((item) => item.id === packing.packingId && !item.isDeleted);

    if (!packingOption) {
      throw new InvalidOperationError(
        `Não foi possível localizar a embalagem ${packing.packingId}.`,
      );
    }

    return {
      packingId: packing.packingId,
      packingName: packingOption.name,
      quantity: packing.quantity,
      packingUnitPrice:
        packingOption.quantity === 0 ? 0 : packingOption.price / packingOption.quantity,
    };
  });

export class RecipeService {
  constructor(private readonly store: AppDataStore) {}

  async getAll(groupId?: string): Promise<IReadRecipe[]> {
    return this.store.read((state) =>
      state.recipes
        .filter((recipe) => !recipe.isDeleted)
        .filter((recipe) => (groupId ? recipe.groupId === groupId : true))
        .map((recipe) => toReadRecipe(recipe, state.products, state.packings, state.groups)),
    );
  }

  async getById(id: string): Promise<IReadRecipe | undefined> {
    return this.store.read((state) => {
      const recipe = state.recipes.find((item) => item.id === id && !item.isDeleted);

      if (!recipe) {
        return undefined;
      }

      return toReadRecipe(recipe, state.products, state.packings, state.groups);
    });
  }

  async create(payload: ICreateRecipe): Promise<IReadRecipe> {
    return this.store.mutate((state) => {
      const ingredients = buildIngredientSnapshots(payload, state.products);
      const packings = buildPackingSnapshots(payload, state.packings);
      const recipe = createRecipeRecord({
        name: payload.name,
        description: payload.description,
        quantity: payload.quantity,
        sellingValue: payload.sellingValue,
        groupId: payload.groupId,
        ingredients,
        packings,
        totalCost: calculateRecipeTotalCost(ingredients, packings),
      });

      state.recipes.push(recipe);

      return toReadRecipe(recipe, state.products, state.packings, state.groups);
    });
  }

  async update(id: string, payload: ICreateRecipe): Promise<IReadRecipe> {
    return this.store.mutate((state) => {
      const recipe = findActiveRecipe(state.recipes, id);
      const ingredients = buildIngredientSnapshots(payload, state.products);
      const packings = buildPackingSnapshots(payload, state.packings);

      recipe.name = payload.name;
      recipe.description = payload.description;
      recipe.quantity = payload.quantity;
      recipe.sellingValue = payload.sellingValue;
      recipe.groupId = payload.groupId;
      recipe.ingredients = ingredients;
      recipe.packings = packings;
      recipe.totalCost = calculateRecipeTotalCost(ingredients, packings);
      recipe.updatedAt = new Date().toISOString();

      return toReadRecipe(recipe, state.products, state.packings, state.groups);
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
