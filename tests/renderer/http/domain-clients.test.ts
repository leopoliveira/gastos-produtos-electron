import { beforeEach, describe, expect, it, vi } from 'vitest';

const domainClientMocks = vi.hoisted(() => ({
  createHttpClientMock: vi.fn(),
  resolveApiBaseUrlsMock: vi.fn(),
}));

vi.mock('../../../src/renderer/services/http/api-config', () => ({
  resolveApiBaseUrls: domainClientMocks.resolveApiBaseUrlsMock,
}));

vi.mock('../../../src/renderer/services/http/client', () => ({
  createHttpClient: domainClientMocks.createHttpClientMock,
}));

describe('domain clients', () => {
  beforeEach(() => {
    vi.resetModules();
    domainClientMocks.createHttpClientMock.mockReset();
    domainClientMocks.resolveApiBaseUrlsMock.mockReset();
    domainClientMocks.resolveApiBaseUrlsMock.mockReturnValue({
      products: 'https://api.example.com/Product',
      packings: 'https://api.example.com/Packing',
      recipes: 'https://api.example.com/Recipe',
      groups: 'https://api.example.com/Group',
    });
    domainClientMocks.createHttpClientMock
      .mockReturnValueOnce({ name: 'products-client' })
      .mockReturnValueOnce({ name: 'packings-client' })
      .mockReturnValueOnce({ name: 'recipes-client' })
      .mockReturnValueOnce({ name: 'groups-client' });
  });

  it('does not resolve environment on import and caches clients after the first getter call', async () => {
    const module = await import('../../../src/renderer/services/http/domain-clients');

    expect(domainClientMocks.resolveApiBaseUrlsMock).not.toHaveBeenCalled();
    expect(domainClientMocks.createHttpClientMock).not.toHaveBeenCalled();

    const firstClient = module.getProductHttpClient();
    const secondClient = module.getProductHttpClient();

    expect(firstClient).toEqual({ name: 'products-client' });
    expect(secondClient).toEqual({ name: 'products-client' });
    expect(domainClientMocks.resolveApiBaseUrlsMock).toHaveBeenCalledTimes(1);
    expect(domainClientMocks.createHttpClientMock).toHaveBeenCalledTimes(4);
  });
});
