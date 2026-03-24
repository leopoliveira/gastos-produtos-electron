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
    const createdPacking = await getAppApi().packings.create(payload);
    return getAppApi().packings.getById(createdPacking.packingId);
  },

  async updatePacking(id: string, payload: ICreatePacking): Promise<IReadPacking> {
    await getAppApi().packings.update(id, payload);
    return getAppApi().packings.getById(id);
  },

  async deletePacking(id: string): Promise<void> {
    await getAppApi().packings.delete(id);
  },
};
