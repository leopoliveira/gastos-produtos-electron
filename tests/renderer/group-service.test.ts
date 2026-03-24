import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('GroupService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the seed groups and puts created groups at the top of the list', async () => {
    const { GroupService } = await import('../../src/renderer/services/group-service');

    const initialGroups = await GroupService.getAllGroups();

    expect(initialGroups).toEqual([
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
    ]);

    const createdGroup = await GroupService.createGroup({
      name: ' Doces finos ',
      description: '  Linha premium para eventos.  ',
    });

    expect(createdGroup.name).toBe('Doces finos');
    expect(createdGroup.description).toBe('Linha premium para eventos.');

    const updatedGroups = await GroupService.getAllGroups();

    expect(updatedGroups[0]).toEqual({
      id: createdGroup.id,
      name: 'Doces finos',
      description: 'Linha premium para eventos.',
    });
  });

  it('updates an existing group and normalizes the optional description', async () => {
    const { GroupService } = await import('../../src/renderer/services/group-service');

    const updatedGroup = await GroupService.updateGroup('group-1', {
      name: ' Brigadeiros gourmet ',
      description: '   ',
    });

    expect(updatedGroup).toEqual({
      id: 'group-1',
      name: 'Brigadeiros gourmet',
      description: undefined,
    });

    await expect(GroupService.getAllGroups()).resolves.toEqual([
      {
        id: 'group-1',
        name: 'Brigadeiros gourmet',
        description: undefined,
      },
      {
        id: 'group-2',
        name: 'Bolos',
        description: 'Massas, recheios e coberturas para bolos.',
      },
    ]);
  });

  it('deletes an existing group', async () => {
    const { GroupService } = await import('../../src/renderer/services/group-service');

    await GroupService.deleteGroup('group-2');

    await expect(GroupService.getAllGroups()).resolves.toEqual([
      {
        id: 'group-1',
        name: 'Brigadeiros',
        description: 'Receitas de brigadeiro e doces similares.',
      },
    ]);
  });

  it('throws when updating or deleting a missing group', async () => {
    const { GroupService } = await import('../../src/renderer/services/group-service');

    await expect(
      GroupService.updateGroup('group-404', {
        name: 'Inexistente',
      }),
    ).rejects.toThrow('Grupo group-404 não foi encontrado.');

    await expect(GroupService.deleteGroup('group-404')).rejects.toThrow(
      'Grupo group-404 não foi encontrado.',
    );
  });
});
