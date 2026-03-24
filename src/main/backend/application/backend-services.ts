import { GroupService } from './group-service';
import { PackingService } from './packing-service';
import { ProductService } from './product-service';
import { RecipeService } from './recipe-service';
import { createDatabaseProvider } from '../infra/sqlite/database';

export interface BackendServices {
  groups: GroupService;
  packings: PackingService;
  products: ProductService;
  recipes: RecipeService;
}

let cachedBackendServices: BackendServices | undefined;

export const createBackendServices = (): BackendServices => {
  const databaseProvider = createDatabaseProvider();

  return {
    products: new ProductService(databaseProvider),
    packings: new PackingService(databaseProvider),
    groups: new GroupService(databaseProvider),
    recipes: new RecipeService(databaseProvider),
  };
};

export const getBackendServices = (): BackendServices => {
  if (!cachedBackendServices) {
    cachedBackendServices = createBackendServices();
  }

  return cachedBackendServices;
};
