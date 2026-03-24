import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

describe('RecipeService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('hydrates recipes with group name and calculated total cost', async () => {
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    const recipes = await RecipeService.getAllRecipes();

    expect(recipes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'recipe-1',
          name: 'Brigadeiro Tradicional',
          groupName: 'Brigadeiros',
          totalCost: 2.047974683544304,
        }),
      ]),
    );
  });

  it('creates and updates recipes using ingredient and packing unit prices', async () => {
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    const createdRecipe = await RecipeService.createRecipe({
      name: ' Cookie recheado ',
      description: ' Receita para teste ',
      quantity: 12,
      sellingValue: 7.5,
      groupId: 'group-2',
      ingredients: [
        {
          ingredientId: 'product-1',
          quantity: 0.2,
        },
      ],
      packings: [
        {
          packingId: 'packing-2',
          quantity: 12,
        },
      ],
    });

    expect(createdRecipe).toEqual(
      expect.objectContaining({
        name: 'Cookie recheado',
        description: 'Receita para teste',
        groupName: 'Bolos',
        totalCost: 5.76,
      }),
    );
    expect(createdRecipe.ingredients).toEqual([
      expect.objectContaining({
        ingredientId: 'product-1',
        unitOfMeasure: UnitOfMeasure.kg,
        unitPrice: 18.9,
        totalCost: 3.78,
      }),
    ]);
    expect(createdRecipe.packings).toEqual([
      expect.objectContaining({
        packingId: 'packing-2',
        unitOfMeasure: UnitOfMeasure.bag,
        unitPrice: 0.165,
        totalCost: 1.98,
      }),
    ]);

    const updatedRecipe = await RecipeService.updateRecipe(createdRecipe.id, {
      name: 'Cookie recheado premium',
      description: 'Versao final',
      quantity: 10,
      sellingValue: 8,
      groupId: 'group-1',
      ingredients: [
        {
          ingredientId: 'product-2',
          quantity: 3,
        },
      ],
      packings: [],
    });

    expect(updatedRecipe).toEqual(
      expect.objectContaining({
        id: createdRecipe.id,
        name: 'Cookie recheado premium',
        description: 'Versao final',
        groupName: 'Brigadeiros',
        totalCost: 0.056962025316455694,
      }),
    );
  });

  it('returns recipe details by id and deletes existing recipes', async () => {
    const { RecipeService } = await import('../../src/renderer/services/recipe-service');

    const recipe = await RecipeService.getRecipeById('recipe-1');

    expect(recipe).toEqual(
      expect.objectContaining({
        id: 'recipe-1',
        groupId: 'group-1',
      }),
    );

    await RecipeService.deleteRecipe('recipe-1');

    expect(await RecipeService.getRecipeById('recipe-1')).toBeUndefined();
  });
});
