import { UnitOfMeasure } from './unit-of-measure';

export interface ICreateProduct {
  name: string;
  price: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface IUpdateProduct extends ICreateProduct {
  unitPrice: number;
}

export interface IReadProduct extends IUpdateProduct {
  id: string;
}
