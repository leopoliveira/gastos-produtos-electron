import { contextBridge, ipcRenderer } from 'electron';

import { ipcChannels, type AppApi } from '../shared/ipc';

const appApi: AppApi = {
  products: {
    list: () => ipcRenderer.invoke(ipcChannels.products.list),
    getById: (id) => ipcRenderer.invoke(ipcChannels.products.getById, { id }),
    create: (payload) => ipcRenderer.invoke(ipcChannels.products.create, payload),
    update: (id, payload) =>
      ipcRenderer.invoke(ipcChannels.products.update, { id, payload }),
    delete: (id) => ipcRenderer.invoke(ipcChannels.products.delete, { id }),
  },
  packings: {
    list: () => ipcRenderer.invoke(ipcChannels.packings.list),
    getById: (id) => ipcRenderer.invoke(ipcChannels.packings.getById, { id }),
    create: (payload) => ipcRenderer.invoke(ipcChannels.packings.create, payload),
    update: (id, payload) =>
      ipcRenderer.invoke(ipcChannels.packings.update, { id, payload }),
    delete: (id) => ipcRenderer.invoke(ipcChannels.packings.delete, { id }),
  },
  groups: {
    list: () => ipcRenderer.invoke(ipcChannels.groups.list),
    getById: (id) => ipcRenderer.invoke(ipcChannels.groups.getById, { id }),
    create: (payload) => ipcRenderer.invoke(ipcChannels.groups.create, payload),
    update: (id, payload) =>
      ipcRenderer.invoke(ipcChannels.groups.update, { id, payload }),
    delete: (id) => ipcRenderer.invoke(ipcChannels.groups.delete, { id }),
  },
  recipes: {
    list: (groupId) => ipcRenderer.invoke(ipcChannels.recipes.list, { groupId }),
    getById: (id) => ipcRenderer.invoke(ipcChannels.recipes.getById, { id }),
    create: (payload) => ipcRenderer.invoke(ipcChannels.recipes.create, payload),
    update: (id, payload) =>
      ipcRenderer.invoke(ipcChannels.recipes.update, { id, payload }),
    delete: (id) => ipcRenderer.invoke(ipcChannels.recipes.delete, { id }),
  },
};

contextBridge.exposeInMainWorld('appApi', appApi);
