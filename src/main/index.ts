import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';

import { initializeDatabase } from './backend/infra/sqlite/database';
import { registerBackendIpcHandlers } from './ipc/backend-ipc';
import { registerLoggingIpcHandlers } from './ipc/logging-ipc';
import { configureMainProcessLogging, mainLog } from './logging/app-logger';
import { createMainWindow } from './windows/main-window';

configureMainProcessLogging();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

void app.whenReady()
  .then(async () => {
    await initializeDatabase();
    registerLoggingIpcHandlers();
    registerBackendIpcHandlers();
    createMainWindow();
  })
  .catch((error) => {
    mainLog.error('Failed to initialize application database.', error);
    app.quit();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
