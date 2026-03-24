/// <reference types="vite/client" />

import type { AppApi } from '../shared/ipc';

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    appApi: AppApi;
  }
}

export {};
