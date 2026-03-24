import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

describe('PackingService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns packings with calculated packing unit price on create and update', async () => {
    const { PackingService: freshPackingService } = await import(
      '../../src/renderer/services/packing-service'
    );

    const createdPacking = await freshPackingService.createPacking({
      name: 'Envelope para cookie',
      description: 'Envelope selado',
      price: 12,
      quantity: 40,
      unitOfMeasure: UnitOfMeasure.package,
    });

    expect(createdPacking.packingUnitPrice).toBe(0.3);

    const updatedPacking = await freshPackingService.updatePacking(createdPacking.id, {
      name: 'Envelope para cookie',
      description: 'Envelope selado fosco',
      price: 15,
      quantity: 50,
      unitOfMeasure: UnitOfMeasure.package,
    });

    expect(updatedPacking.packingUnitPrice).toBe(0.3);

    const packings = await freshPackingService.getAllPackings();

    expect(packings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdPacking.id,
          description: 'Envelope selado fosco',
          packingUnitPrice: 0.3,
        }),
      ]),
    );
  });

  it('removes a packing by id', async () => {
    const { PackingService: freshPackingService } = await import(
      '../../src/renderer/services/packing-service'
    );

    const initialPackings = await freshPackingService.getAllPackings();
    const targetPacking = initialPackings[0];

    await freshPackingService.deletePacking(targetPacking.id);

    const remainingPackings = await freshPackingService.getAllPackings();

    expect(remainingPackings).toHaveLength(initialPackings.length - 1);
    expect(remainingPackings).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: targetPacking.id })]),
    );
  });
});
