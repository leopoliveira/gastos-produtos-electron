import type { ICreateGroup, IReadGroup, IUpdateGroup } from '../../shared/groups';
import { getGroupHttpClient } from './http/domain-clients';

export const GroupService = {
  async getAllGroups(): Promise<IReadGroup[]> {
    const response = await getGroupHttpClient().get<IReadGroup[]>('/');
    return response.data;
  },

  async createGroup(payload: ICreateGroup): Promise<IReadGroup> {
    const response = await getGroupHttpClient().post<IReadGroup>('/', payload);
    return response.data;
  },

  async updateGroup(id: string, payload: IUpdateGroup): Promise<IReadGroup> {
    const response = await getGroupHttpClient().put<IReadGroup>(`/${id}`, payload);
    return response.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await getGroupHttpClient().delete(`/${id}`);
  },
};
