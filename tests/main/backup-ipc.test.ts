// @vitest-environment node

import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  ipcMainHandleMock,
  getPathMock,
  showSaveDialogMock,
  showOpenDialogMock,
  fromWebContentsMock,
  openMock,
  copyFileMock,
  unlinkMock,
  closeDatabaseMock,
  getAppDatabasePathMock,
  getDatabaseMock,
  initializeDatabaseMock,
  mainLogInfoMock,
  mainLogWarnMock,
  mainLogErrorMock,
  reloadMock,
} = vi.hoisted(() => {
  const reload = vi.fn();

  return {
    ipcMainHandleMock: vi.fn(),
    getPathMock: vi.fn((name: string) => (name === 'documents' ? '/fake/Documents' : '/fake')),
    showSaveDialogMock: vi.fn(),
    showOpenDialogMock: vi.fn(),
    fromWebContentsMock: vi.fn(() => ({
      webContents: { reload },
    })),
    openMock: vi.fn(),
    copyFileMock: vi.fn(),
    unlinkMock: vi.fn(),
    closeDatabaseMock: vi.fn(),
    getAppDatabasePathMock: vi.fn(),
    getDatabaseMock: vi.fn(),
    initializeDatabaseMock: vi.fn(),
    mainLogInfoMock: vi.fn(),
    mainLogWarnMock: vi.fn(),
    mainLogErrorMock: vi.fn(),
    reloadMock: reload,
  };
});

vi.mock('electron', () => ({
  app: {
    getPath: getPathMock,
  },
  ipcMain: {
    handle: ipcMainHandleMock,
  },
  dialog: {
    showSaveDialog: showSaveDialogMock,
    showOpenDialog: showOpenDialogMock,
  },
  BrowserWindow: {
    fromWebContents: fromWebContentsMock,
  },
}));

vi.mock('node:fs/promises', () => ({
  open: openMock,
  copyFile: copyFileMock,
  unlink: unlinkMock,
}));

vi.mock('../../src/main/backend/infra/sqlite/database', () => ({
  closeDatabase: closeDatabaseMock,
  getAppDatabasePath: getAppDatabasePathMock,
  getDatabase: getDatabaseMock,
  initializeDatabase: initializeDatabaseMock,
}));

vi.mock('../../src/main/logging/app-logger', () => ({
  mainLog: {
    info: mainLogInfoMock,
    warn: mainLogWarnMock,
    error: mainLogErrorMock,
  },
}));

const SQLITE_MAGIC = Buffer.from('SQLite format 3\0', 'binary');

const sqliteFileHandleValid = () => {
  const read = vi.fn((buffer: Buffer, offset: number, length: number) => {
    SQLITE_MAGIC.copy(buffer, offset, 0, Math.min(length, SQLITE_MAGIC.length));
    return Promise.resolve({ bytesRead: SQLITE_MAGIC.length, buffer });
  });
  const close = vi.fn().mockResolvedValue(undefined);
  return { read, close };
};

const sqliteFileHandleInvalid = () => {
  const read = vi.fn().mockResolvedValue({
    bytesRead: 4,
    buffer: Buffer.alloc(16),
  });
  const close = vi.fn().mockResolvedValue(undefined);
  return { read, close };
};

const getRegisteredHandler = (channel: string): ((event: unknown, ...args: unknown[]) => unknown) | undefined =>
  ipcMainHandleMock.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1] as
    | ((event: unknown, ...args: unknown[]) => unknown)
    | undefined;

const escapeSqlStringLiteral = (value: string): string => value.replaceAll("'", "''");

