import { app } from 'electron';
import path from 'node:path';

import { GroupService } from './group-service';
import { PackingService } from './packing-service';
import { ProductService } from './product-service';
import { RecipeService } from './recipe-service';
import { AppDataStore } from '../infra/app-data-store';

export interface BackendServices {
  groups: GroupService;
  packings: PackingService;
  products: ProductService;
  recipes: RecipeService;
}

let cachedBackendServices: BackendServices | undefined;

const createDataStore = (): AppDataStore =>
  new AppDataStore(path.join(app.getPath('userData'), 'data', 'gastos-produtos.json'));

export const createBackendServices = (): BackendServices => {
  const store = createDataStore();

  return {
    products: new ProductService(store),
    packings: new PackingService(store),
    groups: new GroupService(store),
    recipes: new RecipeService(store),
  };
};

export const getBackendServices = (): BackendServices => {
  if (!cachedBackendServices) {
    cachedBackendServices = createBackendServices();
  }

  return cachedBackendServices;
};
