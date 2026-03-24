import type { ICreatePacking, IReadPacking } from '../../shared/packings';
import { UnitOfMeasure } from '../../shared/unit-of-measure';

let packingsStore: IReadPacking[] = [
  {
    id: 'packing-1',
    name: 'Caixa para brigadeiro',
    description: 'Caixa premium com tampa transparente',
    price: 24.9,
    quantity: 50,
    unitOfMeasure: UnitOfMeasure.box,
    packingUnitPrice: 24.9 / 50,
  },
  {
    id: 'packing-2',
    name: 'Saco metalizado',
    description: 'Pacote com zip lock',
    price: 16.5,
    quantity: 100,
    unitOfMeasure: UnitOfMeasure.bag,
    packingUnitPrice: 16.5 / 100,
  },
];

const clonePacking = (packing: IReadPacking): IReadPacking => ({ ...packing });

const buildPacking = (payload: ICreatePacking, id: string): IReadPacking => ({
  id,
  name: payload.name,
  description: payload.description,
  price: payload.price,
  quantity: payload.quantity,
  unitOfMeasure: payload.unitOfMeasure,
  packingUnitPrice: payload.price / payload.quantity,
});

export const PackingService = {
  async getAllPackings(): Promise<IReadPacking[]> {
    return packingsStore.map(clonePacking);
  },

  async getAllPackingsDto(): Promise<IReadPacking[]> {
    return packingsStore.map(clonePacking);
  },

  async createPacking(payload: ICreatePacking): Promise<IReadPacking> {
    const packing = buildPacking(payload, `packing-${Date.now()}`);
    packingsStore = [...packingsStore, packing];
    return clonePacking(packing);
  },

  async updatePacking(id: string, payload: ICreatePacking): Promise<IReadPacking> {
    const packing = buildPacking(payload, id);
    packingsStore = packingsStore.map((currentPacking) =>
      currentPacking.id === id ? packing : currentPacking,
    );
    return clonePacking(packing);
  },

  async deletePacking(id: string): Promise<void> {
    packingsStore = packingsStore.filter((packing) => packing.id !== id);
  },
};
