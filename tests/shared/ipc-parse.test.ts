// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { IPC_ERROR_PREFIX, parseIpcError, serializeIpcError } from '../../src/shared/ipc';

describe('parseIpcError', () => {
  it('parses payload when the message is only the serialized error', () => {
    const payload = serializeIpcError({
      name: 'InvalidOperationError',
      message: 'Teste.',
      detail: 'Teste.',
      problem: {
        code: 'invalid_operation',
        detail: 'Teste.',
        status: 400,
        title: 'Bad Request',
      },
    });

    const parsed = parseIpcError(payload);
    expect(parsed?.problem.code).toBe('invalid_operation');
    expect(parsed?.detail).toBe('Teste.');
  });

  it('parses payload when Electron wraps the error message (invoke remote method prefix)', () => {
    const inner = serializeIpcError({
      name: 'Error',
      message: 'Não foi possível concluir a operação de backup.',
      detail: 'Não foi possível concluir a operação de backup.',
      problem: {
        code: 'internal_error',
        detail: 'Não foi possível concluir a operação de backup.',
        status: 500,
        title: 'Internal Server Error',
      },
    });

    const wrapped = `Error invoking remote method 'backup:export': Error: ${inner}`;
    const parsed = parseIpcError(wrapped);
    expect(parsed?.problem.code).toBe('internal_error');
  });

  it('returns undefined when the prefix is missing', () => {
    expect(parseIpcError('plain failure')).toBeUndefined();
  });

  it('exports a stable prefix constant for tests that build synthetic messages', () => {
    expect(IPC_ERROR_PREFIX).toBe('__APP_IPC_ERROR__:');
  });
});
