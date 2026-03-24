import type { ICreateProduct, IReadProduct } from '../../shared/products';
import { getAppApi } from './electron-api';

export const ProductService = {
  async getAllProducts(): Promise<IReadProduct[]> {
    return getAppApi().products.list();
  },

  async getAllIngredientsDto(): Promise<IReadProduct[]> {
    return this.getAllProducts();
  },

  async createProduct(payload: ICreateProduct): Promise<IReadProduct> {
    return getAppApi().products.create(payload);
  },

  async updateProduct(id: string, payload: ICreateProduct): Promise<IReadProduct> {
    return getAppApi().products.update(id, payload);
  },

  async deleteProduct(id: string): Promise<void> {
    await getAppApi().products.delete(id);
  },
};
