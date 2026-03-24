import { UnitOfMeasure } from './unit-of-measure';

export interface ICreatePacking {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface IUpdatePacking extends ICreatePacking {
  packingUnitPrice: number;
}

export interface IReadPacking extends IUpdatePacking {
  id: string;
}
