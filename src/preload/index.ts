import { contextBridge, ipcRenderer } from 'electron';

import { ipcChannels, parseIpcError, type AppApi } from '../shared/ipc';

const invoke = async <TResult>(channel: string, payload?: unknown): Promise<TResult> => {
  try {
    if (payload === undefined) {
      return await ipcRenderer.invoke(channel);
    }

    return await ipcRenderer.invoke(channel, payload);
  } catch (error) {
    if (error instanceof Error) {
      const ipcError = parseIpcError(error.message);

      if (ipcError) {
        throw {
          ...ipcError.problem,
          message: ipcError.message,
        };
      }
    }

    throw error;
  }
};

const appApi: AppApi = {
  backup: {
    exportBackup: () => invoke(ipcChannels.backup.export),
    importBackup: () => invoke(ipcChannels.backup.import),
  },
  logging: {
    write: (payload) => invoke(ipcChannels.logging.write, payload),
  },
  products: {
    list: () => invoke(ipcChannels.products.list),
    getById: (id) => invoke(ipcChannels.products.getById, { id }),
    create: (payload) => invoke(ipcChannels.products.create, payload),
    update: (id, payload) =>
      invoke(ipcChannels.products.update, { id, payload }),
    delete: (id) => invoke(ipcChannels.products.delete, { id }),
  },
  packings: {
    list: () => invoke(ipcChannels.packings.list),
    getById: (id) => invoke(ipcChannels.packings.getById, { id }),
    create: (payload) => invoke(ipcChannels.packings.create, payload),
    update: (id, payload) =>
      invoke(ipcChannels.packings.update, { id, payload }),
    delete: (id) => invoke(ipcChannels.packings.delete, { id }),
  },
  groups: {
    list: () => invoke(ipcChannels.groups.list),
    getById: (id) => invoke(ipcChannels.groups.getById, { id }),
    create: (payload) => invoke(ipcChannels.groups.create, payload),
    update: (id, payload) =>
      invoke(ipcChannels.groups.update, { id, payload }),
    delete: (id) => invoke(ipcChannels.groups.delete, { id }),
  },
  recipes: {
    list: (groupId) => invoke(ipcChannels.recipes.list, { groupId }),
    getById: (id) => invoke(ipcChannels.recipes.getById, { id }),
    create: (payload) => invoke(ipcChannels.recipes.create, payload),
    update: (id, payload) =>
      invoke(ipcChannels.recipes.update, { id, payload }),
    delete: (id) => invoke(ipcChannels.recipes.delete, { id }),
  },
};

contextBridge.exposeInMainWorld('appApi', appApi);
