import type {
  AddGroupRequest,
  AddGroupResponse,
  GroupResponse,
  GroupWriteDto,
} from '../../../shared/groups';

import { InvalidOperationError, NotFoundError } from '../domain/errors';
import { createGroupRecord } from '../domain/entities';
import type { DatabaseProvider } from '../infra/sqlite/database';
import { mainLog } from '../../logging/app-logger';

const GROUP_NOT_FOUND_MESSAGE = 'Grupo não encontrado.';
const GROUP_NAME_REQUIRED_MESSAGE = 'Nome do grupo é obrigatório.';
const GROUP_IN_USE_MESSAGE = 'Não é possível deletar um grupo que está em uso por receitas.';

const assertGroupName = (name: string): void => {
  if (!name.trim()) {
    throw new InvalidOperationError(GROUP_NAME_REQUIRED_MESSAGE);
  }
};

export class GroupService {
  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async getAll(): Promise<GroupResponse[]> {
    const database = await this.databaseProvider();

    return database.all<GroupResponse[]>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description
      FROM "Groups"
      WHERE "IsDeleted" = 0
      ORDER BY "CreatedAt" ASC;`,
    );
  }

  async getById(id: string): Promise<GroupResponse> {
    const database = await this.databaseProvider();
    const group = await database.get<GroupResponse>(
      `SELECT
        "Id" AS id,
        "Name" AS name,
        "Description" AS description
      FROM "Groups"
      WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!group) {
      throw new NotFoundError(GROUP_NOT_FOUND_MESSAGE);
    }

    return group;
  }

  async create(payload: AddGroupRequest): Promise<AddGroupResponse> {
    assertGroupName(payload.name);

    const database = await this.databaseProvider();
    const group = createGroupRecord(payload);

    await database.run(
      `INSERT INTO "Groups" (
        "Id",
        "Name",
        "Description",
        "CreatedAt",
        "UpdatedAt",
        "IsDeleted"
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      group.id,
      group.name,
      group.description ?? null,
      group.createdAt,
      group.updatedAt,
      group.isDeleted ? 1 : 0,
    );

    mainLog.info('[backend:groups] Created group', { groupId: group.id, name: group.name });

    return { id: group.id };
  }

  async update(id: string, payload: GroupWriteDto): Promise<void> {
    assertGroupName(payload.name);

    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Groups" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError(GROUP_NOT_FOUND_MESSAGE);
    }

    await database.run(
      `UPDATE "Groups"
      SET
        "Name" = ?,
        "Description" = ?,
        "UpdatedAt" = ?
      WHERE "Id" = ?;`,
      payload.name,
      payload.description ?? null,
      new Date().toISOString(),
      id,
    );

    mainLog.info('[backend:groups] Updated group', { groupId: id });
  }

  async delete(id: string): Promise<void> {
    const database = await this.databaseProvider();
    const existing = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Groups" WHERE "Id" = ? AND "IsDeleted" = 0;`,
      id,
    );

    if (!existing) {
      throw new NotFoundError(GROUP_NOT_FOUND_MESSAGE);
    }

    const activeRecipe = await database.get<{ id: string }>(
      `SELECT "Id" AS id FROM "Recipes" WHERE "GroupId" = ? AND "IsDeleted" = 0 LIMIT 1;`,
      id,
    );

    if (activeRecipe) {
      mainLog.warn('[backend:groups] Delete blocked: group referenced by recipes', { groupId: id });
      throw new InvalidOperationError(GROUP_IN_USE_MESSAGE);
    }

    await database.run(
      `UPDATE "Groups"
      SET "IsDeleted" = 1
      WHERE "Id" = ?;`,
      id,
    );

    mainLog.info('[backend:groups] Soft-deleted group', { groupId: id });
  }
}
