import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';

import { registerBackendIpcHandlers } from './ipc/backend-ipc';
import { createMainWindow } from './windows/main-window';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

void app.whenReady().then(() => {
  registerBackendIpcHandlers();
  createMainWindow();
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
