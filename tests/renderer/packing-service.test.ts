import { beforeEach, describe, expect, it, vi } from 'vitest';

const packingHttpClientMocks = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/http/domain-clients', () => ({
  getPackingHttpClient: () => ({
    delete: packingHttpClientMocks.deleteMock,
    get: packingHttpClientMocks.getMock,
    post: packingHttpClientMocks.postMock,
    put: packingHttpClientMocks.putMock,
  }),
}));

describe('PackingService', () => {
  beforeEach(() => {
    vi.resetModules();
    packingHttpClientMocks.deleteMock.mockReset();
    packingHttpClientMocks.getMock.mockReset();
    packingHttpClientMocks.postMock.mockReset();
    packingHttpClientMocks.putMock.mockReset();
  });

  it('loads packings and reuses the same list for packing options', async () => {
    const packings = [
      {
        id: 'packing-1',
        name: 'Envelope para cookie',
        description: 'Envelope selado',
        price: 12,
        quantity: 40,
        unitOfMeasure: 8,
        packingUnitPrice: 0.3,
      },
    ];
    packingHttpClientMocks.getMock.mockResolvedValue({ data: packings });
    const { PackingService } = await import('../../src/renderer/services/packing-service');

    await expect(PackingService.getAllPackings()).resolves.toEqual(packings);
    await expect(PackingService.getAllPackingsDto()).resolves.toEqual(packings);
    expect(packingHttpClientMocks.getMock).toHaveBeenCalledWith('/');
  });

  it('creates, updates and deletes packings through the API client', async () => {
    const payload = {
      name: 'Envelope para cookie',
      description: 'Envelope selado',
      price: 12,
      quantity: 40,
      unitOfMeasure: 8,
    };
    const response = { data: { id: 'packing-1', ...payload, packingUnitPrice: 0.3 } };
    packingHttpClientMocks.postMock.mockResolvedValue(response);
    packingHttpClientMocks.putMock.mockResolvedValue(response);
    packingHttpClientMocks.deleteMock.mockResolvedValue(undefined);
    const { PackingService } = await import('../../src/renderer/services/packing-service');

    await expect(PackingService.createPacking(payload)).resolves.toEqual(response.data);
    await expect(PackingService.updatePacking('packing-1', payload)).resolves.toEqual(response.data);
    await expect(PackingService.deletePacking('packing-1')).resolves.toBeUndefined();

    expect(packingHttpClientMocks.postMock).toHaveBeenCalledWith('/', payload);
    expect(packingHttpClientMocks.putMock).toHaveBeenCalledWith('/packing-1', payload);
    expect(packingHttpClientMocks.deleteMock).toHaveBeenCalledWith('/packing-1');
  });
});
