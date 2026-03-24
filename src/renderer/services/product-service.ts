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
    const createdProduct = await getAppApi().products.create(payload);
    return getAppApi().products.getById(createdProduct.productId);
  },

  async updateProduct(id: string, payload: ICreateProduct): Promise<IReadProduct> {
    await getAppApi().products.update(id, payload);
    return getAppApi().products.getById(id);
  },

  async deleteProduct(id: string): Promise<void> {
    await getAppApi().products.delete(id);
  },
};
