// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ipcMainHandleMock, servicesMock } = vi.hoisted(() => ({
  ipcMainHandleMock: vi.fn(),
  servicesMock: {
    products: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    packings: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    groups: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    recipes: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: ipcMainHandleMock,
  },
}));

vi.mock('../../src/main/backend/application/backend-services', () => ({
  getBackendServices: () => servicesMock,
}));

describe('registerBackendIpcHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.assign(globalThis as Record<string, unknown>, {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: 'http://localhost:5173',
    });
  });

  it('registers handlers once and forwards trusted product calls to the backend services', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackendIpcHandlers } = await import('../../src/main/ipc/backend-ipc');
    const getRegisteredHandler = (channel: string) =>
      ipcMainHandleMock.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];

    registerBackendIpcHandlers();
    registerBackendIpcHandlers();

    expect(ipcMainHandleMock).toHaveBeenCalledTimes(17);

    const productListHandler = getRegisteredHandler(ipcChannels.products.list);
    const productUpdateHandler = getRegisteredHandler(ipcChannels.products.update);
    const trustedEvent = {
      senderFrame: {
        url: 'http://localhost:5173/products',
      },
    };

    servicesMock.products.getAll.mockResolvedValue([{ id: 'product-1' }]);
    servicesMock.products.update.mockResolvedValue({ id: 'product-1' });

    await expect(productListHandler?.(trustedEvent)).resolves.toEqual([{ id: 'product-1' }]);
    await expect(
      productUpdateHandler?.(trustedEvent, {
        id: 'product-1',
        payload: {
          name: 'Chocolate em po',
          price: 18.9,
          quantity: 1,
          unitOfMeasure: 2,
        },
      }),
    ).resolves.toEqual({ id: 'product-1' });

    expect(servicesMock.products.update).toHaveBeenCalledWith('product-1', {
      name: 'Chocolate em po',
      price: 18.9,
      quantity: 1,
      unitOfMeasure: 2,
    });
  });

  it('rejects untrusted senders and invalid payloads', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackendIpcHandlers } = await import('../../src/main/ipc/backend-ipc');
    const getRegisteredHandler = (channel: string) =>
      ipcMainHandleMock.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];

    registerBackendIpcHandlers();

    const recipeCreateHandler = getRegisteredHandler(ipcChannels.recipes.create);
    const groupDeleteHandler = getRegisteredHandler(ipcChannels.groups.delete);

    expect(() =>
      recipeCreateHandler?.(
        {
          senderFrame: {
            url: 'https://evil.example/app',
          },
        },
        {
          name: 'Receita',
          quantity: 1,
          sellingValue: 1,
          ingredients: [],
          packings: [],
        },
      ),
    ).toThrow('Unauthorized IPC sender.');

    expect(() =>
      groupDeleteHandler?.(
        {
          senderFrame: {
            url: 'http://localhost:5173/configuration',
          },
        },
        {
          id: '',
        },
      ),
    ).toThrow('Invalid IPC payload: expected a non-empty id.');
  });
});