describe('registerBackupIpcHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mainLogInfoMock.mockReset();
    mainLogWarnMock.mockReset();
    mainLogErrorMock.mockReset();
    reloadMock.mockReset();
    getPathMock.mockImplementation((name: string) =>
      name === 'documents' ? '/fake/Documents' : '/fake',
    );
    getAppDatabasePathMock.mockResolvedValue('/fake/userData/App_Data/gastos.db');
    closeDatabaseMock.mockResolvedValue(undefined);
    initializeDatabaseMock.mockResolvedValue(undefined);
    copyFileMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);
    openMock.mockResolvedValue(sqliteFileHandleValid());
    const execMock = vi.fn().mockResolvedValue(undefined);
    getDatabaseMock.mockResolvedValue({ exec: execMock });
    showSaveDialogMock.mockResolvedValue({
      canceled: false,
      filePath: '/fake/export/gastos-backup.db',
    });
    showOpenDialogMock.mockResolvedValue({
      canceled: false,
      filePaths: ['/fake/import/backup.db'],
    });
    Object.assign(globalThis as Record<string, unknown>, {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: 'http://localhost:5173',
    });
  });

  it('registers export and import handlers only once across repeated registration', async () => {
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    registerBackupIpcHandlers();
    registerBackupIpcHandlers();

    expect(ipcMainHandleMock).toHaveBeenCalledTimes(2);
  });

  it('returns canceled when the export dialog is dismissed or no path is chosen', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);
    const trustedEvent = { sender: {}, senderFrame: { url: 'http://localhost:5173/configuration' } };

    showSaveDialogMock.mockResolvedValueOnce({ canceled: true, filePath: '' });

    await expect(exportHandler?.(trustedEvent)).resolves.toEqual({ canceled: true });

    showSaveDialogMock.mockResolvedValueOnce({ canceled: false, filePath: '   ' });

    await expect(exportHandler?.(trustedEvent)).resolves.toEqual({ canceled: true });
  });

  it('exports a VACUUM INTO snapshot for a trusted sender and logs success', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    const execMock = vi.fn().mockResolvedValue(undefined);
    getDatabaseMock.mockResolvedValue({ exec: execMock });

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);
    const trustedEvent = { sender: {}, senderFrame: { url: 'file:///C:/app/index.html' } };

    const resolvedExportPath = path.resolve('/fake/export/gastos-backup.db');

    await expect(exportHandler?.(trustedEvent)).resolves.toEqual({
      canceled: false,
      filePath: resolvedExportPath,
    });

    const sqlExportPath = resolvedExportPath.replace(/\\/g, '/');
    expect(execMock).toHaveBeenCalledWith(`VACUUM INTO '${escapeSqlStringLiteral(sqlExportPath)}';`);
    expect(mainLogInfoMock).toHaveBeenCalledWith('[ipc] Database backup exported', {
      path: resolvedExportPath,
    });

    expect(getPathMock).toHaveBeenCalledWith('documents');
    const saveOptions = showSaveDialogMock.mock.calls[0]?.[1] as { defaultPath: string };
    expect(saveOptions.defaultPath).toBe(
      path.join('/fake/Documents', path.basename(saveOptions.defaultPath)),
    );
    expect(path.basename(saveOptions.defaultPath)).toMatch(/^gastos-backup-\d{4}-\d{2}-\d{2}\.db$/);
  });

  it('escapes single quotes in the export destination for VACUUM INTO', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    const execMock = vi.fn().mockResolvedValue(undefined);
    getDatabaseMock.mockResolvedValue({ exec: execMock });
    showSaveDialogMock.mockResolvedValueOnce({
      canceled: false,
      filePath: "/fake/export/backup'o.db",
    });

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);

    await exportHandler?.({
      sender: {},
      senderFrame: { url: 'http://localhost:5173/configuration' },
    });

    const resolvedQuoted = path.resolve("/fake/export/backup'o.db");
    const sqlQuotedPath = resolvedQuoted.replace(/\\/g, '/');
    expect(execMock).toHaveBeenCalledWith(`VACUUM INTO '${escapeSqlStringLiteral(sqlQuotedPath)}';`);
  });

  it('rejects export when the destination matches the live database path', async () => {
    const { ipcChannels, parseIpcError } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    showSaveDialogMock.mockResolvedValueOnce({
      canceled: false,
      filePath: '/fake/userData/App_Data/gastos.db',
    });

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);

    await expect(
      exportHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).rejects.toSatisfy((error: Error) => parseIpcError(error.message)?.problem.code === 'invalid_operation');
  });

  it('rejects untrusted senders for backup channels', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);
    const importHandler = getRegisteredHandler(ipcChannels.backup.import);
    const evilEvent = { sender: {}, senderFrame: { url: 'https://evil.example/backup' } };

    await expect(exportHandler?.(evilEvent)).rejects.toThrow('Unauthorized IPC sender.');
    await expect(importHandler?.(evilEvent)).rejects.toThrow('Unauthorized IPC sender.');
  });

  it('falls back to wal_checkpoint + copy when VACUUM INTO fails', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    const execMock = vi.fn().mockRejectedValueOnce(new Error('SQLITE_VACUUM_INTO')).mockResolvedValueOnce(undefined);
    getDatabaseMock.mockResolvedValue({ exec: execMock });

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);

    await expect(
      exportHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).resolves.toEqual(
      expect.objectContaining({ canceled: false, filePath: path.resolve('/fake/export/gastos-backup.db') }),
    );

    expect(execMock).toHaveBeenCalledTimes(2);
    expect(copyFileMock).toHaveBeenCalledWith(
      path.resolve('/fake/userData/App_Data/gastos.db'),
      path.resolve('/fake/export/gastos-backup.db'),
    );
  });

  it('serializes export failures as internal_error when VACUUM and checkpoint both fail', async () => {
    const { ipcChannels, parseIpcError } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    const boom = new Error('no space left on device');
    const execMock = vi.fn().mockRejectedValue(boom);
    getDatabaseMock.mockResolvedValue({ exec: execMock });

    registerBackupIpcHandlers();
    const exportHandler = getRegisteredHandler(ipcChannels.backup.export);

    await expect(
      exportHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).rejects.toSatisfy((error: Error) => parseIpcError(error.message)?.problem.code === 'internal_error');

    expect(mainLogErrorMock).toHaveBeenCalledWith('[ipc] Database backup export failed', boom);
  });

  it('returns canceled when the import dialog is dismissed', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    showOpenDialogMock.mockResolvedValueOnce({ canceled: true, filePaths: [] });

    registerBackupIpcHandlers();
    const importHandler = getRegisteredHandler(ipcChannels.backup.import);

    await expect(
      importHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).resolves.toEqual({ canceled: true });
  });

  it('rejects import when the file is not a SQLite backup', async () => {
    const { ipcChannels, parseIpcError } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    openMock.mockResolvedValueOnce(sqliteFileHandleInvalid());

    registerBackupIpcHandlers();
    const importHandler = getRegisteredHandler(ipcChannels.backup.import);

    await expect(
      importHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).rejects.toSatisfy((error: Error) => {
      const parsed = parseIpcError(error.message);
      return parsed?.problem.code === 'invalid_operation' &&
        parsed.detail.includes('não é um backup SQLite');
    });

    expect(closeDatabaseMock).not.toHaveBeenCalled();
  });

  it('rejects import when the selected file is the live database', async () => {
    const { ipcChannels, parseIpcError } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    showOpenDialogMock.mockResolvedValueOnce({
      canceled: false,
      filePaths: ['/fake/userData/App_Data/gastos.db'],
    });

    registerBackupIpcHandlers();
    const importHandler = getRegisteredHandler(ipcChannels.backup.import);

    await expect(
      importHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).rejects.toSatisfy((error: Error) => parseIpcError(error.message)?.problem.code === 'invalid_operation');

    expect(closeDatabaseMock).not.toHaveBeenCalled();
  });

  it('replaces the database from a valid backup, reopens, reloads the window after a short delay, and logs', async () => {
    vi.useFakeTimers();

    try {
      const { ipcChannels } = await import('../../src/shared/ipc');
      const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

      registerBackupIpcHandlers();
      const importHandler = getRegisteredHandler(ipcChannels.backup.import);
      const trustedEvent = { sender: {}, senderFrame: { url: 'http://localhost:5173/configuration' } };

      await expect(importHandler?.(trustedEvent)).resolves.toEqual({ canceled: false });

      const resolvedDbPath = path.resolve('/fake/userData/App_Data/gastos.db');
      const resolvedSourcePath = path.resolve('/fake/import/backup.db');

      expect(closeDatabaseMock).toHaveBeenCalledWith();
      expect(unlinkMock).toHaveBeenCalledWith(`${resolvedDbPath}-wal`);
      expect(unlinkMock).toHaveBeenCalledWith(`${resolvedDbPath}-shm`);
      expect(copyFileMock).toHaveBeenCalledWith(resolvedSourcePath, resolvedDbPath);
      expect(initializeDatabaseMock).toHaveBeenCalledWith(resolvedDbPath);
      expect(reloadMock).not.toHaveBeenCalled();
      await vi.runAllTimersAsync();
      expect(reloadMock).toHaveBeenCalledWith();
      expect(mainLogInfoMock).toHaveBeenCalledWith('[ipc] Database restored from backup', {
        path: resolvedSourcePath,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('attempts to reopen the database when import fails after validation', async () => {
    const { ipcChannels, parseIpcError } = await import('../../src/shared/ipc');
    const { registerBackupIpcHandlers } = await import('../../src/main/ipc/backup-ipc');

    const diskError = new Error('EACCES');
    copyFileMock.mockRejectedValueOnce(diskError);

    registerBackupIpcHandlers();
    const importHandler = getRegisteredHandler(ipcChannels.backup.import);

    await expect(
      importHandler?.({
        sender: {},
        senderFrame: { url: 'http://localhost:5173/configuration' },
      }),
    ).rejects.toSatisfy((error: Error) => parseIpcError(error.message)?.problem.code === 'internal_error');

    expect(initializeDatabaseMock).toHaveBeenCalledWith();
    expect(mainLogErrorMock).toHaveBeenCalledWith('[ipc] Database backup import failed', diskError);
  });
});
