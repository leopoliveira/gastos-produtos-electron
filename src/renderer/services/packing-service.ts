import type { ICreatePacking, IReadPacking } from '../../shared/packings';
import { getAppApi } from './electron-api';

export const PackingService = {
  async getAllPackings(): Promise<IReadPacking[]> {
    return getAppApi().packings.list();
  },

  async getAllPackingsDto(): Promise<IReadPacking[]> {
    return this.getAllPackings();
  },

  async createPacking(payload: ICreatePacking): Promise<IReadPacking> {
    return getAppApi().packings.create(payload);
  },

  async updatePacking(id: string, payload: ICreatePacking): Promise<IReadPacking> {
    return getAppApi().packings.update(id, payload);
  },

  async deletePacking(id: string): Promise<void> {
    await getAppApi().packings.delete(id);
  },
};
