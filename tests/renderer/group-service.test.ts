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
      },
      {
        id: 'group-2',
        name: 'Bolos',
      },
    ]);

    const createdGroup = await GroupService.createGroup({
      name: ' Doces finos ',
    });

    expect(createdGroup.name).toBe('Doces finos');

    const updatedGroups = await GroupService.getAllGroups();

    expect(updatedGroups[0]).toEqual({
      id: createdGroup.id,
      name: 'Doces finos',
    });
  });
});
