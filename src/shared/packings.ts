import { UnitOfMeasure } from './unit-of-measure';

export interface PackingWriteDto {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface AddPackingRequest extends PackingWriteDto {}

export interface UpdatePackingDto extends PackingWriteDto {}

export interface AddPackingResponse {
  packingId: string;
}

export interface GetPackingResponse extends PackingWriteDto {
  packingUnitPrice: number;
  id: string;
}

export type ICreatePacking = AddPackingRequest;
export type IUpdatePacking = UpdatePackingDto;
export type IReadPacking = GetPackingResponse;
