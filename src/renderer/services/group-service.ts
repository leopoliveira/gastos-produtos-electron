import type { ICreateGroup, IReadGroup, IUpdateGroup } from '../../shared/groups';
import { getAppApi } from './electron-api';

export const GroupService = {
  async getAllGroups(): Promise<IReadGroup[]> {
    return getAppApi().groups.list();
  },

  async createGroup(payload: ICreateGroup): Promise<IReadGroup> {
    return getAppApi().groups.create(payload);
  },

  async updateGroup(id: string, payload: IUpdateGroup): Promise<IReadGroup> {
    return getAppApi().groups.update(id, payload);
  },

  async deleteGroup(id: string): Promise<void> {
    await getAppApi().groups.delete(id);
  },
};
