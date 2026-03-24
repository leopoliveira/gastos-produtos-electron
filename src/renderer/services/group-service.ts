import type { ICreateGroup, IReadGroup, IUpdateGroup } from '../../shared/groups';
import { getAppApi } from './electron-api';

export const GroupService = {
  async getAllGroups(): Promise<IReadGroup[]> {
    return getAppApi().groups.list();
  },

  async createGroup(payload: ICreateGroup): Promise<IReadGroup> {
    const createdGroup = await getAppApi().groups.create(payload);
    return getAppApi().groups.getById(createdGroup.id);
  },

  async updateGroup(id: string, payload: IUpdateGroup): Promise<IReadGroup> {
    await getAppApi().groups.update(id, payload);
    return getAppApi().groups.getById(id);
  },

  async deleteGroup(id: string): Promise<void> {
    await getAppApi().groups.delete(id);
  },
};
