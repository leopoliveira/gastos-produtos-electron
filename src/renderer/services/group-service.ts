import type { ICreateGroup, IReadGroup, IUpdateGroup } from '../../shared/groups';

let groupsStore: IReadGroup[] = [
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

const cloneGroup = (group: IReadGroup): IReadGroup => ({ ...group });
const normalizeOptionalText = (value?: string): string | undefined => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

const getGroupIndexById = (id: string): number =>
  groupsStore.findIndex((group) => group.id === id);

const buildMissingGroupError = (id: string): Error => new Error(`Grupo ${id} não foi encontrado.`);

export const GroupService = {
  async getAllGroups(): Promise<IReadGroup[]> {
    return groupsStore.map(cloneGroup);
  },

  async createGroup(payload: ICreateGroup): Promise<IReadGroup> {
    const group = {
      id: `group-${Date.now()}`,
      name: payload.name.trim(),
      description: normalizeOptionalText(payload.description),
    };

    groupsStore = [group, ...groupsStore];
    return cloneGroup(group);
  },

  async updateGroup(id: string, payload: IUpdateGroup): Promise<IReadGroup> {
    const groupIndex = getGroupIndexById(id);
    if (groupIndex < 0) {
      throw buildMissingGroupError(id);
    }

    const nextGroup: IReadGroup = {
      id,
      name: payload.name.trim(),
      description: normalizeOptionalText(payload.description),
    };

    groupsStore = groupsStore.map((group, index) => (index === groupIndex ? nextGroup : group));
    return cloneGroup(nextGroup);
  },

  async deleteGroup(id: string): Promise<void> {
    const groupIndex = getGroupIndexById(id);
    if (groupIndex < 0) {
      throw buildMissingGroupError(id);
    }

    groupsStore = groupsStore.filter((group) => group.id !== id);
  },
};
