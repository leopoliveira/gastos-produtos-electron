import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';

import { initializeDatabase } from './backend/infra/sqlite/database';
import { registerBackendIpcHandlers } from './ipc/backend-ipc';
import { createMainWindow } from './windows/main-window';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

void app.whenReady()
  .then(async () => {
    await initializeDatabase();
    registerBackendIpcHandlers();
    createMainWindow();
  })
  .catch((error) => {
    console.error('Failed to initialize application database.', error);
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
