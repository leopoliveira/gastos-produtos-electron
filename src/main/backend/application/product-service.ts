import type { ICreateProduct, IReadProduct } from '../../../shared/products';

import { NotFoundError } from '../domain/errors';
import { createProductRecord, type ProductRecord } from '../domain/entities';
import { AppDataStore } from '../infra/app-data-store';

const toReadProduct = (product: ProductRecord): IReadProduct => ({
  id: product.id,
  name: product.name,
  price: product.price,
  quantity: product.quantity,
  unitOfMeasure: product.unitOfMeasure,
  unitPrice: product.quantity === 0 ? 0 : product.price / product.quantity,
});

const findActiveProduct = (products: ProductRecord[], id: string): ProductRecord => {
  const product = products.find((item) => item.id === id && !item.isDeleted);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return product;
};

export class ProductService {
  constructor(private readonly store: AppDataStore) {}

  async getAll(): Promise<IReadProduct[]> {
    return this.store.read((state) =>
      state.products.filter((product) => !product.isDeleted).map(toReadProduct),
    );
  }

  async create(payload: ICreateProduct): Promise<IReadProduct> {
    return this.store.mutate((state) => {
      const product = createProductRecord(payload);
      state.products.push(product);
      return toReadProduct(product);
    });
  }

  async update(id: string, payload: ICreateProduct): Promise<IReadProduct> {
    return this.store.mutate((state) => {
      const product = findActiveProduct(state.products, id);

      product.name = payload.name;
      product.price = payload.price;
      product.quantity = payload.quantity;
      product.unitOfMeasure = payload.unitOfMeasure;
      product.updatedAt = new Date().toISOString();

      return toReadProduct(product);
    });
  }

  async delete(id: string): Promise<void> {
    await this.store.mutate((state) => {
      const product = state.products.find((item) => item.id === id && !item.isDeleted);

      if (!product) {
        throw new NotFoundError('Product not found. Nothing will be deleted.');
      }

      product.isDeleted = true;
      product.updatedAt = new Date().toISOString();
    });
  }
}
