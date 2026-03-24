import { describe, expect, it } from 'vitest';

import {
  HTTP_REQUEST_TIMEOUT_IN_MS,
  resolveApiBaseUrls,
} from '../../../src/renderer/services/http/api-config';

describe('resolveApiBaseUrls', () => {
  it('normalizes trailing slashes and derives the group url from recipe endpoint', () => {
    expect(
      resolveApiBaseUrls({
        VITE_PRODUCT_API_URL: 'https://api.example.com/Product/',
        VITE_PACKING_API_URL: 'https://api.example.com/Packing///',
        VITE_RECIPE_API_URL: 'https://api.example.com/Recipe/',
      }),
    ).toEqual({
      products: 'https://api.example.com/Product',
      packings: 'https://api.example.com/Packing',
      recipes: 'https://api.example.com/Recipe',
      groups: 'https://api.example.com/Group',
    });
  });

  it('throws when a required base url is missing', () => {
    expect(() =>
      resolveApiBaseUrls({
        VITE_PACKING_API_URL: 'https://api.example.com/Packing',
        VITE_RECIPE_API_URL: 'https://api.example.com/Recipe',
      }),
    ).toThrow('Missing environment variable: VITE_PRODUCT_API_URL');
  });
});

describe('HTTP_REQUEST_TIMEOUT_IN_MS', () => {
  it('matches the documented 15 second timeout', () => {
    expect(HTTP_REQUEST_TIMEOUT_IN_MS).toBe(15_000);
  });
});
