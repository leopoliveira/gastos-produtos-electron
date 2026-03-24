import type {
  AddPackingRequest,
  AddPackingResponse,
  GetPackingResponse,
  UpdatePackingDto,
} from '../../../shared/packings';

import { NotFoundError } from '../domain/errors';
import { createPackingRecord, type PackingRecord } from '../domain/entities';
import type { DatabaseProvider } from '../infra/sqlite/database';

const toReadPacking = (packing: PackingRecord): GetPackingResponse => ({
  id: packing.id,
  name: packing.name,
  description: packing.description,
  price: packing.price,
  quantity: packing.quantity,
  unitOfMeasure: packing.unitOfMeasure,
  packingUnitPrice: packing.quantity === 0 ? 0 : packing.price / packing.quantity,
});

export class PackingService {
  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async getAll(): Promise<GetPackingResponse[]> {
    const database = await this.databaseProvider();
    const rows = await database.all<PackingRecord[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description,
        "Price" AS price,
        "Quantity" AS quantity,
        "UnitOfMeasure" AS unitOfMeasure,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Packings"
      WHERE "IsDeleted" = 0
      ORDER BY "CreatedAt" ASC;`,
    );

    return rows.map(toReadPacking);
  }

  async getById(id: string): Promise<GetPackingResponse> {
    const database = await this.databaseProvider();
    const packing = await database.get<PackingRecord>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description,
        "Price" AS price,
        "Quantity" AS quantity,
        "UnitOfMeasure" AS unitOfMeasure,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Packings"
      WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!packing) {
      throw new NotFoundError('Packing not found.');
    }

    return toReadPacking(packing);
  }

  async create(payload: AddPackingRequest): Promise<AddPackingResponse> {
    const database = await this.databaseProvider();
    const packing = createPackingRecord(payload);

    await database.run(
      `INSERT INTO "Packings" (
        "Id",
        "Name",
        "Description",
        "Price",
        "Quantity",
        "UnitOfMeasure",
        "CreatedAt",
        "UpdatedAt",
        "IsDeleted"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      packing.id,
      packing.name,
      packing.description ?? null,
      packing.price,
      packing.quantity,
      packing.unitOfMeasure,
      packing.createdAt,
      packing.updatedAt,
      packing.isDeleted ? 1 : 0,
    );

    return { packingId: packing.id };
  }

  async update(id: string, payload: UpdatePackingDto): Promise<void> {
    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Packings" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError('Packing not found.');
    }

    await database.run(
      `UPDATE "Packings"
      SET
        "Name" = ?,
        "Description" = ?,
        "Price" = ?,
        "Quantity" = ?,
        "UnitOfMeasure" = ?,
        "UpdatedAt" = ?
      WHERE "Id" = ?;`,
      payload.name,
      payload.description ?? null,
      payload.price,
      payload.quantity,
      payload.unitOfMeasure,
      new Date().toISOString(),
      id,
    );
  }

  async delete(id: string): Promise<void> {
    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Packings" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError('Packing not found. Nothing will be deleted.');
    }

    await database.run(
      `UPDATE "Packings"
      SET
        "IsDeleted" = 1,
        "UpdatedAt" = ?
      WHERE "Id" = ?;`,
      new Date().toISOString(),
      id,
    );
  }
}
