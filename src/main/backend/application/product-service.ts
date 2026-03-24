import type {
  AddProductRequest,
  AddProductResponse,
  GetProductResponse,
  UpdateProductDto,
} from '../../../shared/products';

import { NotFoundError } from '../domain/errors';
import { createProductRecord, type ProductRecord } from '../domain/entities';
import type { DatabaseProvider } from '../infra/sqlite/database';

const toReadProduct = (product: ProductRecord): GetProductResponse => ({
  id: product.id,
  name: product.name,
  price: product.price,
  quantity: product.quantity,
  unitOfMeasure: product.unitOfMeasure,
  unitPrice: product.quantity === 0 ? 0 : product.price / product.quantity,
});

export class ProductService {
  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async getAll(): Promise<GetProductResponse[]> {
    const database = await this.databaseProvider();
    const rows = await database.all<ProductRecord[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Price" AS price,
        "Quantity" AS quantity,
        "UnitOfMeasure" AS unitOfMeasure,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Products"
      WHERE "IsDeleted" = 0
      ORDER BY "CreatedAt" ASC;`,
    );

    return rows.map(toReadProduct);
  }

  async getById(id: string): Promise<GetProductResponse> {
    const database = await this.databaseProvider();
    const product = await database.get<ProductRecord>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Price" AS price,
        "Quantity" AS quantity,
        "UnitOfMeasure" AS unitOfMeasure,
        "CreatedAt" AS createdAt,
        "UpdatedAt" AS updatedAt,
        "IsDeleted" AS isDeleted
      FROM "Products"
      WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return toReadProduct(product);
  }

  async create(payload: AddProductRequest): Promise<AddProductResponse> {
    const database = await this.databaseProvider();
    const product = createProductRecord(payload);

    await database.run(
      `INSERT INTO "Products" (
        "Id",
        "Name",
        "Price",
        "Quantity",
        "UnitOfMeasure",
        "CreatedAt",
        "UpdatedAt",
        "IsDeleted"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      product.id,
      product.name,
      product.price,
      product.quantity,
      product.unitOfMeasure,
      product.createdAt,
      product.updatedAt,
      product.isDeleted ? 1 : 0,
    );

    return { productId: product.id };
  }

  async update(id: string, payload: UpdateProductDto): Promise<void> {
    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Products" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    await database.run(
      `UPDATE "Products"
      SET
        "Name" = ?,
        "Price" = ?,
        "Quantity" = ?,
        "UnitOfMeasure" = ?,
        "UpdatedAt" = ?
      WHERE "Id" = ?;`,
      payload.name,
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
      `SELECT "Id" AS id FROM "Products" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError('Product not found. Nothing will be deleted.');
    }

    await database.run(
      `UPDATE "Products"
      SET
        "IsDeleted" = 1,
        "UpdatedAt" = ?
      WHERE "Id" = ?;`,
      new Date().toISOString(),
      id,
    );
  }
}
