import type { AppApi } from '../../shared/ipc';

export const getAppApi = (): AppApi => {
  if (!window.appApi) {
    throw new Error('Electron preload API is not available.');
  }

  return window.appApi;
};
