import type { RendererLogLevel, RendererLogPayload } from '../../shared/ipc';
import { getAppApi } from './electron-api';

const write = async (payload: RendererLogPayload): Promise<void> => {
  try {
    await getAppApi().logging.write(payload);
  } catch {
    // Logging must not break UI flows; failures are visible in main DevTools if needed.
  }
};

export const appLog = {
  debug: (message: string, context?: RendererLogPayload['context']): void => {
    void write({ level: 'debug', message, context });
  },

  error: (message: string, context?: RendererLogPayload['context']): void => {
    void write({ level: 'error', message, context });
  },

  info: (message: string, context?: RendererLogPayload['context']): void => {
    void write({ level: 'info', message, context });
  },

  warn: (message: string, context?: RendererLogPayload['context']): void => {
    void write({ level: 'warn', message, context });
  },

  write: (level: RendererLogLevel, message: string, context?: RendererLogPayload['context']): void => {
    void write({ level, message, context });
  },
};
