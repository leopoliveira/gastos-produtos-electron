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

export type RendererLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RendererLogPayload {
  context?: Record<string, string | number | boolean | null>;
  level: RendererLogLevel;
  message: string;
}

export const ipcChannels = {
  logging: {
    write: 'logging:write',
  },
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
  backup: {
    export: 'backup:export',
    import: 'backup:import',
  },
} as const;

export type BackupExportResult =
  | { canceled: true }
  | { canceled: false; filePath: string };

export type BackupImportResult = { canceled: true } | { canceled: false };

export interface EntityIdPayload {
  id: string;
}

export interface UpdateEntityPayload<TPayload> extends EntityIdPayload {
  payload: TPayload;
}

export interface RecipesListPayload {
  groupId?: string;
}

export interface IpcProblemDetails {
  code: 'internal_error' | 'invalid_operation' | 'not_found';
  detail: string;
  status: number;
  title: string;
}

export interface SerializedIpcError {
  detail: string;
  message: string;
  name: string;
  problem: IpcProblemDetails;
}

export const IPC_ERROR_PREFIX = '__APP_IPC_ERROR__:' as const;

export const serializeIpcError = (payload: SerializedIpcError): string =>
  `${IPC_ERROR_PREFIX}${JSON.stringify(payload)}`;

export const parseIpcError = (message: string): SerializedIpcError | undefined => {
  const prefixIndex = message.indexOf(IPC_ERROR_PREFIX);
  if (prefixIndex === -1) {
    return undefined;
  }

  const jsonPayload = message.slice(prefixIndex + IPC_ERROR_PREFIX.length);

  try {
    return JSON.parse(jsonPayload) as SerializedIpcError;
  } catch {
    return undefined;
  }
};

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

export interface LoggingApi {
  write(payload: RendererLogPayload): Promise<void>;
}

export interface BackupApi {
  exportBackup(): Promise<BackupExportResult>;
  importBackup(): Promise<BackupImportResult>;
}

export interface AppApi {
  backup: BackupApi;
  groups: GroupApi;
  logging: LoggingApi;
  packings: PackingApi;
  products: ProductApi;
  recipes: RecipeApi;
}
