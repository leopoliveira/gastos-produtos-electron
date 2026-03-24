import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { ipcChannels, type RendererLogLevel, type RendererLogPayload } from '../../shared/ipc';
import { mainLog } from '../logging/app-logger';

let handlersRegistered = false;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const LOG_LEVELS: ReadonlySet<RendererLogLevel> = new Set(['debug', 'info', 'warn', 'error']);

const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_KEYS = 20;
const MAX_CONTEXT_KEY_LENGTH = 64;
const MAX_CONTEXT_STRING_VALUE_LENGTH = 500;

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

const isContextValue = (value: unknown): value is string | number | boolean | null =>
  value === null ||
  typeof value === 'boolean' ||
  typeof value === 'number' ||
  typeof value === 'string';

const assertRendererLogPayload = (payload: unknown): RendererLogPayload => {
  if (!isObject(payload) || typeof payload.message !== 'string') {
    throw new Error('Invalid IPC payload: expected level and message.');
  }

  const level = payload.level;

  if (typeof level !== 'string' || !LOG_LEVELS.has(level as RendererLogLevel)) {
    throw new Error('Invalid IPC payload: invalid log level.');
  }

  const message = payload.message.trim();

  if (!message) {
    throw new Error('Invalid IPC payload: message must not be empty.');
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('Invalid IPC payload: message too long.');
  }

  if (payload.context === undefined) {
    return { level: level as RendererLogLevel, message };
  }

  if (!isObject(payload.context)) {
    throw new Error('Invalid IPC payload: context must be a plain object.');
  }

  const entries = Object.entries(payload.context);

  if (entries.length > MAX_CONTEXT_KEYS) {
    throw new Error('Invalid IPC payload: context has too many keys.');
  }

  const context: Record<string, string | number | boolean | null> = {};

  for (const [rawKey, rawValue] of entries) {
    const key = typeof rawKey === 'string' ? rawKey.trim() : '';

    if (!key || key.length > MAX_CONTEXT_KEY_LENGTH) {
      throw new Error('Invalid IPC payload: invalid context key.');
    }

    if (!isContextValue(rawValue)) {
      throw new Error('Invalid IPC payload: invalid context value type.');
    }

    if (typeof rawValue === 'string' && rawValue.length > MAX_CONTEXT_STRING_VALUE_LENGTH) {
      throw new Error('Invalid IPC payload: context string value too long.');
    }

    context[key] = rawValue;
  }

  return {
    level: level as RendererLogLevel,
    message,
    context,
  };
};

export const registerLoggingIpcHandlers = (): void => {
  if (handlersRegistered) {
    return;
  }

  ipcMain.handle(ipcChannels.logging.write, (event, payload) => {
    assertTrustedSender(event);
    const safe = assertRendererLogPayload(payload);
    const label = '[renderer]';

    switch (safe.level) {
      case 'debug':
        mainLog.debug(label, safe.message, safe.context);
        break;
      case 'info':
        mainLog.info(label, safe.message, safe.context);
        break;
      case 'warn':
        mainLog.warn(label, safe.message, safe.context);
        break;
      case 'error':
        mainLog.error(label, safe.message, safe.context);
        break;
    }
  });

  handlersRegistered = true;
};
