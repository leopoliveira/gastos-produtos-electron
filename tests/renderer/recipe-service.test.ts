import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

const recipeHttpClientMocks = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
}));

const productServiceMocks = vi.hoisted(() => ({
  getAllProductsMock: vi.fn(),
}));

const packingServiceMocks = vi.hoisted(() => ({
  getAllPackingsMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/http/domain-clients', () => ({
  getRecipeHttpClient: () => ({
    delete: recipeHttpClientMocks.deleteMock,
    get: recipeHttpClientMocks.getMock,
    post: recipeHttpClientMocks.postMock,
    put: recipeHttpClientMocks.putMock,
  }),
}));

vi.mock('../../src/renderer/services/product-service', () => ({
  ProductService: {
    getAllProducts: productServiceMocks.getAllProductsMock,
  },
}));

vi.mock('../../src/renderer/services/packing-service', () => ({
  PackingService: {
    getAllPackings: packingServiceMocks.getAllPackingsMock,
  },
}));

const apiRecipe = {
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
      productId: 'product-1',
      productName: 'Chocolate em po',
      quantity: 0.5,
      ingredientPrice: 18.9,
    },
  ],
  packings: [
    {
      packingId: 'packing-1',
      packingName: 'Caixa kraft',
      quantity: 2,
      packingUnitPrice: 0.4,
    },
  ],
};

describe('RecipeService', () => {
  beforeEach(() => {
    vi.resetModules();
    recipeHttpClientMocks.deleteMock.mockReset();
    recipeHttpClientMocks.getMock.mockReset();
    recipeHttpClientMocks.postMock.mockReset();
    recipeHttpClientMocks.putMock.mockReset();
    productServiceMocks.getAllProductsMock.mockReset();
    packingServiceMocks.getAllPackingsMock.mockReset();
    productServiceMocks.getAllProductsMock.mockResolvedValue([
      {
        id: 'product-1',
        name: 'Chocolate em po',
        price: 18.9,
        quantity: 1,
        unitOfMeasure: UnitOfMeasure.kg,
        unitPrice: 18.9,
      },
    ]);
    packingServiceMocks.getAllPackingsMock.mockResolvedValue([
      {
        id: 'packing-1',
        name: 'Caixa kraft',
        description: 'Caixa para 4 brigadeiros',
        price: 20,
        quantity: 50,
        unitOfMeasure: UnitOfMeasure.box,
        packingUnitPrice: 0.4,
      },
    ]);
  });

  it('hydrates recipe responses from API DTOs into the renderer read model', async () => {
    recipeHttpClientMocks.getMock.mockResolvedValue({ data: [apiRecipe] });
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    const recipes = await RecipeService.getAllRecipes();

    expect(recipes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'recipe-1',
          name: 'Brigadeiro Tradicional',
          groupName: 'Brigadeiros',
          totalCost: 24,
        }),
      ]),
    );
    expect(recipes[0]?.ingredients).toEqual([
      expect.objectContaining({
        ingredientId: 'product-1',
        name: 'Chocolate em po',
        unitOfMeasure: UnitOfMeasure.kg,
        unitPrice: 18.9,
        totalCost: 9.45,
      }),
    ]);
  });

  it('creates and updates recipes by transforming renderer input into API DTOs', async () => {
    recipeHttpClientMocks.postMock.mockResolvedValue({ data: apiRecipe });
    recipeHttpClientMocks.putMock.mockResolvedValue({ data: apiRecipe });
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

    await expect(RecipeService.createRecipe(payload)).resolves.toEqual(
      expect.objectContaining({
        id: 'recipe-1',
        groupName: 'Brigadeiros',
      }),
    );

    await expect(RecipeService.updateRecipe('recipe-1', payload)).resolves.toEqual(
      expect.objectContaining({
        id: 'recipe-1',
        groupName: 'Brigadeiros',
      }),
    );

    expect(recipeHttpClientMocks.postMock).toHaveBeenCalledWith('/', {
      name: 'Cookie recheado',
      description: 'Receita para teste',
      quantity: 12,
      sellingValue: 7.5,
      groupId: 'group-1',
      ingredients: [
        {
          productId: 'product-1',
          productName: 'Chocolate em po',
          quantity: 0.5,
          ingredientPrice: 18.9,
        },
      ],
      packings: [
        {
          packingId: 'packing-1',
          packingName: 'Caixa kraft',
          quantity: 2,
          packingUnitPrice: 0.4,
        },
      ],
    });
    expect(recipeHttpClientMocks.putMock).toHaveBeenCalledWith('/recipe-1', {
      name: 'Cookie recheado',
      description: 'Receita para teste',
      quantity: 12,
      sellingValue: 7.5,
      groupId: 'group-1',
      ingredients: [
        {
          productId: 'product-1',
          productName: 'Chocolate em po',
          quantity: 0.5,
          ingredientPrice: 18.9,
        },
      ],
      packings: [
        {
          packingId: 'packing-1',
          packingName: 'Caixa kraft',
          quantity: 2,
          packingUnitPrice: 0.4,
        },
      ],
    });
  });

  it('returns recipe details by id, maps 404 to undefined and deletes recipes', async () => {
    recipeHttpClientMocks.getMock
      .mockResolvedValueOnce({ data: apiRecipe })
      .mockRejectedValueOnce({ status: 404, message: 'Not found' });
    recipeHttpClientMocks.deleteMock.mockResolvedValue(undefined);
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    const recipe = await RecipeService.getRecipeById('recipe-1');

    expect(recipe).toEqual(
      expect.objectContaining({
        id: 'recipe-1',
        groupId: 'group-1',
      }),
    );

    await expect(RecipeService.getRecipeById('recipe-404')).resolves.toBeUndefined();
    await RecipeService.deleteRecipe('recipe-1');
    expect(recipeHttpClientMocks.deleteMock).toHaveBeenCalledWith('/recipe-1');
  });
});
