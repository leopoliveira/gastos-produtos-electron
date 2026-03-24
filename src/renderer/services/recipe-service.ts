import type {
  ICreateRecipe,
  IReadRecipe,
  IRecipeIngredient,
  IRecipeIngredientInput,
  IRecipePacking,
  IRecipePackingInput,
} from '../../shared/recipes';
import type { IReadGroup } from '../../shared/groups';
import type { IReadPacking } from '../../shared/packings';
import type { IReadProduct } from '../../shared/products';
import { UnitOfMeasure } from '../../shared/unit-of-measure';
import { GroupService } from './group-service';
import { PackingService } from './packing-service';
import { ProductService } from './product-service';

type StoredRecipe = Omit<ICreateRecipe, 'ingredients' | 'packings'> & {
  id: string;
  ingredients: IRecipeIngredientInput[];
  packings: IRecipePackingInput[];
};

let recipesStore: StoredRecipe[] = [
  {
    id: 'recipe-1',
    name: 'Brigadeiro Tradicional',
    description: 'Receita base para brigadeiros enrolados.',
    quantity: 30,
    sellingValue: 2.5,
    groupId: 'group-1',
    ingredients: [
      {
        ingredientId: 'product-1',
        quantity: 0.08,
      },
      {
        ingredientId: 'product-2',
        quantity: 2,
      },
    ],
    packings: [
      {
        packingId: 'packing-1',
        quantity: 1,
      },
    ],
  },
];

const buildIngredient = (
  ingredient: IRecipeIngredientInput,
  products: IReadProduct[],
): IRecipeIngredient => {
  const source = products.find((product) => product.id === ingredient.ingredientId);

  return {
    ingredientId: ingredient.ingredientId,
    quantity: ingredient.quantity,
    name: source?.name ?? 'Ingrediente removido',
    unitOfMeasure: source?.unitOfMeasure ?? UnitOfMeasure.un,
    unitPrice: source?.unitPrice ?? 0,
    totalCost: (source?.unitPrice ?? 0) * ingredient.quantity,
  };
};

const buildPacking = (
  packing: IRecipePackingInput,
  packings: IReadPacking[],
): IRecipePacking => {
  const source = packings.find((currentPacking) => currentPacking.id === packing.packingId);

  return {
    packingId: packing.packingId,
    quantity: packing.quantity,
    name: source?.name ?? 'Embalagem removida',
    unitOfMeasure: source?.unitOfMeasure ?? UnitOfMeasure.un,
    unitPrice: source?.packingUnitPrice ?? 0,
    totalCost: (source?.packingUnitPrice ?? 0) * packing.quantity,
  };
};

const hydrateRecipe = async (recipe: StoredRecipe): Promise<IReadRecipe> => {
  const [groups, products, packings] = await Promise.all([
    GroupService.getAllGroups(),
    ProductService.getAllIngredientsDto(),
    PackingService.getAllPackingsDto(),
  ]);
  const ingredients = recipe.ingredients.map((ingredient) => buildIngredient(ingredient, products));
  const recipePackings = recipe.packings.map((packing) => buildPacking(packing, packings));
  const totalCost =
    ingredients.reduce((sum, ingredient) => sum + ingredient.totalCost, 0) +
    recipePackings.reduce((sum, packing) => sum + packing.totalCost, 0);
  const group = groups.find((currentGroup) => currentGroup.id === recipe.groupId);

  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    quantity: recipe.quantity,
    sellingValue: recipe.sellingValue,
    groupId: recipe.groupId,
    groupName: group?.name,
    ingredients,
    packings: recipePackings,
    totalCost,
  };
};

export const RecipeService = {
  async getAllRecipes(): Promise<IReadRecipe[]> {
    return Promise.all(recipesStore.map((recipe) => hydrateRecipe(recipe)));
  },

  async getRecipeById(id: string): Promise<IReadRecipe | undefined> {
    const recipe = recipesStore.find((currentRecipe) => currentRecipe.id === id);
    if (!recipe) {
      return undefined;
    }

    return hydrateRecipe(recipe);
  },

  async createRecipe(payload: ICreateRecipe): Promise<IReadRecipe> {
    const recipe: StoredRecipe = {
      id: `recipe-${Date.now()}`,
      name: payload.name.trim(),
      description: payload.description?.trim(),
      quantity: payload.quantity,
      sellingValue: payload.sellingValue,
      groupId: payload.groupId,
      ingredients: payload.ingredients.map((ingredient) => ({ ...ingredient })),
      packings: payload.packings.map((packing) => ({ ...packing })),
    };

    recipesStore = [...recipesStore, recipe];
    return hydrateRecipe(recipe);
  },

  async updateRecipe(id: string, payload: ICreateRecipe): Promise<IReadRecipe> {
    const recipe: StoredRecipe = {
      id,
      name: payload.name.trim(),
      description: payload.description?.trim(),
      quantity: payload.quantity,
      sellingValue: payload.sellingValue,
      groupId: payload.groupId,
      ingredients: payload.ingredients.map((ingredient) => ({ ...ingredient })),
      packings: payload.packings.map((packing) => ({ ...packing })),
    };

    recipesStore = recipesStore.map((currentRecipe) =>
      currentRecipe.id === id ? recipe : currentRecipe,
    );

    return hydrateRecipe(recipe);
  },

  async deleteRecipe(id: string): Promise<void> {
    recipesStore = recipesStore.filter((recipe) => recipe.id !== id);
  },
};
