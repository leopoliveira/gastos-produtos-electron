import type { ICreatePacking, IReadPacking } from '../../shared/packings';
import { getPackingHttpClient } from './http/domain-clients';

export const PackingService = {
  async getAllPackings(): Promise<IReadPacking[]> {
    const response = await getPackingHttpClient().get<IReadPacking[]>('/');
    return response.data;
  },

  async getAllPackingsDto(): Promise<IReadPacking[]> {
    return this.getAllPackings();
  },

  async createPacking(payload: ICreatePacking): Promise<IReadPacking> {
    const response = await getPackingHttpClient().post<IReadPacking>('/', payload);
    return response.data;
  },

  async updatePacking(id: string, payload: ICreatePacking): Promise<IReadPacking> {
    const response = await getPackingHttpClient().put<IReadPacking>(`/${id}`, payload);
    return response.data;
  },

  async deletePacking(id: string): Promise<void> {
    await getPackingHttpClient().delete(`/${id}`);
  },
};
