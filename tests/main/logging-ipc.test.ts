// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ipcMainHandleMock, mainLogMocks } = vi.hoisted(() => ({
  ipcMainHandleMock: vi.fn(),
  mainLogMocks: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: ipcMainHandleMock,
  },
}));

vi.mock('../../src/main/logging/app-logger', () => ({
  configureMainProcessLogging: vi.fn(),
  mainLog: mainLogMocks,
}));

describe('registerLoggingIpcHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.assign(globalThis as Record<string, unknown>, {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: 'http://localhost:5173',
    });
  });

  it('registers once and forwards trusted renderer logs to mainLog', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerLoggingIpcHandlers } = await import('../../src/main/ipc/logging-ipc');
    const getRegisteredHandler = (channel: string) =>
      ipcMainHandleMock.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];

    registerLoggingIpcHandlers();
    registerLoggingIpcHandlers();

    expect(ipcMainHandleMock).toHaveBeenCalledTimes(1);

    const handler = getRegisteredHandler(ipcChannels.logging.write);
    const trustedEvent = {
      senderFrame: {
        url: 'http://localhost:5173/products',
      },
    };

    await handler?.(trustedEvent, {
      level: 'warn',
      message: '  UI warning  ',
      context: { screen: 'products' },
    });

    expect(mainLogMocks.warn).toHaveBeenCalledWith('[renderer]', 'UI warning', { screen: 'products' });
  });

  it('rejects untrusted senders and invalid payloads', async () => {
    const { ipcChannels } = await import('../../src/shared/ipc');
    const { registerLoggingIpcHandlers } = await import('../../src/main/ipc/logging-ipc');
    const getRegisteredHandler = (channel: string) =>
      ipcMainHandleMock.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];

    registerLoggingIpcHandlers();

    const handler = getRegisteredHandler(ipcChannels.logging.write);

    expect(() =>
      handler?.(
        {
          senderFrame: {
            url: 'https://evil.example/app',
          },
        },
        { level: 'info', message: 'x' },
      ),
    ).toThrow('Unauthorized IPC sender.');

    expect(() =>
      handler?.(
        {
          senderFrame: {
            url: 'http://localhost:5173/app',
          },
        },
        { level: 'info', message: '' },
      ),
    ).toThrow('Invalid IPC payload: message must not be empty.');

    expect(() =>
      handler?.(
        {
          senderFrame: {
            url: 'http://localhost:5173/app',
          },
        },
        { level: 'trace', message: 'x' },
      ),
    ).toThrow('Invalid IPC payload: invalid log level.');
  });
});
