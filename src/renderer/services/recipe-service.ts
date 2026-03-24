import type {
  ICreateRecipe,
  IngredientDto,
  IReadRecipe,
  IRecipeIngredient,
  IRecipePacking,
  PackingDto,
} from '../../shared/recipes';
import type { IReadPacking } from '../../shared/packings';
import type { IReadProduct } from '../../shared/products';
import { UnitOfMeasure } from '../../shared/unit-of-measure';
import type { HttpClientError } from './http/client';
import { getRecipeHttpClient } from './http/domain-clients';
import { PackingService } from './packing-service';
import { ProductService } from './product-service';

type ApiRecipe = Omit<IReadRecipe, 'ingredients' | 'packings'> & {
  ingredients: IngredientDto[];
  packings: PackingDto[];
};

type RecipeMutationPayload = Omit<ICreateRecipe, 'ingredients' | 'packings'> & {
  ingredients: IngredientDto[];
  packings: PackingDto[];
};

const buildIngredient = (
  ingredient: IngredientDto,
  products: IReadProduct[],
): IRecipeIngredient => {
  const source = products.find((product) => product.id === ingredient.productId);

  return {
    ingredientId: ingredient.productId,
    quantity: ingredient.quantity,
    name: ingredient.productName,
    unitOfMeasure: source?.unitOfMeasure ?? UnitOfMeasure.un,
    unitPrice: ingredient.ingredientPrice,
    totalCost: ingredient.ingredientPrice * ingredient.quantity,
  };
};

const buildPacking = (packing: PackingDto, packings: IReadPacking[]): IRecipePacking => {
  const source = packings.find((currentPacking) => currentPacking.id === packing.packingId);

  return {
    packingId: packing.packingId,
    quantity: packing.quantity,
    name: packing.packingName,
    unitOfMeasure: source?.unitOfMeasure ?? UnitOfMeasure.un,
    unitPrice: packing.packingUnitPrice,
    totalCost: packing.packingUnitPrice * packing.quantity,
  };
};

const hydrateRecipe = (
  recipe: ApiRecipe,
  products: IReadProduct[],
  packings: IReadPacking[],
): IReadRecipe => ({
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    quantity: recipe.quantity,
    sellingValue: recipe.sellingValue,
    groupId: recipe.groupId,
    groupName: recipe.groupName,
    ingredients: recipe.ingredients.map((ingredient) => buildIngredient(ingredient, products)),
    packings: recipe.packings.map((packing) => buildPacking(packing, packings)),
    totalCost: recipe.totalCost,
  });

const buildMissingReferenceError = (referenceType: 'ingrediente' | 'embalagem', id: string): Error =>
  new Error(`Não foi possível localizar o ${referenceType} ${id}.`);

const buildRecipePayload = (
  payload: ICreateRecipe,
  products: IReadProduct[],
  packings: IReadPacking[],
): RecipeMutationPayload => ({
    name: payload.name,
    description: payload.description,
    quantity: payload.quantity,
    sellingValue: payload.sellingValue,
    groupId: payload.groupId,
    ingredients: payload.ingredients.map((ingredient) => {
      const source = products.find((product) => product.id === ingredient.ingredientId);

      if (!source) {
        throw buildMissingReferenceError('ingrediente', ingredient.ingredientId);
      }

      return {
        productId: ingredient.ingredientId,
        productName: source.name,
        quantity: ingredient.quantity,
        ingredientPrice: source.unitPrice,
      };
    }),
    packings: payload.packings.map((packing) => {
      const source = packings.find((packingOption) => packingOption.id === packing.packingId);

      if (!source) {
        throw buildMissingReferenceError('embalagem', packing.packingId);
      }

      return {
        packingId: packing.packingId,
        packingName: source.name,
        quantity: packing.quantity,
        packingUnitPrice: source.packingUnitPrice,
      };
    }),
  });

export const RecipeService = {
  async getAllRecipes(): Promise<IReadRecipe[]> {
    const [products, packings, response] = await Promise.all([
      ProductService.getAllProducts(),
      PackingService.getAllPackings(),
      getRecipeHttpClient().get<ApiRecipe[]>('/'),
    ]);

    return response.data.map((recipe) => hydrateRecipe(recipe, products, packings));
  },

  async getRecipeById(id: string): Promise<IReadRecipe | undefined> {
    try {
      const [products, packings, response] = await Promise.all([
        ProductService.getAllProducts(),
        PackingService.getAllPackings(),
        getRecipeHttpClient().get<ApiRecipe>(`/${id}`),
      ]);

      return hydrateRecipe(response.data, products, packings);
    } catch (error) {
      if ((error as HttpClientError).status === 404) {
        return undefined;
      }

      throw error;
    }
  },

  async createRecipe(payload: ICreateRecipe): Promise<IReadRecipe> {
    const [products, packings] = await Promise.all([
      ProductService.getAllProducts(),
      PackingService.getAllPackings(),
    ]);
    const recipePayload = buildRecipePayload(payload, products, packings);
    const response = await getRecipeHttpClient().post<ApiRecipe>('/', recipePayload);

    return hydrateRecipe(response.data, products, packings);
  },

  async updateRecipe(id: string, payload: ICreateRecipe): Promise<IReadRecipe> {
    const [products, packings] = await Promise.all([
      ProductService.getAllProducts(),
      PackingService.getAllPackings(),
    ]);
    const recipePayload = buildRecipePayload(payload, products, packings);
    const response = await getRecipeHttpClient().put<ApiRecipe>(`/${id}`, recipePayload);

    return hydrateRecipe(response.data, products, packings);
  },

  async deleteRecipe(id: string): Promise<void> {
    await getRecipeHttpClient().delete(`/${id}`);
  },
};
