import { beforeEach, describe, expect, it, vi } from 'vitest';

const appApiMocks = vi.hoisted(() => ({
  groups: {
    create: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/electron-api', () => ({
  getAppApi: () => appApiMocks,
}));

describe('GroupService', () => {
  beforeEach(() => {
    vi.resetModules();
    appApiMocks.groups.create.mockReset();
    appApiMocks.groups.delete.mockReset();
    appApiMocks.groups.getById.mockReset();
    appApiMocks.groups.list.mockReset();
    appApiMocks.groups.update.mockReset();
  });

  it('loads groups from the preload bridge', async () => {
    const groups = [
      {
        id: 'group-1',
        name: 'Brigadeiros',
        description: 'Receitas de brigadeiro e doces similares.',
      },
      {
        id: 'group-2',
        name: 'Bolos',
        description: 'Massas, recheios e coberturas para bolos.',
      },
    ];
    appApiMocks.groups.list.mockResolvedValue(groups);
    const { GroupService } = await import('../../src/renderer/services/group-service');

    await expect(GroupService.getAllGroups()).resolves.toEqual(groups);
    expect(appApiMocks.groups.list).toHaveBeenCalledWith();
  });

  it('creates, updates and deletes groups through the preload bridge', async () => {
    const payload = {
      name: 'Doces finos',
      description: 'Linha premium para eventos.',
    };
    const response = { id: 'group-3', ...payload };
    appApiMocks.groups.create.mockResolvedValue({ id: 'group-3' });
    appApiMocks.groups.getById.mockResolvedValue(response);
    appApiMocks.groups.update.mockResolvedValue(undefined);
    appApiMocks.groups.delete.mockResolvedValue(undefined);
    const { GroupService } = await import('../../src/renderer/services/group-service');

    await expect(GroupService.createGroup(payload)).resolves.toEqual(response);
    await expect(GroupService.updateGroup('group-3', payload)).resolves.toEqual(response);
    await expect(GroupService.deleteGroup('group-3')).resolves.toBeUndefined();

    expect(appApiMocks.groups.create).toHaveBeenCalledWith(payload);
    expect(appApiMocks.groups.update).toHaveBeenCalledWith('group-3', payload);
    expect(appApiMocks.groups.getById).toHaveBeenNthCalledWith(1, 'group-3');
    expect(appApiMocks.groups.getById).toHaveBeenNthCalledWith(2, 'group-3');
    expect(appApiMocks.groups.delete).toHaveBeenCalledWith('group-3');
  });
});
