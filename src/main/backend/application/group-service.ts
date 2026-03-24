import type {
  AddGroupRequest,
  AddGroupResponse,
  GroupResponse,
  GroupWriteDto,
} from '../../../shared/groups';

import { InvalidOperationError, NotFoundError } from '../domain/errors';
import { createGroupRecord, type GroupRecord } from '../domain/entities';
import { AppDataStore } from '../infra/app-data-store';

const GROUP_NOT_FOUND_MESSAGE = 'Grupo não encontrado.';
const GROUP_NAME_REQUIRED_MESSAGE = 'Nome do grupo é obrigatório.';
const GROUP_IN_USE_MESSAGE = 'Não é possível deletar um grupo que está em uso por receitas.';

const toReadGroup = (group: GroupRecord): GroupResponse => ({
  id: group.id,
  name: group.name,
  description: group.description,
});

const assertGroupName = (name: string): void => {
  if (!name.trim()) {
    throw new InvalidOperationError(GROUP_NAME_REQUIRED_MESSAGE);
  }
};

const findActiveGroup = (groups: GroupRecord[], id: string): GroupRecord => {
  const group = groups.find((item) => item.id === id && !item.isDeleted);

  if (!group) {
    throw new NotFoundError(GROUP_NOT_FOUND_MESSAGE);
  }

  return group;
};

export class GroupService {
  constructor(private readonly store: AppDataStore) {}

  async getAll(): Promise<GroupResponse[]> {
    return this.store.read((state) => state.groups.filter((group) => !group.isDeleted).map(toReadGroup));
  }

  async getById(id: string): Promise<GroupResponse> {
    return this.store.read((state) => toReadGroup(findActiveGroup(state.groups, id)));
  }

  async create(payload: AddGroupRequest): Promise<AddGroupResponse> {
    assertGroupName(payload.name);

    return this.store.mutate((state) => {
      const group = createGroupRecord(payload);
      state.groups.push(group);
      return { id: group.id };
    });
  }

  async update(id: string, payload: GroupWriteDto): Promise<void> {
    assertGroupName(payload.name);

    await this.store.mutate((state) => {
      const group = findActiveGroup(state.groups, id);

      group.name = payload.name;
      group.description = payload.description;
      group.updatedAt = new Date().toISOString();
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const group = findActiveGroup(state.groups, id);
      const isGroupInUse = state.recipes.some((recipe) => recipe.groupId === id && !recipe.isDeleted);

      if (isGroupInUse) {
        throw new InvalidOperationError(GROUP_IN_USE_MESSAGE);
      }

      group.isDeleted = true;
    });
  }
}
