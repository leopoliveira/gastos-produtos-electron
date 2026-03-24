import { UnitOfMeasure } from './unit-of-measure';

export interface ProductWriteDto {
  name: string;
  price: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface AddProductRequest extends ProductWriteDto {}

export interface UpdateProductDto extends ProductWriteDto {}

export interface AddProductResponse {
  productId: string;
}

export interface GetProductResponse extends ProductWriteDto {
  unitPrice: number;
  id: string;
}

export type ICreateProduct = AddProductRequest;
export type IUpdateProduct = UpdateProductDto;
export type IReadProduct = GetProductResponse;
