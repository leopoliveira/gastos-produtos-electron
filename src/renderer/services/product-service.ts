import type { ICreateProduct, IReadProduct } from '../../shared/products';
import { getProductHttpClient } from './http/domain-clients';

export const ProductService = {
  async getAllProducts(): Promise<IReadProduct[]> {
    const response = await getProductHttpClient().get<IReadProduct[]>('/');
    return response.data;
  },

  async getAllIngredientsDto(): Promise<IReadProduct[]> {
    return this.getAllProducts();
  },

  async createProduct(payload: ICreateProduct): Promise<IReadProduct> {
    const response = await getProductHttpClient().post<IReadProduct>('/', payload);
    return response.data;
  },

  async updateProduct(id: string, payload: ICreateProduct): Promise<IReadProduct> {
    const response = await getProductHttpClient().put<IReadProduct>(`/${id}`, payload);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await getProductHttpClient().delete(`/${id}`);
  },
};
