import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { copyFile, open, unlink } from 'node:fs/promises';
import path from 'node:path';

import {
  ipcChannels,
  serializeIpcError,
  type BackupExportResult,
  type BackupImportResult,
  type SerializedIpcError,
} from '../../shared/ipc';
import { InvalidOperationError } from '../backend/domain/errors';
import { closeDatabase, getAppDatabasePath, getDatabase, initializeDatabase } from '../backend/infra/sqlite/database';
import { mainLog } from '../logging/app-logger';

let handlersRegistered = false;

const SQLITE_MAGIC = Buffer.from('SQLite format 3\0', 'binary');

const assertTrustedSender = (event: IpcMainInvokeEvent): void => {
  const senderUrl = event.senderFrame.url;

  if (!senderUrl) {
    throw new Error('Unauthorized IPC sender.');
  }

  if (senderUrl.startsWith('file://')) {
    return;
  }

  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    throw new Error('Unauthorized IPC sender.');
  }

  const allowedOrigin = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin;

  if (new URL(senderUrl).origin !== allowedOrigin) {
    throw new Error('Unauthorized IPC sender.');
  }
};

const escapeSqlStringLiteral = (value: string): string => value.replaceAll("'", "''");

const sqlitePathForVacuumInto = (absolutePath: string): string => absolutePath.replace(/\\/g, '/');

type SqliteExec = {
  exec: (sql: string) => Promise<void>;
};

const exportDatabaseSnapshotFile = async (
  database: SqliteExec,
  databasePath: string,
  targetPath: string,
): Promise<void> => {
  const sqlPath = sqlitePathForVacuumInto(targetPath);

  try {
    await database.exec(`VACUUM INTO '${escapeSqlStringLiteral(sqlPath)}';`);
  } catch (vacuumError) {
    mainLog.warn('[ipc] Database backup VACUUM INTO failed; falling back to wal_checkpoint + file copy', {
      error: vacuumError,
      targetPath,
    });
    await database.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    await copyFile(databasePath, targetPath);
  }
};

const toSerializedIpcError = (error: unknown): SerializedIpcError => {
  if (error instanceof InvalidOperationError) {
    return {
      name: error.name,
      message: error.message,
      detail: error.message,
      problem: {
        code: 'invalid_operation',
        detail: error.message,
        status: 400,
        title: 'Bad Request',
      },
    };
  }

  return {
    name: 'Error',
    message: 'Não foi possível concluir a operação de backup.',
    detail: 'Não foi possível concluir a operação de backup.',
    problem: {
      code: 'internal_error',
      detail: 'Não foi possível concluir a operação de backup.',
      status: 500,
      title: 'Internal Server Error',
    },
  };
};

const assertSqliteBackupFile = async (filePath: string): Promise<void> => {
  let handle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    handle = await open(filePath, 'r');
    const buf = Buffer.alloc(SQLITE_MAGIC.length);
    const { bytesRead } = await handle.read(buf, 0, SQLITE_MAGIC.length, 0);

    if (bytesRead < SQLITE_MAGIC.length || !buf.equals(SQLITE_MAGIC)) {
      throw new InvalidOperationError(
        'O arquivo selecionado não é um backup SQLite válido.',
      );
    }
  } finally {
    if (handle) {
      await handle.close();
    }
  }
};

const removeIfExists = async (filePath: string): Promise<void> => {
  try {
    await unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code !== 'ENOENT') {
      throw error;
    }
  }
};

const parentWindow = (event: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(event.sender) ?? undefined;

const RELOAD_AFTER_BACKUP_IMPORT_MS = 1_200;

export const registerBackupIpcHandlers = (): void => {
  if (handlersRegistered) {
    return;
  }

  ipcMain.handle(ipcChannels.backup.export, async (event): Promise<BackupExportResult> => {
    assertTrustedSender(event);

    try {
      const defaultName = `gastos-backup-${new Date().toISOString().slice(0, 10)}.db`;
      const suggestedPath = path.join(app.getPath('documents'), defaultName);
      const { canceled, filePath } = await dialog.showSaveDialog(parentWindow(event), {
        title: 'Exportar backup',
        defaultPath: suggestedPath,
        filters: [{ name: 'Banco SQLite', extensions: ['db'] }],
        properties: ['showOverwriteConfirmation'],
      });

      if (canceled || !filePath?.trim()) {
        return { canceled: true };
      }

      const targetPath = path.resolve(filePath.trim());
      const databasePath = path.resolve(await getAppDatabasePath());

      if (targetPath === databasePath) {
        throw new InvalidOperationError(
          'Escolha um destino diferente do arquivo do banco em uso.',
        );
      }

      const database = await getDatabase();
      await exportDatabaseSnapshotFile(database, databasePath, targetPath);

      mainLog.info('[ipc] Database backup exported', { path: targetPath });

      return { canceled: false, filePath: targetPath };
    } catch (error) {
      if (error instanceof InvalidOperationError) {
        throw new Error(serializeIpcError(toSerializedIpcError(error)));
      }

      mainLog.error('[ipc] Database backup export failed', error);
      throw new Error(serializeIpcError(toSerializedIpcError(error)));
    }
  });

  ipcMain.handle(ipcChannels.backup.import, async (event): Promise<BackupImportResult> => {
    assertTrustedSender(event);

    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow(event), {
        title: 'Importar backup',
        filters: [{ name: 'Banco SQLite', extensions: ['db', 'sqlite'] }],
        properties: ['openFile'],
      });

      if (canceled || !filePaths?.[0]?.trim()) {
        return { canceled: true };
      }

      const sourcePath = path.resolve(filePaths[0].trim());
      const databasePath = path.resolve(await getAppDatabasePath());

      if (sourcePath === databasePath) {
        throw new InvalidOperationError(
          'Escolha um arquivo de backup diferente do banco em uso.',
        );
      }

      await assertSqliteBackupFile(sourcePath);

      await closeDatabase();
      await removeIfExists(`${databasePath}-wal`);
      await removeIfExists(`${databasePath}-shm`);
      await copyFile(sourcePath, databasePath);
      await initializeDatabase(databasePath);

      mainLog.info('[ipc] Database restored from backup', { path: sourcePath });

      const win = parentWindow(event);
      if (win) {
        setTimeout(() => {
          win.webContents.reload();
        }, RELOAD_AFTER_BACKUP_IMPORT_MS);
      }

      return { canceled: false };
    } catch (error) {
      try {
        await initializeDatabase();
      } catch (reopenError) {
        mainLog.error('[ipc] Database failed to reopen after import error', reopenError);
      }

      if (error instanceof InvalidOperationError) {
        throw new Error(serializeIpcError(toSerializedIpcError(error)));
      }

      mainLog.error('[ipc] Database backup import failed', error);
      throw new Error(serializeIpcError(toSerializedIpcError(error)));
    }
  });

  handlersRegistered = true;
};
