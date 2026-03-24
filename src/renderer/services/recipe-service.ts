import type { ICreateRecipe, IReadRecipe } from '../../shared/recipes';
import { getAppApi } from './electron-api';

export const RecipeService = {
  async getAllRecipes(): Promise<IReadRecipe[]> {
    return getAppApi().recipes.list();
  },

  async getRecipeById(id: string): Promise<IReadRecipe | undefined> {
    return getAppApi().recipes.getById(id);
  },

  async createRecipe(payload: ICreateRecipe): Promise<IReadRecipe> {
    return getAppApi().recipes.create(payload);
  },

  async updateRecipe(id: string, payload: ICreateRecipe): Promise<IReadRecipe> {
    return getAppApi().recipes.update(id, payload);
  },

  async deleteRecipe(id: string): Promise<void> {
    await getAppApi().recipes.delete(id);
  },
};
