// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { exposeInMainWorldMock, invokeMock } = vi.hoisted(() => ({
  exposeInMainWorldMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: exposeInMainWorldMock,
  },
  ipcRenderer: {
    invoke: invokeMock,
  },
}));

describe('preload appApi bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    exposeInMainWorldMock.mockReset();
    invokeMock.mockReset();
  });

  it('exposes a narrow appApi bridge backed by ipcRenderer.invoke', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');

    await import('../../src/preload/index');

    expect(exposeInMainWorldMock).toHaveBeenCalledTimes(1);
    expect(exposeInMainWorldMock).toHaveBeenCalledWith('appApi', expect.any(Object));

    const appApi = exposeInMainWorldMock.mock.calls[0]?.[1];

    await appApi.products.list();
    await appApi.groups.delete('group-1');
    await appApi.recipes.update('recipe-1', {
      name: 'Receita',
      quantity: 10,
      sellingValue: 3,
      ingredients: [],
      packings: [],
    });

    expect(invokeMock).toHaveBeenNthCalledWith(1, ipcChannels.products.list);
    expect(invokeMock).toHaveBeenNthCalledWith(2, ipcChannels.groups.delete, { id: 'group-1' });
    expect(invokeMock).toHaveBeenNthCalledWith(3, ipcChannels.recipes.update, {
      id: 'recipe-1',
      payload: {
        name: 'Receita',
        quantity: 10,
        sellingValue: 3,
        ingredients: [],
        packings: [],
      },
    });
  });
});
