import { beforeEach, describe, expect, it, vi } from 'vitest';

const appApiMocks = vi.hoisted(() => ({
  packings: {
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

describe('PackingService', () => {
  beforeEach(() => {
    vi.resetModules();
    appApiMocks.packings.create.mockReset();
    appApiMocks.packings.delete.mockReset();
    appApiMocks.packings.getById.mockReset();
    appApiMocks.packings.list.mockReset();
    appApiMocks.packings.update.mockReset();
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
    appApiMocks.packings.list.mockResolvedValue(packings);
    const { PackingService } = await import('../../src/renderer/services/packing-service');

    await expect(PackingService.getAllPackings()).resolves.toEqual(packings);
    await expect(PackingService.getAllPackingsDto()).resolves.toEqual(packings);
    expect(appApiMocks.packings.list).toHaveBeenCalledTimes(2);
  });

  it('creates, updates and deletes packings through the preload bridge', async () => {
    const payload = {
      name: 'Envelope para cookie',
      description: 'Envelope selado',
      price: 12,
      quantity: 40,
      unitOfMeasure: 8,
    };
    const response = { id: 'packing-1', ...payload, packingUnitPrice: 0.3 };
    appApiMocks.packings.create.mockResolvedValue({ packingId: 'packing-1' });
    appApiMocks.packings.getById.mockResolvedValue(response);
    appApiMocks.packings.update.mockResolvedValue(undefined);
    appApiMocks.packings.delete.mockResolvedValue(undefined);
    const { PackingService } = await import('../../src/renderer/services/packing-service');

    await expect(PackingService.createPacking(payload)).resolves.toEqual(response);
    await expect(PackingService.updatePacking('packing-1', payload)).resolves.toEqual(response);
    await expect(PackingService.deletePacking('packing-1')).resolves.toBeUndefined();

    expect(appApiMocks.packings.create).toHaveBeenCalledWith(payload);
    expect(appApiMocks.packings.update).toHaveBeenCalledWith('packing-1', payload);
    expect(appApiMocks.packings.getById).toHaveBeenNthCalledWith(1, 'packing-1');
    expect(appApiMocks.packings.getById).toHaveBeenNthCalledWith(2, 'packing-1');
    expect(appApiMocks.packings.delete).toHaveBeenCalledWith('packing-1');
  });
});
