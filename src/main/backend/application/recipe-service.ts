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
import type { DatabaseProvider } from '../infra/sqlite/database';
import { runInTransaction } from '../infra/sqlite/database';
import { mainLog } from '../../logging/app-logger';

const RECIPE_NOT_FOUND_MESSAGE = 'Recipe not found.';
const RECIPE_NOT_FOUND_DELETE_MESSAGE = 'Recipe not found. Nothing will be deleted.';

interface RecipeRow {
  createdAt: string;
  description: string | null;
  groupId: string | null;
  id: string;
  isDeleted: number;
  name: string;
  quantity: number | null;
  sellingValue: number | null;
  totalCost: number;
  updatedAt: string;
}

interface RecipeIngredientRow extends RecipeIngredientRecord {
  recipeId: string;
}

interface RecipePackingRow extends RecipePackingRecord {
  recipeId: string;
}

const calculateRecipeTotalCost = (
  ingredients: RecipeIngredientRecord[],
  packings: RecipePackingRecord[],
): number =>
  ingredients.reduce((total, ingredient) => total + ingredient.quantity * ingredient.ingredientPrice, 0) +
  packings.reduce((total, packing) => total + packing.quantity * packing.packingUnitPrice, 0);

const toRecipeRecord = (recipe: RecipeRow): RecipeRecord => ({
  id: recipe.id,
  name: recipe.name,
  description: recipe.description ?? undefined,
  quantity: recipe.quantity ?? 0,
  sellingValue: recipe.sellingValue ?? 0,
  groupId: recipe.groupId ?? undefined,
  totalCost: recipe.totalCost,
  createdAt: recipe.createdAt,
  updatedAt: recipe.updatedAt,
  isDeleted: recipe.isDeleted === 1,
  ingredients: [],
  packings: [],
});

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
  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async getAll(groupId?: string): Promise<GetRecipeResponse[]> {
    const database = await this.databaseProvider();
    const recipeRows = await database.all<RecipeRow[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description,
        "Quantity" AS quantity,
        "SellingValue" AS sellingValue,
        "TotalCost" AS totalCost,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted,
        "GroupId" AS groupId
      FROM "Recipes"
      WHERE "IsDeleted" = 0
        AND (? IS NULL OR "GroupId" = ?)
      ORDER BY "CreatedAt" ASC;`,
      groupId ?? null,
      groupId ?? null,
    );

    return this.hydrateRecipes(recipeRows);
  }

  async getById(id: string): Promise<GetRecipeResponse> {
    const database = await this.databaseProvider();
    const recipeRow = await database.get<RecipeRow>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description,
        "Quantity" AS quantity,
        "SellingValue" AS sellingValue,
        "TotalCost" AS totalCost,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted,
        "GroupId" AS groupId
      FROM "Recipes"
      WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!recipeRow) {
      throw new NotFoundError(RECIPE_NOT_FOUND_MESSAGE);
    }

    const [recipe] = await this.hydrateRecipes([recipeRow]);

    return recipe;
  }

  async create(payload: AddRecipeRequest): Promise<AddRecipeResponse> {
    const database = await this.databaseProvider();
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

    await runInTransaction(database, async () => {
      await database.run(
        `INSERT INTO "Recipes" (
          "Id",
          "Name",
          "Description",
          "Quantity",
          "SellingValue",
          "TotalCost",
          "CreatedAt",
          "UpdatedAt",
          "IsDeleted",
          "GroupId"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        recipe.id,
        recipe.name,
        recipe.description ?? null,
        recipe.quantity,
        recipe.sellingValue,
        recipe.totalCost,
        recipe.createdAt,
        recipe.updatedAt,
        recipe.isDeleted ? 1 : 0,
        recipe.groupId ?? null,
      );

      for (const ingredient of ingredients) {
        await database.run(
          `INSERT INTO "RecipeIngredients" (
            "RecipeId",
            "ProductId",
            "ProductName",
            "Quantity",
            "IngredientPrice"
          ) VALUES (?, ?, ?, ?, ?);`,
          recipe.id,
          ingredient.productId,
          ingredient.productName,
          ingredient.quantity,
          ingredient.ingredientPrice,
        );
      }

      for (const packing of packings) {
        await database.run(
          `INSERT INTO "RecipePackings" (
            "RecipeId",
            "PackingId",
            "PackingName",
            "Quantity",
            "UnitPrice"
          ) VALUES (?, ?, ?, ?, ?);`,
          recipe.id,
          packing.packingId,
          packing.packingName,
          packing.quantity,
          packing.packingUnitPrice,
        );
      }
    });

    mainLog.info('[backend:recipes] Created recipe', {
      recipeId: recipe.id,
      name: recipe.name,
      groupId: recipe.groupId,
      ingredientCount: ingredients.length,
      packingCount: packings.length,
      totalCost: recipe.totalCost,
    });

    return { recipeId: recipe.id };
  }

  async update(id: string, payload: UpdateRecipeDto): Promise<void> {
    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Recipes" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError(RECIPE_NOT_FOUND_MESSAGE);
    }

    const ingredients = buildIngredientSnapshots(payload.ingredients);
    const packings = buildPackingSnapshots(payload.packings);
    const totalCost = calculateRecipeTotalCost(ingredients, packings);

    await runInTransaction(database, async () => {
      await database.run(
        `UPDATE "Recipes"
        SET
          "Name" = ?,
          "Description" = ?,
          "Quantity" = ?,
          "SellingValue" = ?,
          "GroupId" = ?,
          "TotalCost" = ?,
          "UpdatedAt" = ?
        WHERE "Id" = ?;`,
        payload.name,
        payload.description ?? null,
        payload.quantity ?? 0,
        payload.sellingValue ?? 0,
        payload.groupId ?? null,
        totalCost,
        new Date().toISOString(),
        id,
      );

      await database.run(`DELETE FROM "RecipeIngredients" WHERE "RecipeId" = ?;`, id);
      await database.run(`DELETE FROM "RecipePackings" WHERE "RecipeId" = ?;`, id);

      for (const ingredient of ingredients) {
        await database.run(
          `INSERT INTO "RecipeIngredients" (
            "RecipeId",
            "ProductId",
            "ProductName",
            "Quantity",
            "IngredientPrice"
          ) VALUES (?, ?, ?, ?, ?);`,
          id,
          ingredient.productId,
          ingredient.productName,
          ingredient.quantity,
          ingredient.ingredientPrice,
        );
      }

      for (const packing of packings) {
        await database.run(
          `INSERT INTO "RecipePackings" (
            "RecipeId",
            "PackingId",
            "PackingName",
            "Quantity",
            "UnitPrice"
          ) VALUES (?, ?, ?, ?, ?);`,
          id,
          packing.packingId,
          packing.packingName,
          packing.quantity,
          packing.packingUnitPrice,
        );
      }
    });

    mainLog.info('[backend:recipes] Updated recipe', {
      recipeId: id,
      ingredientCount: ingredients.length,
      packingCount: packings.length,
      totalCost,
    });
  }

  async delete(id: string): Promise<void> {
    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Recipes" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError(RECIPE_NOT_FOUND_DELETE_MESSAGE);
    }

    await database.run(
      `UPDATE "Recipes"
      SET
        "IsDeleted" = 1,
        "UpdatedAt" = ?
      WHERE "Id" = ?;`,
      new Date().toISOString(),
      id,
    );

    mainLog.info('[backend:recipes] Soft-deleted recipe', { recipeId: id });
  }

  private async hydrateRecipes(recipeRows: RecipeRow[]): Promise<GetRecipeResponse[]> {
    const recipeIds = recipeRows.map((recipe) => recipe.id);
    const recipesById = new Map<string, RecipeRecord>(
      recipeRows.map((recipe) => [recipe.id, toRecipeRecord(recipe)]),
    );

    for (const ingredient of await this.getRecipeIngredients(recipeIds)) {
      recipesById.get(ingredient.recipeId)?.ingredients.push({
        productId: ingredient.productId,
        productName: ingredient.productName,
        quantity: ingredient.quantity,
        ingredientPrice: ingredient.ingredientPrice,
      });
    }

    for (const packing of await this.getRecipePackings(recipeIds)) {
      recipesById.get(packing.recipeId)?.packings.push({
        packingId: packing.packingId,
        packingName: packing.packingName,
        quantity: packing.quantity,
        packingUnitPrice: packing.packingUnitPrice,
      });
    }

    const [products, packings, groups] = await Promise.all([
      this.getProducts(),
      this.getPackings(),
      this.getGroups(),
    ]);

    return recipeRows
      .map((recipe) => recipesById.get(recipe.id))
      .filter((recipe): recipe is RecipeRecord => Boolean(recipe))
      .map((recipe) => toReadRecipe(recipe, products, packings, groups));
  }

  private async getRecipeIngredients(recipeIds: string[]): Promise<RecipeIngredientRow[]> {
    if (recipeIds.length === 0) {
      return [];
    }

    const database = await this.databaseProvider();
    const placeholders = recipeIds.map(() => '?').join(', ');

    return database.all<RecipeIngredientRow[]>(
      `SELECT
        "RecipeId" AS recipeId,
        "ProductId" AS productId,
        "ProductName" AS productName,
        "Quantity" AS quantity,
        "IngredientPrice" AS ingredientPrice
      FROM "RecipeIngredients"
      WHERE "RecipeId" IN (${placeholders})
      ORDER BY "RecipeId" ASC, "ProductId" ASC;`,
      ...recipeIds,
    );
  }

  private async getRecipePackings(recipeIds: string[]): Promise<RecipePackingRow[]> {
    if (recipeIds.length === 0) {
      return [];
    }

    const database = await this.databaseProvider();
    const placeholders = recipeIds.map(() => '?').join(', ');

    return database.all<RecipePackingRow[]>(
      `SELECT
        "RecipeId" AS recipeId,
        "PackingId" AS packingId,
        "PackingName" AS packingName,
        "Quantity" AS quantity,
        "UnitPrice" AS packingUnitPrice
      FROM "RecipePackings"
      WHERE "RecipeId" IN (${placeholders})
      ORDER BY "RecipeId" ASC, "PackingId" ASC;`,
      ...recipeIds,
    );
  }

  private async getProducts(): Promise<ProductRecord[]> {
    const database = await this.databaseProvider();

    return database.all<ProductRecord[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Price" AS price,
        "Quantity" AS quantity,
        "UnitOfMeasure" AS unitOfMeasure,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Products";`,
    );
  }

  private async getPackings(): Promise<PackingRecord[]> {
    const database = await this.databaseProvider();

    return database.all<PackingRecord[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description,
        "Price" AS price,
        "Quantity" AS quantity,
        "UnitOfMeasure" AS unitOfMeasure,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Packings";`,
    );
  }

  private async getGroups(): Promise<GroupRecord[]> {
    const database = await this.databaseProvider();

    return database.all<GroupRecord[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Groups";`,
    );
  }
}
