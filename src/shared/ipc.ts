import type {
  AddGroupRequest,
  AddGroupResponse,
  GroupResponse,
  GroupWriteDto,
} from './groups';
import type {
  AddPackingRequest,
  AddPackingResponse,
  GetPackingResponse,
  UpdatePackingDto,
} from './packings';
import type {
  AddProductRequest,
  AddProductResponse,
  GetProductResponse,
  UpdateProductDto,
} from './products';
import type {
  AddRecipeRequest,
  AddRecipeResponse,
  GetRecipeResponse,
  UpdateRecipeDto,
} from './recipes';

export const ipcChannels = {
  groups: {
    create: 'groups:create',
    delete: 'groups:delete',
    getById: 'groups:get-by-id',
    list: 'groups:list',
    update: 'groups:update',
  },
  packings: {
    create: 'packings:create',
    delete: 'packings:delete',
    getById: 'packings:get-by-id',
    list: 'packings:list',
    update: 'packings:update',
  },
  products: {
    create: 'products:create',
    delete: 'products:delete',
    getById: 'products:get-by-id',
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
  create(payload: AddProductRequest): Promise<AddProductResponse>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<GetProductResponse>;
  list(): Promise<GetProductResponse[]>;
  update(id: string, payload: UpdateProductDto): Promise<void>;
}

export interface PackingApi {
  create(payload: AddPackingRequest): Promise<AddPackingResponse>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<GetPackingResponse>;
  list(): Promise<GetPackingResponse[]>;
  update(id: string, payload: UpdatePackingDto): Promise<void>;
}

export interface GroupApi {
  create(payload: AddGroupRequest): Promise<AddGroupResponse>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<GroupResponse>;
  list(): Promise<GroupResponse[]>;
  update(id: string, payload: GroupWriteDto): Promise<void>;
}

export interface RecipeApi {
  create(payload: AddRecipeRequest): Promise<AddRecipeResponse>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<GetRecipeResponse>;
  list(groupId?: string): Promise<GetRecipeResponse[]>;
  update(id: string, payload: UpdateRecipeDto): Promise<void>;
}

export interface AppApi {
  groups: GroupApi;
  packings: PackingApi;
  products: ProductApi;
  recipes: RecipeApi;
}
