import type { ICreatePacking, IReadPacking } from '../../../shared/packings';

import { NotFoundError } from '../domain/errors';
import { createPackingRecord, type PackingRecord } from '../domain/entities';
import { AppDataStore } from '../infra/app-data-store';

const toReadPacking = (packing: PackingRecord): IReadPacking => ({
  id: packing.id,
  name: packing.name,
  description: packing.description,
  price: packing.price,
  quantity: packing.quantity,
  unitOfMeasure: packing.unitOfMeasure,
  packingUnitPrice: packing.quantity === 0 ? 0 : packing.price / packing.quantity,
});

const findActivePacking = (packings: PackingRecord[], id: string): PackingRecord => {
  const packing = packings.find((item) => item.id === id && !item.isDeleted);

  if (!packing) {
    throw new NotFoundError('Packing not found.');
  }

  return packing;
};

export class PackingService {
  constructor(private readonly store: AppDataStore) {}

  async getAll(): Promise<IReadPacking[]> {
    return this.store.read((state) =>
      state.packings.filter((packing) => !packing.isDeleted).map(toReadPacking),
    );
  }

  async create(payload: ICreatePacking): Promise<IReadPacking> {
    return this.store.mutate((state) => {
      const packing = createPackingRecord(payload);
      state.packings.push(packing);
      return toReadPacking(packing);
    });
  }

  async update(id: string, payload: ICreatePacking): Promise<IReadPacking> {
    return this.store.mutate((state) => {
      const packing = findActivePacking(state.packings, id);

      packing.name = payload.name;
      packing.description = payload.description;
      packing.price = payload.price;
      packing.quantity = payload.quantity;
      packing.unitOfMeasure = payload.unitOfMeasure;
      packing.updatedAt = new Date().toISOString();

      return toReadPacking(packing);
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const packing = state.packings.find((item) => item.id === id && !item.isDeleted);

      if (!packing) {
        throw new NotFoundError('Packing not found. Nothing will be deleted.');
      }

      packing.isDeleted = true;
      packing.updatedAt = new Date().toISOString();
    });
  }
}
