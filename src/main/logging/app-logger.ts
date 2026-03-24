import { mkdirSync } from 'fs';
import path from 'path';

import { app } from 'electron';
import log from 'electron-log/main';

let configured = false;

const applyInstallAdjacentFileTransport = (): void => {
  const logsDir = path.join(path.dirname(process.execPath), 'logs');
  mkdirSync(logsDir, { recursive: true });

  log.transports.file.resolvePathFn = (variables) =>
    path.join(logsDir, variables.fileName ?? 'main.log');
};

export const configureMainProcessLogging = (): void => {
  if (configured) {
    return;
  }

  configured = true;

  log.transports.file.level = 'info';
  log.transports.console.level = app.isPackaged ? 'warn' : 'debug';

  if (app.isPackaged) {
    applyInstallAdjacentFileTransport();
  }
};

export const mainLog = log;
