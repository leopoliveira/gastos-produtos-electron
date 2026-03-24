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

  it('returns zero unit price for products with zero quantity and does not add extra validation', async () => {
    const createdProduct = await services.products.create({
      name: '',
      price: -10,
      quantity: 0,
      unitOfMeasure: UnitOfMeasure.un,
    });

    await expect(services.products.getById(createdProduct.productId)).resolves.toEqual(
      expect.objectContaining({
        id: createdProduct.productId,
        name: '',
        price: -10,
        quantity: 0,
        unitPrice: 0,
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

  it('returns zero unit price for packings with zero quantity and does not add extra validation', async () => {
    const createdPacking = await services.packings.create({
      name: '',
      description: undefined,
      price: -5,
      quantity: 0,
      unitOfMeasure: UnitOfMeasure.un,
    });

    await expect(services.packings.getById(createdPacking.packingId)).resolves.toEqual(
      expect.objectContaining({
        id: createdPacking.packingId,
        name: '',
        price: -5,
        quantity: 0,
        packingUnitPrice: 0,
      }),
    );
  });

  it('validates group names and blocks deletion when an active recipe still references the group', async () => {
    await expect(
      services.groups.create({
        name: '   ',
        description: 'Inválido',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'InvalidOperationError',
        message: 'Nome do grupo é obrigatório.',
      }),
    );

    const group = await services.groups.create({
      name: 'Brigadeiros',
      description: 'Receitas de brigadeiro',
    });
    const recipe = await services.recipes.create({
      name: 'Brigadeiro tradicional',
      description: 'Receita',
      quantity: 20,
      sellingValue: 3,
      groupId: group.id,
      ingredients: [],
      packings: [],
    });

    await expect(services.groups.delete(group.id)).rejects.toEqual(
      expect.objectContaining({
        name: 'InvalidOperationError',
        message: 'Não é possível deletar um grupo que está em uso por receitas.',
      }),
    );
    await expect(services.recipes.delete(recipe.recipeId)).resolves.toBeUndefined();
    await expect(services.groups.delete(group.id)).resolves.toBeUndefined();
    await expect(services.groups.getById(group.id)).rejects.toEqual(
      expect.objectContaining({
        name: 'NotFoundError',
        message: 'Grupo não encontrado.',
      }),
    );
  });

  it('requires a non-blank name on update and preserves the exact not-found message', async () => {
    const group = await services.groups.create({
      name: 'Salgados',
      description: 'Linha salgada',
    });

    await expect(
      services.groups.update(group.id, {
        name: 'Salgados assados',
        description: 'Linha salgada atualizada',
      }),
    ).resolves.toBeUndefined();
    await expect(services.groups.getById(group.id)).resolves.toEqual({
      id: group.id,
      name: 'Salgados assados',
      description: 'Linha salgada atualizada',
    });

    await expect(
      services.groups.update(group.id, {
        name: '  ',
        description: 'Inválido',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'InvalidOperationError',
        message: 'Nome do grupo é obrigatório.',
      }),
    );

    await expect(services.groups.getById('missing-group')).rejects.toEqual(
      expect.objectContaining({
        name: 'NotFoundError',
        message: 'Grupo não encontrado.',
      }),
    );

    await expect(services.groups.update('missing-group', { name: 'Atualizado' })).rejects.toEqual(
      expect.objectContaining({
        name: 'NotFoundError',
        message: 'Grupo não encontrado.',
      }),
    );
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

  it('keeps recipe snapshots immutable after product and packing changes', async () => {
    const product = await services.products.create({
      name: 'Leite condensado',
      price: 8,
      quantity: 1,
      unitOfMeasure: UnitOfMeasure.un,
    });
    const packing = await services.packings.create({
      name: 'Caixa branca',
      description: 'Embalagem base',
      price: 12,
      quantity: 12,
      unitOfMeasure: UnitOfMeasure.box,
    });

    const recipe = await services.recipes.create({
      name: 'Brigadeiro branco',
      description: 'Snapshot',
      quantity: 10,
      sellingValue: 2.5,
      ingredients: [
        {
          productId: product.productId,
          productName: 'Leite condensado',
          quantity: 1,
          ingredientPrice: 8,
        },
      ],
      packings: [
        {
          packingId: packing.packingId,
          packingName: 'Caixa branca',
          quantity: 1,
          packingUnitPrice: 1,
        },
      ],
    });

    await services.products.update(product.productId, {
      name: 'Leite condensado premium',
      price: 10,
      quantity: 1,
      unitOfMeasure: UnitOfMeasure.kg,
    });
    await services.packings.update(packing.packingId, {
      name: 'Caixa branca premium',
      description: 'Embalagem atualizada',
      price: 24,
      quantity: 12,
      unitOfMeasure: UnitOfMeasure.un,
    });

    await expect(services.recipes.getById(recipe.recipeId)).resolves.toEqual(
      expect.objectContaining({
        totalCost: 9,
        ingredients: [
          expect.objectContaining({
            ingredientId: product.productId,
            name: 'Leite condensado',
            unitPrice: 8,
            totalCost: 8,
            unitOfMeasure: UnitOfMeasure.kg,
          }),
        ],
        packings: [
          expect.objectContaining({
            packingId: packing.packingId,
            name: 'Caixa branca',
            unitPrice: 1,
            totalCost: 1,
            unitOfMeasure: UnitOfMeasure.un,
          }),
        ],
      }),
    );
  });

  it('allows recipes without group and with empty ingredient and packing lists', async () => {
    const recipe = await services.recipes.create({
      name: '',
      description: undefined,
      quantity: undefined,
      sellingValue: undefined,
      groupId: undefined,
      ingredients: [],
      packings: [],
    });

    await expect(services.recipes.getById(recipe.recipeId)).resolves.toEqual(
      expect.objectContaining({
        id: recipe.recipeId,
        name: '',
        groupId: undefined,
        quantity: 0,
        sellingValue: 0,
        ingredients: [],
        packings: [],
        totalCost: 0,
      }),
    );
  });
});
