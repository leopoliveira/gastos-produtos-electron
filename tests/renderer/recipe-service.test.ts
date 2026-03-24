import { beforeEach, describe, expect, it, vi } from 'vitest';

const appApiMocks = vi.hoisted(() => ({
  recipes: {
    create: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/electron-api', () => ({
  getAppApi: () => appApiMocks,
}));

const recipe = {
  id: 'recipe-1',
  name: 'Brigadeiro Tradicional',
  description: 'Receita de brigadeiro',
  quantity: 20,
  sellingValue: 3,
  groupId: 'group-1',
  groupName: 'Brigadeiros',
  totalCost: 24,
  ingredients: [
    {
      ingredientId: 'product-1',
      quantity: 0.5,
      name: 'Chocolate em po',
      unitOfMeasure: 2,
      unitPrice: 18.9,
      totalCost: 9.45,
    },
  ],
  packings: [
    {
      packingId: 'packing-1',
      quantity: 2,
      name: 'Caixa kraft',
      unitOfMeasure: 6,
      unitPrice: 0.4,
      totalCost: 0.8,
    },
  ],
};

describe('RecipeService', () => {
  beforeEach(() => {
    vi.resetModules();
    appApiMocks.recipes.create.mockReset();
    appApiMocks.recipes.delete.mockReset();
    appApiMocks.recipes.getById.mockReset();
    appApiMocks.recipes.list.mockReset();
    appApiMocks.recipes.update.mockReset();
  });

  it('loads recipes through the preload bridge', async () => {
    appApiMocks.recipes.list.mockResolvedValue([recipe]);
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    await expect(RecipeService.getAllRecipes()).resolves.toEqual([recipe]);
    expect(appApiMocks.recipes.list).toHaveBeenCalledWith();
  });

  it('creates and updates recipes through the preload bridge', async () => {
    appApiMocks.recipes.create.mockResolvedValue(recipe);
    appApiMocks.recipes.update.mockResolvedValue(recipe);
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    const payload = {
      name: 'Cookie recheado',
      description: 'Receita para teste',
      quantity: 12,
      sellingValue: 7.5,
      groupId: 'group-1',
      ingredients: [
        {
          ingredientId: 'product-1',
          quantity: 0.5,
        },
      ],
      packings: [
        {
          packingId: 'packing-1',
          quantity: 2,
        },
      ],
    };

    await expect(RecipeService.createRecipe(payload)).resolves.toEqual(recipe);
    await expect(RecipeService.updateRecipe('recipe-1', payload)).resolves.toEqual(recipe);

    expect(appApiMocks.recipes.create).toHaveBeenCalledWith(payload);
    expect(appApiMocks.recipes.update).toHaveBeenCalledWith('recipe-1', payload);
  });

  it('loads recipe details by id and deletes recipes', async () => {
    appApiMocks.recipes.getById.mockResolvedValueOnce(recipe).mockResolvedValueOnce(undefined);
    appApiMocks.recipes.delete.mockResolvedValue(undefined);
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    await expect(RecipeService.getRecipeById('recipe-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'recipe-1',
        groupId: 'group-1',
      }),
    );

    await expect(RecipeService.getRecipeById('recipe-404')).resolves.toBeUndefined();
    await RecipeService.deleteRecipe('recipe-1');

    expect(appApiMocks.recipes.getById).toHaveBeenNthCalledWith(1, 'recipe-1');
    expect(appApiMocks.recipes.getById).toHaveBeenNthCalledWith(2, 'recipe-404');
    expect(appApiMocks.recipes.delete).toHaveBeenCalledWith('recipe-1');
  });
});
