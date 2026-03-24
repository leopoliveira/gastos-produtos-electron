import { beforeEach, describe, expect, it, vi } from 'vitest';

const appApiMocks = vi.hoisted(() => ({
  products: {
    create: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/electron-api', () => ({
  getAppApi: () => appApiMocks,
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.resetModules();
    appApiMocks.products.create.mockReset();
    appApiMocks.products.delete.mockReset();
    appApiMocks.products.getById.mockReset();
    appApiMocks.products.list.mockReset();
    appApiMocks.products.update.mockReset();
  });

  it('loads products and reuses the same list for ingredient options', async () => {
    const products = [
      {
        id: 'product-1',
        name: 'Chocolate em po',
        price: 18.9,
        quantity: 1,
        unitOfMeasure: 2,
        unitPrice: 18.9,
      },
    ];
    appApiMocks.products.list.mockResolvedValue(products);
    const { ProductService } = await import('../../src/renderer/services/product-service');

    await expect(ProductService.getAllProducts()).resolves.toEqual(products);
    await expect(ProductService.getAllIngredientsDto()).resolves.toEqual(products);
    expect(appApiMocks.products.list).toHaveBeenCalledTimes(2);
  });

  it('creates, updates and deletes products through the preload bridge', async () => {
    const payload = {
      name: 'Acucar refinado',
      price: 4.5,
      quantity: 1,
      unitOfMeasure: 5,
    };
    const response = { id: 'product-2', ...payload, unitPrice: 4.5 };
    appApiMocks.products.create.mockResolvedValue({ productId: 'product-2' });
    appApiMocks.products.getById.mockResolvedValue(response);
    appApiMocks.products.update.mockResolvedValue(undefined);
    appApiMocks.products.delete.mockResolvedValue(undefined);
    const { ProductService } = await import('../../src/renderer/services/product-service');

    await expect(ProductService.createProduct(payload)).resolves.toEqual(response);
    await expect(ProductService.updateProduct('product-2', payload)).resolves.toEqual(response);
    await expect(ProductService.deleteProduct('product-2')).resolves.toBeUndefined();

    expect(appApiMocks.products.create).toHaveBeenCalledWith(payload);
    expect(appApiMocks.products.update).toHaveBeenCalledWith('product-2', payload);
    expect(appApiMocks.products.getById).toHaveBeenNthCalledWith(1, 'product-2');
    expect(appApiMocks.products.getById).toHaveBeenNthCalledWith(2, 'product-2');
    expect(appApiMocks.products.delete).toHaveBeenCalledWith('product-2');
  });
});
