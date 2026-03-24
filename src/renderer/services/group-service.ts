import type { ICreateGroup, IReadGroup } from '../../shared/groups';

let groupsStore: IReadGroup[] = [
  {
    id: 'group-1',
    name: 'Brigadeiros',
  },
  {
    id: 'group-2',
    name: 'Bolos',
  },
];

const cloneGroup = (group: IReadGroup): IReadGroup => ({ ...group });

export const GroupService = {
  async getAllGroups(): Promise<IReadGroup[]> {
    return groupsStore.map(cloneGroup);
  },

  async createGroup(payload: ICreateGroup): Promise<IReadGroup> {
    const group = {
      id: `group-${Date.now()}`,
      name: payload.name.trim(),
    };

    groupsStore = [group, ...groupsStore];
    return cloneGroup(group);
  },
};
