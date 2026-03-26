import { beforeEach, describe, expect, it, vi } from 'vitest';

const appApiMocks = vi.hoisted(() => ({
  backup: {
    exportBackup: vi.fn(),
    importBackup: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/electron-api', () => ({
  getAppApi: () => appApiMocks,
}));

describe('backup service', () => {
  beforeEach(() => {
    vi.resetModules();
    appApiMocks.backup.exportBackup.mockReset();
    appApiMocks.backup.importBackup.mockReset();
  });

  it('delegates export to the preload bridge', async () => {
    appApiMocks.backup.exportBackup.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/backup.db',
    });

    const { exportDatabaseBackup } = await import('../../src/renderer/services/backup-service');

    await expect(exportDatabaseBackup()).resolves.toEqual({
      canceled: false,
      filePath: '/tmp/backup.db',
    });
    expect(appApiMocks.backup.exportBackup).toHaveBeenCalledWith();
  });

  it('delegates import to the preload bridge', async () => {
    appApiMocks.backup.importBackup.mockResolvedValue({ canceled: false });

    const { importDatabaseBackup } = await import('../../src/renderer/services/backup-service');

    await expect(importDatabaseBackup()).resolves.toEqual({ canceled: false });
    expect(appApiMocks.backup.importBackup).toHaveBeenCalledWith();
  });
});
