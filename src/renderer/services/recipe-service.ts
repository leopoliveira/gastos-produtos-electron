import type { AddRecipeRequest, ICreateRecipe, IReadRecipe } from '../../shared/recipes';
import { getAppApi } from './electron-api';

const buildRecipePayload = async (payload: ICreateRecipe): Promise<AddRecipeRequest> => {
  const appApi = getAppApi();
  const [products, packings] = await Promise.all([
    appApi.products.list(),
    appApi.packings.list(),
  ]);

  return {
    name: payload.name,
    description: payload.description,
    quantity: payload.quantity,
    sellingValue: payload.sellingValue,
    groupId: payload.groupId,
    ingredients: payload.ingredients.map((ingredient) => {
      const product = products.find((item) => item.id === ingredient.ingredientId);

      if (!product) {
        throw new Error(`Ingredient ${ingredient.ingredientId} not found.`);
      }

      return {
        productId: ingredient.ingredientId,
        productName: product.name,
        quantity: ingredient.quantity,
        ingredientPrice: product.unitPrice,
      };
    }),
    packings: payload.packings.map((packing) => {
      const packingOption = packings.find((item) => item.id === packing.packingId);

      if (!packingOption) {
        throw new Error(`Packing ${packing.packingId} not found.`);
      }

      return {
        packingId: packing.packingId,
        packingName: packingOption.name,
        quantity: packing.quantity,
        packingUnitPrice: packingOption.packingUnitPrice,
      };
    }),
  };
};

export const RecipeService = {
  async getAllRecipes(): Promise<IReadRecipe[]> {
    return getAppApi().recipes.list();
  },

  async getRecipeById(id: string): Promise<IReadRecipe> {
    return getAppApi().recipes.getById(id);
  },

  async createRecipe(payload: ICreateRecipe): Promise<IReadRecipe> {
    const request = await buildRecipePayload(payload);
    const createdRecipe = await getAppApi().recipes.create(request);
    return getAppApi().recipes.getById(createdRecipe.recipeId);
  },

  async updateRecipe(id: string, payload: ICreateRecipe): Promise<IReadRecipe> {
    const request = await buildRecipePayload(payload);
    await getAppApi().recipes.update(id, request);
    return getAppApi().recipes.getById(id);
  },

  async deleteRecipe(id: string): Promise<void> {
    await getAppApi().recipes.delete(id);
  },
};
