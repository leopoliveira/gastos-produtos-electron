const REQUEST_TIMEOUT_IN_MS = 15_000;

export interface ApiEnvironment {
  VITE_PRODUCT_API_URL?: string;
  VITE_PACKING_API_URL?: string;
  VITE_RECIPE_API_URL?: string;
}

export interface ApiBaseUrls {
  products: string;
  packings: string;
  recipes: string;
  groups: string;
}

const normalizeBaseUrl = (name: keyof ApiEnvironment, value?: string): string => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return normalizedValue.replace(/\/+$/, '');
};

const deriveGroupApiUrl = (recipeApiUrl: string): string => {
  if (recipeApiUrl.endsWith('/Recipe')) {
    return `${recipeApiUrl.slice(0, -'/Recipe'.length)}/Group`;
  }

  return `${recipeApiUrl}/Group`;
};

export const resolveApiBaseUrls = (environment: ApiEnvironment): ApiBaseUrls => {
  const products = normalizeBaseUrl('VITE_PRODUCT_API_URL', environment.VITE_PRODUCT_API_URL);
  const packings = normalizeBaseUrl('VITE_PACKING_API_URL', environment.VITE_PACKING_API_URL);
  const recipes = normalizeBaseUrl('VITE_RECIPE_API_URL', environment.VITE_RECIPE_API_URL);

  return {
    products,
    packings,
    recipes,
    groups: deriveGroupApiUrl(recipes),
  };
};

export const HTTP_REQUEST_TIMEOUT_IN_MS = REQUEST_TIMEOUT_IN_MS;
