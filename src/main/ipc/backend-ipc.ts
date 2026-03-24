import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import {
  ipcChannels,
  type EntityIdPayload,
  type RecipesListPayload,
  serializeIpcError,
  type SerializedIpcError,
  type UpdateEntityPayload,
} from '../../shared/ipc';
import type { AddGroupRequest, GroupWriteDto } from '../../shared/groups';
import type { AddPackingRequest, UpdatePackingDto } from '../../shared/packings';
import type { AddProductRequest, UpdateProductDto } from '../../shared/products';
import type { AddRecipeRequest, IngredientDto, PackingDto, UpdateRecipeDto } from '../../shared/recipes';
import { getBackendServices } from '../backend/application/backend-services';
import { InvalidOperationError, NotFoundError } from '../backend/domain/errors';

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

const isGroupMutationPayload = (payload: unknown): payload is AddGroupRequest | GroupWriteDto =>
  isObject(payload) && typeof payload.name === 'string' &&
  (payload.description === undefined || typeof payload.description === 'string');

const isProductPayload = (payload: unknown): payload is AddProductRequest | UpdateProductDto =>
  isObject(payload) &&
  typeof payload.name === 'string' &&
  typeof payload.price === 'number' &&
  typeof payload.quantity === 'number' &&
  typeof payload.unitOfMeasure === 'number';

const isPackingPayload = (payload: unknown): payload is AddPackingRequest | UpdatePackingDto =>
  isObject(payload) &&
  typeof payload.name === 'string' &&
  typeof payload.price === 'number' &&
  typeof payload.quantity === 'number' &&
  typeof payload.unitOfMeasure === 'number' &&
  (payload.description === undefined || typeof payload.description === 'string');

const isIngredientDto = (value: unknown): value is IngredientDto =>
  isObject(value) &&
  typeof value.productId === 'string' &&
  typeof value.productName === 'string' &&
  typeof value.quantity === 'number' &&
  typeof value.ingredientPrice === 'number';

const isPackingDto = (value: unknown): value is PackingDto =>
  isObject(value) &&
  typeof value.packingId === 'string' &&
  typeof value.packingName === 'string' &&
  typeof value.quantity === 'number' &&
  typeof value.packingUnitPrice === 'number';

const isRecipePayload = (payload: unknown): payload is AddRecipeRequest | UpdateRecipeDto =>
  isObject(payload) &&
  typeof payload.name === 'string' &&
  (payload.quantity === undefined || typeof payload.quantity === 'number') &&
  (payload.sellingValue === undefined || typeof payload.sellingValue === 'number') &&
  (payload.description === undefined || typeof payload.description === 'string') &&
  (payload.groupId === undefined || typeof payload.groupId === 'string') &&
  Array.isArray(payload.ingredients) &&
  payload.ingredients.every(isIngredientDto) &&
  Array.isArray(payload.packings) &&
  payload.packings.every(isPackingDto);

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

const toSerializedIpcError = (error: unknown): SerializedIpcError => {
  if (error instanceof NotFoundError) {
    return {
      name: error.name,
      message: error.message,
      detail: error.message,
      problem: {
        code: 'not_found',
        detail: error.message,
        status: 404,
        title: 'Not Found',
      },
    };
  }

  if (error instanceof InvalidOperationError) {
    return {
      name: error.name,
      message: error.message,
      detail: error.message,
      problem: {
        code: 'invalid_operation',
        detail: error.message,
        status: 400,
        title: 'Bad Request',
      },
    };
  }

  return {
    name: 'Error',
    message: 'Unexpected backend error.',
    detail: 'Unexpected backend error.',
    problem: {
      code: 'internal_error',
      detail: 'Unexpected backend error.',
      status: 500,
      title: 'Internal Server Error',
    },
  };
};

const invokeBackendService = async <TResult>(operation: () => Promise<TResult> | TResult): Promise<TResult> => {
  try {
    return await operation();
  } catch (error) {
    throw new Error(serializeIpcError(toSerializedIpcError(error)));
  }
};

export const registerBackendIpcHandlers = (): void => {
  if (handlersRegistered) {
    return;
  }

  const services = getBackendServices();

  ipcMain.handle(ipcChannels.products.list, (event) => {
    assertTrustedSender(event);
    return invokeBackendService(() => services.products.getAll());
  });
  ipcMain.handle(ipcChannels.products.getById, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.products.getById(entityId.id));
  });
  ipcMain.handle(ipcChannels.products.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isProductPayload(payload)) {
      throw new Error('Invalid IPC payload: expected a product payload.');
    }

    return invokeBackendService(() => services.products.create(payload));
  });
  ipcMain.handle(ipcChannels.products.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isProductPayload);

    return invokeBackendService(() => services.products.update(mutation.id, mutation.payload));
  });
  ipcMain.handle(ipcChannels.products.delete, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.products.delete(entityId.id));
  });

  ipcMain.handle(ipcChannels.packings.list, (event) => {
    assertTrustedSender(event);
    return invokeBackendService(() => services.packings.getAll());
  });
  ipcMain.handle(ipcChannels.packings.getById, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.packings.getById(entityId.id));
  });
  ipcMain.handle(ipcChannels.packings.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isPackingPayload(payload)) {
      throw new Error('Invalid IPC payload: expected a packing payload.');
    }

    return invokeBackendService(() => services.packings.create(payload));
  });
  ipcMain.handle(ipcChannels.packings.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isPackingPayload);

    return invokeBackendService(() => services.packings.update(mutation.id, mutation.payload));
  });
  ipcMain.handle(ipcChannels.packings.delete, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.packings.delete(entityId.id));
  });

  ipcMain.handle(ipcChannels.groups.list, (event) => {
    assertTrustedSender(event);
    return invokeBackendService(() => services.groups.getAll());
  });
  ipcMain.handle(ipcChannels.groups.getById, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.groups.getById(entityId.id));
  });
  ipcMain.handle(ipcChannels.groups.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isGroupMutationPayload(payload)) {
      throw new Error('Invalid IPC payload: expected a group payload.');
    }

    return invokeBackendService(() => services.groups.create(payload));
  });
  ipcMain.handle(ipcChannels.groups.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isGroupMutationPayload);

    return invokeBackendService(() => services.groups.update(mutation.id, mutation.payload));
  });
  ipcMain.handle(ipcChannels.groups.delete, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.groups.delete(entityId.id));
  });

  ipcMain.handle(ipcChannels.recipes.list, (event, payload) => {
    assertTrustedSender(event);
    const listPayload = assertRecipesListPayload(payload);
    return invokeBackendService(() => services.recipes.getAll(listPayload.groupId));
  });
  ipcMain.handle(ipcChannels.recipes.getById, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.recipes.getById(entityId.id));
  });
  ipcMain.handle(ipcChannels.recipes.create, (event, payload) => {
    assertTrustedSender(event);

    if (!isRecipePayload(payload)) {
      throw new Error('Invalid IPC payload: expected a recipe payload.');
    }

    return invokeBackendService(() => services.recipes.create(payload));
  });
  ipcMain.handle(ipcChannels.recipes.update, (event, payload) => {
    assertTrustedSender(event);
    const mutation = assertUpdatePayload(payload, isRecipePayload);

    return invokeBackendService(() => services.recipes.update(mutation.id, mutation.payload));
  });
  ipcMain.handle(ipcChannels.recipes.delete, (event, payload) => {
    assertTrustedSender(event);
    const entityId = assertEntityIdPayload(payload);
    return invokeBackendService(() => services.recipes.delete(entityId.id));
  });

  handlersRegistered = true;
};
