import type { ICreateProduct, IReadProduct } from '../../shared/products';
import { UnitOfMeasure } from '../../shared/unit-of-measure';

let productsStore: IReadProduct[] = [
  {
    id: 'product-1',
    name: 'Chocolate em po',
    price: 18.9,
    quantity: 1,
    unitOfMeasure: UnitOfMeasure.kg,
    unitPrice: 18.9,
  },
  {
    id: 'product-2',
    name: 'Leite condensado',
    price: 7.5,
    quantity: 395,
    unitOfMeasure: UnitOfMeasure.g,
    unitPrice: 7.5 / 395,
  },
];

const cloneProduct = (product: IReadProduct): IReadProduct => ({ ...product });

const buildProduct = (payload: ICreateProduct, id: string): IReadProduct => ({
  id,
  name: payload.name,
  price: payload.price,
  quantity: payload.quantity,
  unitOfMeasure: payload.unitOfMeasure,
  unitPrice: payload.price / payload.quantity,
});

export const ProductService = {
  async getAllProducts(): Promise<IReadProduct[]> {
    return productsStore.map(cloneProduct);
  },

  async getAllIngredientsDto(): Promise<IReadProduct[]> {
    return productsStore.map(cloneProduct);
  },

  async createProduct(payload: ICreateProduct): Promise<IReadProduct> {
    const product = buildProduct(payload, `product-${Date.now()}`);
    productsStore = [...productsStore, product];
    return cloneProduct(product);
  },

  async updateProduct(id: string, payload: ICreateProduct): Promise<IReadProduct> {
    const product = buildProduct(payload, id);
    productsStore = productsStore.map((currentProduct) =>
      currentProduct.id === id ? product : currentProduct,
    );
    return cloneProduct(product);
  },

  async deleteProduct(id: string): Promise<void> {
    productsStore = productsStore.filter((product) => product.id !== id);
  },
};
