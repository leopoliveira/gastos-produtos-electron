import type { AxiosInstance } from 'axios';

import { resolveApiBaseUrls } from './api-config';
import { createHttpClient } from './client';

type DomainClients = {
  groupHttpClient: AxiosInstance;
  packingHttpClient: AxiosInstance;
  productHttpClient: AxiosInstance;
  recipeHttpClient: AxiosInstance;
};

let cachedDomainClients: DomainClients | undefined;

const createDomainClients = (): DomainClients => {
  const apiBaseUrls = resolveApiBaseUrls(import.meta.env);

  return {
    productHttpClient: createHttpClient(apiBaseUrls.products),
    packingHttpClient: createHttpClient(apiBaseUrls.packings),
    recipeHttpClient: createHttpClient(apiBaseUrls.recipes),
    groupHttpClient: createHttpClient(apiBaseUrls.groups),
  };
};

const getDomainClients = (): DomainClients => {
  if (!cachedDomainClients) {
    cachedDomainClients = createDomainClients();
  }

  return cachedDomainClients;
};

export const getProductHttpClient = (): AxiosInstance => getDomainClients().productHttpClient;
export const getPackingHttpClient = (): AxiosInstance => getDomainClients().packingHttpClient;
export const getRecipeHttpClient = (): AxiosInstance => getDomainClients().recipeHttpClient;
export const getGroupHttpClient = (): AxiosInstance => getDomainClients().groupHttpClient;
