// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { browserWindowMock, BrowserWindow, appMock } = vi.hoisted(() => ({
  browserWindowMock: {
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    webContents: {
      setWindowOpenHandler: vi.fn(),
      on: vi.fn(),
      openDevTools: vi.fn(),
    },
  },
  BrowserWindow: vi.fn(),
  appMock: { isPackaged: false },
}));

BrowserWindow.mockImplementation(function BrowserWindowMock() {
  return browserWindowMock;
});

vi.mock('electron', () => ({
  app: appMock,
  BrowserWindow,
}));

import { createMainWindow } from '../../src/main/windows/main-window';

describe('createMainWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appMock.isPackaged = false;
    Object.assign(globalThis as Record<string, unknown>, {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: 'http://localhost:5173',
      MAIN_WINDOW_VITE_NAME: 'main_window',
    });
  });

  it('creates a hardened window and loads the dev server in development', () => {
    const windowInstance = createMainWindow();

    expect(BrowserWindow).toHaveBeenCalledWith({
      width: 1366,
      height: 900,
      minWidth: 1200,
      minHeight: 720,
      webPreferences: {
        preload: expect.stringContaining('preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        devTools: true,
      },
    });
    expect(windowInstance).toBe(browserWindowMock);
    expect(browserWindowMock.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    expect(browserWindowMock.loadFile).not.toHaveBeenCalled();
    expect(browserWindowMock.webContents.setWindowOpenHandler).toHaveBeenCalledTimes(1);
    expect(
      browserWindowMock.webContents.setWindowOpenHandler.mock.calls[0]?.[0]?.(),
    ).toEqual({ action: 'deny' });
    expect(browserWindowMock.webContents.openDevTools).toHaveBeenCalledWith({
      mode: 'detach',
    });
  });

  it('loads the packaged renderer file and keeps devtools disabled in production', () => {
    appMock.isPackaged = true;
    Object.assign(globalThis as Record<string, unknown>, {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: undefined,
      MAIN_WINDOW_VITE_NAME: 'main_window',
    });

    createMainWindow();

    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        webPreferences: expect.objectContaining({
          devTools: false,
        }),
      }),
    );
    expect(browserWindowMock.loadURL).not.toHaveBeenCalled();
    expect(browserWindowMock.loadFile).toHaveBeenCalledWith(
      expect.stringMatching(/[\\/]renderer[\\/]main_window[\\/]index\.html$/),
    );
    expect(browserWindowMock.webContents.openDevTools).not.toHaveBeenCalled();

    const willNavigateHandler = browserWindowMock.webContents.on.mock.calls.find(
      ([eventName]) => eventName === 'will-navigate',
    )?.[1];
    const event = { preventDefault: vi.fn() };

    willNavigateHandler?.(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});
