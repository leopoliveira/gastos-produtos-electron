import { getAppApi } from './electron-api';

export const exportDatabaseBackup = () => getAppApi().backup.exportBackup();

export const importDatabaseBackup = () => getAppApi().backup.importBackup();
