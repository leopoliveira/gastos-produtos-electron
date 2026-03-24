import type { ICreateGroup, IReadGroup, IUpdateGroup } from './groups';
import type { ICreatePacking, IReadPacking } from './packings';
import type { ICreateProduct, IReadProduct } from './products';
import type { ICreateRecipe, IReadRecipe } from './recipes';

export const ipcChannels = {
  groups: {
    create: 'groups:create',
    delete: 'groups:delete',
    list: 'groups:list',
    update: 'groups:update',
  },
  packings: {
    create: 'packings:create',
    delete: 'packings:delete',
    list: 'packings:list',
    update: 'packings:update',
  },
  products: {
    create: 'products:create',
    delete: 'products:delete',
    list: 'products:list',
    update: 'products:update',
  },
  recipes: {
    create: 'recipes:create',
    delete: 'recipes:delete',
    getById: 'recipes:get-by-id',
    list: 'recipes:list',
    update: 'recipes:update',
  },
} as const;

export interface EntityIdPayload {
  id: string;
}

export interface UpdateEntityPayload<TPayload> extends EntityIdPayload {
  payload: TPayload;
}

export interface RecipesListPayload {
  groupId?: string;
}

export interface ProductApi {
  create(payload: ICreateProduct): Promise<IReadProduct>;
  delete(id: string): Promise<void>;
  list(): Promise<IReadProduct[]>;
  update(id: string, payload: ICreateProduct): Promise<IReadProduct>;
}

export interface PackingApi {
  create(payload: ICreatePacking): Promise<IReadPacking>;
  delete(id: string): Promise<void>;
  list(): Promise<IReadPacking[]>;
  update(id: string, payload: ICreatePacking): Promise<IReadPacking>;
}

export interface GroupApi {
  create(payload: ICreateGroup): Promise<IReadGroup>;
  delete(id: string): Promise<void>;
  list(): Promise<IReadGroup[]>;
  update(id: string, payload: IUpdateGroup): Promise<IReadGroup>;
}

export interface RecipeApi {
  create(payload: ICreateRecipe): Promise<IReadRecipe>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<IReadRecipe | undefined>;
  list(groupId?: string): Promise<IReadRecipe[]>;
  update(id: string, payload: ICreateRecipe): Promise<IReadRecipe>;
}

export interface AppApi {
  groups: GroupApi;
  packings: PackingApi;
  products: ProductApi;
  recipes: RecipeApi;
}
