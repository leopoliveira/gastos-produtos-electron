import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';

import { mainLog } from '../../../logging/app-logger';
import { sqliteMigrations } from './migrations';

const MIGRATIONS_TABLE_NAME = '__AppMigrations';

let cachedDatabasePromise: Promise<Database> | undefined;
let cachedDatabasePath: string | undefined;

export type DatabaseProvider = () => Promise<Database>;

export const resolveAppDatabasePath = (baseDirectory: string): string =>
  path.join(baseDirectory, 'App_Data', 'gastos.db');

export const getAppDatabasePath = async (): Promise<string> => {
  const { app } = await import('electron');
  return resolveAppDatabasePath(app.getPath('userData'));
};

const openDatabase = async (filePath: string): Promise<Database> => {
  await mkdir(path.dirname(filePath), { recursive: true });

  const database = await open({
    filename: filePath,
    driver: sqlite3.Database,
  });

  await database.exec('PRAGMA foreign_keys = ON;');
  await database.exec('PRAGMA journal_mode = WAL;');

  mainLog.info('[backend:sqlite] Database opened', { path: filePath });

  return database;
};

const ensureMigrationsTable = async (database: Database): Promise<void> => {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE_NAME}" (
      "Id" TEXT NOT NULL PRIMARY KEY,
      "AppliedAt" TEXT NOT NULL
    );
  `);
};

const getAppliedMigrationIds = async (database: Database): Promise<Set<string>> => {
  const rows = await database.all<{ Id: string }[]>(
    `SELECT "Id" FROM "${MIGRATIONS_TABLE_NAME}" ORDER BY "AppliedAt" ASC, "Id" ASC;`,
  );

  return new Set(rows.map((row: { Id: string }) => row.Id));
};

const applyPendingMigrations = async (database: Database): Promise<void> => {
  await ensureMigrationsTable(database);

  const appliedMigrationIds = await getAppliedMigrationIds(database);

  for (const migration of sqliteMigrations) {
    if (appliedMigrationIds.has(migration.id)) {
      continue;
    }

    await database.exec('BEGIN;');

    try {
      await database.exec(migration.sql);
      await database.run(
        `INSERT INTO "${MIGRATIONS_TABLE_NAME}" ("Id", "AppliedAt") VALUES (?, ?);`,
        migration.id,
        new Date().toISOString(),
      );
      await database.exec('COMMIT;');
      mainLog.info('[backend:sqlite] Applied migration', { id: migration.id });
    } catch (error) {
      await database.exec('ROLLBACK;');
      mainLog.error('[backend:sqlite] Migration failed', { id: migration.id, error });
      throw error;
    }
  }
};

export const initializeDatabase = async (filePath?: string): Promise<Database> => {
  const resolvedFilePath = filePath ?? await getAppDatabasePath();

  if (!cachedDatabasePromise || cachedDatabasePath !== resolvedFilePath) {
    cachedDatabasePath = resolvedFilePath;
    cachedDatabasePromise = openDatabase(resolvedFilePath).then(async (database) => {
      await applyPendingMigrations(database);
      return database;
    });
    cachedDatabasePromise = cachedDatabasePromise.catch((error) => {
      cachedDatabasePromise = undefined;
      cachedDatabasePath = undefined;
      throw error;
    });
  }

  return cachedDatabasePromise;
};

export const getDatabase = async (): Promise<Database> => initializeDatabase();

export const createDatabaseProvider = (filePath?: string): DatabaseProvider => () =>
  initializeDatabase(filePath);

export const runInTransaction = async <T>(
  database: Database,
  operation: () => Promise<T>,
): Promise<T> => {
  await database.exec('BEGIN;');

  try {
    const result = await operation();
    await database.exec('COMMIT;');
    return result;
  } catch (error) {
    await database.exec('ROLLBACK;');
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (!cachedDatabasePromise) {
    cachedDatabasePath = undefined;
    return;
  }

  const database = await cachedDatabasePromise;

  cachedDatabasePromise = undefined;
  cachedDatabasePath = undefined;

  await database.close();
  mainLog.info('[backend:sqlite] Database connection closed');
};
