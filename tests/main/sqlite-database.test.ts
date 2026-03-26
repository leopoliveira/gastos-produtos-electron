// @vitest-environment node

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  closeDatabase,
  initializeDatabase,
  resolveAppDatabasePath,
} from '../../src/main/backend/infra/sqlite/database';

describe('sqlite database infrastructure', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('resolves the database into an App_Data directory', () => {
    expect(resolveAppDatabasePath('C:\\temp\\gastos-produtos')).toBe(
      path.join('C:\\temp\\gastos-produtos', 'App_Data', 'gastos.db'),
    );
  });

  it('creates the schema and records applied migrations only once', async () => {
    const tempDirectory = await mkdtemp(path.join(tmpdir(), 'gastos-produtos-sqlite-'));
    const databasePath = path.join(tempDirectory, 'App_Data', 'gastos.db');

    const database = await initializeDatabase(databasePath);
    const tables = await database.all<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC;",
    );
    const migrations = await database.all<{ Id: string }[]>(
      'SELECT "Id" FROM "__AppMigrations" ORDER BY "Id" ASC;',
    );

    expect(tables.map((table: { name: string }) => table.name)).toEqual(
      expect.arrayContaining([
        '__AppMigrations',
        'Groups',
        'Packings',
        'Products',
        'RecipeIngredients',
        'RecipePackings',
        'Recipes',
      ]),
    );
    expect(migrations.map((migration: { Id: string }) => migration.Id)).toEqual([
      '20260103201139_InitialCreate',
      '20260106223207_AddGroupsFeature',
      '20260325093000_AddRecipeDisplayUnits',
    ]);

    await closeDatabase();

    const reopenedDatabase = await initializeDatabase(databasePath);
    const reopenedMigrations = await reopenedDatabase.all<{ count: number }[]>(
      'SELECT COUNT(*) AS count FROM "__AppMigrations";',
    );

    expect(reopenedMigrations[0]?.count).toBe(3);
  });
});
