// @vitest-environment node

import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { GroupService } from '../../src/main/backend/application/group-service';
import { PackingService } from '../../src/main/backend/application/packing-service';
import { ProductService } from '../../src/main/backend/application/product-service';
import { RecipeService } from '../../src/main/backend/application/recipe-service';
import { InvalidOperationError, NotFoundError } from '../../src/main/backend/domain/errors';
import { AppDataStore } from '../../src/main/backend/infra/app-data-store';
import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

const createServices = async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'gastos-produtos-'));
  const databasePath = path.join(tempDirectory, 'database.json');
  const store = new AppDataStore(databasePath);

  return {
    databasePath,
    store,
    products: new ProductService(store),
    packings: new PackingService(store),
    groups: new GroupService(store),
    recipes: new RecipeService(store),
  };
};

describe('main backend services', () => {
  let services: Awaited<ReturnType<typeof createServices>>;

  beforeEach(async () => {
    services = await createServices();
  });

  it('persists products and computes unit price from price and quantity', async () => {
    const createdProduct = await services.products.create({
      name: 'Chocolate em po',
      price: 18.9,
      quantity: 1,
      unitOfMeasure: UnitOfMeasure.kg,
    });

    expect(createdProduct.productId).toBeTruthy();

    const fetchedProduct = await services.products.getById(createdProduct.productId);

    expect(fetchedProduct.unitPrice).toBe(18.9);

    const persistedState = JSON.parse(await readFile(services.databasePath, 'utf8'));

    expect(persistedState.products).toHaveLength(1);
    expect(persistedState.products[0]).toEqual(
      expect.objectContaining({
        id: createdProduct.productId,
        name: 'Chocolate em po',
        isDeleted: false,
      }),
    );
  });

  it('updates and soft deletes packings while keeping deleted records out of listing', async () => {
    const createdPacking = await services.packings.create({
      name: 'Caixa kraft',
      description: 'Caixa para 4 brigadeiros',
      price: 20,
      quantity: 50,
      unitOfMeasure: UnitOfMeasure.box,
    });

    await services.packings.update(createdPacking.packingId, {
      name: 'Caixa kraft premium',
      description: 'Linha premium',
      price: 24,
      quantity: 60,
      unitOfMeasure: UnitOfMeasure.box,
    });

    const updatedPacking = await services.packings.getById(createdPacking.packingId);

    expect(updatedPacking).toEqual(
      expect.objectContaining({
        name: 'Caixa kraft premium',
        packingUnitPrice: 0.4,
      }),
    );

    await services.packings.delete(createdPacking.packingId);

    await expect(services.packings.getAll()).resolves.toEqual([]);
    await expect(services.packings.delete(createdPacking.packingId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('validates group names and blocks deletion when an active recipe still references the group', async () => {
    await expect(
      services.groups.create({
        name: '   ',
        description: 'Inválido',
      }),
    ).rejects.toEqual(expect.objectContaining({ message: 'Nome do grupo é obrigatório.' }));

    const group = await services.groups.create({
      name: 'Brigadeiros',
      description: 'Receitas de brigadeiro',
    });

    await services.store.mutate((state) => {
      state.recipes.push({
        id: 'recipe-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        name: 'Brigadeiro tradicional',
        description: 'Receita',
        quantity: 20,
        sellingValue: 3,
        totalCost: 15,
        groupId: group.id,
        ingredients: [],
        packings: [],
      });
    });

    await expect(services.groups.delete(group.id)).rejects.toBeInstanceOf(InvalidOperationError);
    await services.store.mutate((state) => {
      state.recipes[0].isDeleted = true;
    });
    await expect(services.groups.delete(group.id)).resolves.toBeUndefined();
  });

  it('creates, filters, updates and soft deletes recipes using ingredient and packing snapshots', async () => {
    const product = await services.products.create({
      name: 'Chocolate em po',
      price: 18.9,
      quantity: 1,
      unitOfMeasure: UnitOfMeasure.kg,
    });
    const packing = await services.packings.create({
      name: 'Caixa kraft',
      description: 'Caixa para 4 brigadeiros',
      price: 20,
      quantity: 50,
      unitOfMeasure: UnitOfMeasure.box,
    });
    const group = await services.groups.create({
      name: 'Brigadeiros',
      description: 'Receitas',
    });

    const recipe = await services.recipes.create({
      name: 'Brigadeiro tradicional',
      description: 'Receita base',
      quantity: 20,
      sellingValue: 3,
      groupId: group.id,
      ingredients: [
        {
          productId: product.productId,
          productName: 'Chocolate em po',
          quantity: 0.5,
          ingredientPrice: 18.9,
        },
      ],
      packings: [
        {
          packingId: packing.packingId,
          packingName: 'Caixa kraft',
          quantity: 2,
          packingUnitPrice: 0.4,
        },
      ],
    });

    expect(recipe.recipeId).toBeTruthy();

    const fetchedRecipe = await services.recipes.getById(recipe.recipeId);

    expect(fetchedRecipe).toEqual(
      expect.objectContaining({
        name: 'Brigadeiro tradicional',
        groupName: 'Brigadeiros',
        totalCost: 10.25,
      }),
    );
    expect(fetchedRecipe.ingredients).toEqual([
      expect.objectContaining({
        ingredientId: product.productId,
        name: 'Chocolate em po',
        unitOfMeasure: UnitOfMeasure.kg,
        unitPrice: 18.9,
        totalCost: 9.45,
      }),
    ]);
    expect(fetchedRecipe.packings).toEqual([
      expect.objectContaining({
        packingId: packing.packingId,
        name: 'Caixa kraft',
        unitOfMeasure: UnitOfMeasure.box,
        unitPrice: 0.4,
        totalCost: 0.8,
      }),
    ]);

    await expect(services.recipes.getAll(group.id)).resolves.toHaveLength(1);
    await expect(services.recipes.getAll('missing-group')).resolves.toEqual([]);

    await services.recipes.update(recipe.recipeId, {
      name: 'Brigadeiro gourmet',
      description: 'Receita atualizada',
      quantity: 24,
      sellingValue: 3.5,
      groupId: undefined,
      ingredients: [
        {
          productId: product.productId,
          productName: 'Chocolate em po',
          quantity: 1,
          ingredientPrice: 18.9,
        },
      ],
      packings: [],
    });

    const updatedRecipe = await services.recipes.getById(recipe.recipeId);

    expect(updatedRecipe).toEqual(
      expect.objectContaining({
        name: 'Brigadeiro gourmet',
        groupId: undefined,
        totalCost: 18.9,
      }),
    );

    await expect(services.recipes.getById(recipe.recipeId)).resolves.toEqual(
      expect.objectContaining({
        id: recipe.recipeId,
        totalCost: 18.9,
      }),
    );

    await expect(services.recipes.getById('missing-recipe')).rejects.toBeInstanceOf(NotFoundError);
    await expect(services.recipes.delete(recipe.recipeId)).resolves.toBeUndefined();
    await expect(services.recipes.getAll()).resolves.toEqual([]);
    await expect(services.recipes.delete(recipe.recipeId)).rejects.toBeInstanceOf(NotFoundError);
  });
});
