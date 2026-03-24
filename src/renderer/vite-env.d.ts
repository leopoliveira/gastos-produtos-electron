/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRODUCT_API_URL?: string;
  readonly VITE_PACKING_API_URL?: string;
  readonly VITE_RECIPE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
