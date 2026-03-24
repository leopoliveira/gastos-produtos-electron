import { beforeEach, describe, expect, it, vi } from 'vitest';

const productHttpClientMocks = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/http/domain-clients', () => ({
  getProductHttpClient: () => ({
    delete: productHttpClientMocks.deleteMock,
    get: productHttpClientMocks.getMock,
    post: productHttpClientMocks.postMock,
    put: productHttpClientMocks.putMock,
  }),
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.resetModules();
    productHttpClientMocks.deleteMock.mockReset();
    productHttpClientMocks.getMock.mockReset();
    productHttpClientMocks.postMock.mockReset();
    productHttpClientMocks.putMock.mockReset();
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
    productHttpClientMocks.getMock.mockResolvedValue({ data: products });
    const { ProductService } = await import('../../src/renderer/services/product-service');

    await expect(ProductService.getAllProducts()).resolves.toEqual(products);
    await expect(ProductService.getAllIngredientsDto()).resolves.toEqual(products);
    expect(productHttpClientMocks.getMock).toHaveBeenCalledWith('/');
  });

  it('creates, updates and deletes products through the API client', async () => {
    const payload = {
      name: 'Acucar refinado',
      price: 4.5,
      quantity: 1,
      unitOfMeasure: 5,
    };
    const response = { data: { id: 'product-2', ...payload, unitPrice: 4.5 } };
    productHttpClientMocks.postMock.mockResolvedValue(response);
    productHttpClientMocks.putMock.mockResolvedValue(response);
    productHttpClientMocks.deleteMock.mockResolvedValue(undefined);
    const { ProductService } = await import('../../src/renderer/services/product-service');

    await expect(ProductService.createProduct(payload)).resolves.toEqual(response.data);
    await expect(ProductService.updateProduct('product-2', payload)).resolves.toEqual(response.data);
    await expect(ProductService.deleteProduct('product-2')).resolves.toBeUndefined();

    expect(productHttpClientMocks.postMock).toHaveBeenCalledWith('/', payload);
    expect(productHttpClientMocks.putMock).toHaveBeenCalledWith('/product-2', payload);
    expect(productHttpClientMocks.deleteMock).toHaveBeenCalledWith('/product-2');
  });
});
