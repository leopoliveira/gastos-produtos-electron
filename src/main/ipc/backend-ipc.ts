import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import {
  ipcChannels,
  type EntityIdPayload,
  type RecipesListPayload,
  type UpdateEntityPayload,
} from '../../shared/ipc';
import type { ICreateGroup, IUpdateGroup } from '../../shared/groups';
import type { ICreatePacking } from '../../shared/packings';
import type { ICreateProduct } from '../../shared/products';
import type { ICreateRecipe } from '../../shared/recipes';
import { getBackendServices } from '../backend/application/backend-services';

let handlersRegistered = false;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const assertTrustedSender = (event: IpcMainInvokeEvent): void => {
  const senderUrl = event.senderFrame.url;

  if (!senderUrl) {
    throw new Error('Unauthorized IPC sender.');
  }

  if (senderUrl.startsWith('file://')) {
    return;
  }

  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    throw new Error('Unauthorized IPC sender.');
  }

  const allowedOrigin = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin;

  if (new URL(senderUrl).origin !== allowedOrigin) {
    throw new Error('Unauthorized IPC sender.');
  }
};

const assertEntityIdPayload = (payload: unknown): EntityIdPayload => {
  if (!isObject(payload) || typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new Error('Invalid IPC payload: expected a non-empty id.');
  }

  return { id: payload.id };
};

const assertUpdatePayload = <TPayload>(
  payload: unknown,
  guard: (value: unknown) => value is TPayload,
): UpdateEntityPayload<TPayload> => {
  if (!isObject(payload) || !guard(payload.payload)) {
    throw new Error('Invalid IPC payload: expected a valid update payload.');
  }

  return {
    id: assertEntityIdPayload(payload).id,
    payload: payload.payload,
  };
};

const isGroupMutationPayload = (payload: unknown): payload is ICreateGroup | IUpdateGroup =>
  isObject(payload) && typeof payload.name === 'string' &&
  (payload.description === undefined || typeof payload.description === 'string');

const isProductPayload = (payload: unknown): payload is ICreateProduct =>
  isObject(payload) &&
  typeof payload.name === 'string' &&
  typeof payload.price === 'number' &&
  typeof payload.quantity === 'number' &&
  typeof payload.unitOfMeasure === 'number';

const isPackingPayload = (payload: unknown): payload is ICreatePacking =>
  isObject(payload) &&
  typeof payload.name === 'string' &&
  typeof payload.price === 'number' &&
  typeof payload.quantity === 'number' &&
  typeof payload.unitOfMeasure === 'number' &&
  (payload.description === undefined || typeof payload.description === 'string');

const isRecipeItem = (
  value: unknown,
  idField: 'ingredientId' | 'packingId',
): value is { quantity: number } & Record<typeof idField, string> =>
  isObject(value) &&
  typeof value[idField] === 'string' &&
  typeof value.quantity === 'number';

const isRecipePayload = (payload: unknown): payload is ICreateRecipe =>
  isObject(payload) &&
  typeof payload.name === 'string' &&
  typeof payload.quantity === 'number' &&
  typeof payload.sellingValue === 'number' &&
  (payload.description === undefined || typeof payload.description === 'string') &&
  (payload.groupId === undefined || typeof payload.groupId === 'string') &&
  Array.isArray(payload.ingredients) &&
  payload.ingredients.every((ingredient) => isRecipeItem(ingredient, 'ingredientId')) &&
  Array.isArray(payload.packings) &&
  payload.packings.every((packing) => isRecipeItem(packing, 'packingId'));

const assertRecipesListPayload = (payload: unknown): RecipesListPayload => {
  if (payload === undefined) {
    return {};
  }

  if (!isObject(payload) || (payload.groupId !== undefined && typeof payload.groupId !== 'string')) {
    throw new Error('Invalid IPC payload: expected an optional groupId.');
  }

  return {
    groupId: typeof payload.groupId === 'string' ? payload.groupId : undefined,
  };
};

export const registerBackendIpcHandlers = (): void => {
  if (handlersRegistered) {
    return;
  }

  const services = getBackendServices();

  ipcMain.handle(ipcChannels.products.list, (event) => {
    assertTrustedSender(event);
    return services.products.getAll();
  });
  ipcMain.handle(ipcChannels.products.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isProductPayload(payload)) {
      throw new Error('Invalid IPC payload: expected a product payload.');
    }

    return services.products.create(payload);
  });
  ipcMain.handle(ipcChannels.products.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isProductPayload);

    return services.products.update(mutation.id, mutation.payload);
  });
  ipcMain.handle(ipcChannels.products.delete, (event, payload) => {
    assertTrustedSender(event);
    return services.products.delete(assertEntityIdPayload(payload).id);
  });

  ipcMain.handle(ipcChannels.packings.list, (event) => {
    assertTrustedSender(event);
    return services.packings.getAll();
  });
  ipcMain.handle(ipcChannels.packings.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isPackingPayload(payload)) {
      throw new Error('Invalid IPC payload: expected a packing payload.');
    }

    return services.packings.create(payload);
  });
  ipcMain.handle(ipcChannels.packings.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isPackingPayload);

    return services.packings.update(mutation.id, mutation.payload);
  });
  ipcMain.handle(ipcChannels.packings.delete, (event, payload) => {
    assertTrustedSender(event);
    return services.packings.delete(assertEntityIdPayload(payload).id);
  });

  ipcMain.handle(ipcChannels.groups.list, (event) => {
    assertTrustedSender(event);
    return services.groups.getAll();
  });
  ipcMain.handle(ipcChannels.groups.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isGroupMutationPayload(payload)) {
      throw new Error('Invalid IPC payload: expected a group payload.');
    }

    return services.groups.create(payload);
  });
  ipcMain.handle(ipcChannels.groups.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isGroupMutationPayload);

    return services.groups.update(mutation.id, mutation.payload);
  });
  ipcMain.handle(ipcChannels.groups.delete, (event, payload) => {
    assertTrustedSender(event);
    return services.groups.delete(assertEntityIdPayload(payload).id);
  });

  ipcMain.handle(ipcChannels.recipes.list, (event, payload) => {
    assertTrustedSender(event);
    return services.recipes.getAll(assertRecipesListPayload(payload).groupId);
  });
  ipcMain.handle(ipcChannels.recipes.getById, (event, payload) => {
    assertTrustedSender(event);
    return services.recipes.getById(assertEntityIdPayload(payload).id);
  });
  ipcMain.handle(ipcChannels.recipes.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isRecipePayload(payload)) {
      throw new Error('Invalid IPC payload: expected a recipe payload.');
    }

    return services.recipes.create(payload);
  });
  ipcMain.handle(ipcChannels.recipes.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isRecipePayload);

    return services.recipes.update(mutation.id, mutation.payload);
  });
  ipcMain.handle(ipcChannels.recipes.delete, (event, payload) => {
    assertTrustedSender(event);
    return services.recipes.delete(assertEntityIdPayload(payload).id);
  });

  handlersRegistered = true;
};
