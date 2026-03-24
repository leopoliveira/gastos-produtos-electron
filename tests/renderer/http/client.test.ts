import { describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

import {
  createHttpClient,
  normalizeHttpClientError,
} from '../../../src/renderer/services/http/client';

describe('normalizeHttpClientError', () => {
  it('normalizes generic errors', () => {
    expect(normalizeHttpClientError(new Error('boom'))).toEqual({
      message: 'boom',
    });
  });

  it('falls back to a generic message for unknown values', () => {
    expect(normalizeHttpClientError('boom')).toEqual({
      message: 'Unknown HTTP error',
    });
  });
});

describe('createHttpClient', () => {
  it('configures timeout, base url and request header interceptor', async () => {
    const client = createHttpClient('https://api.example.com/Product');
    let capturedConfig: InternalAxiosRequestConfig | undefined;

    client.defaults.adapter = async (config) => {
      capturedConfig = config;

      return {
        config,
        data: null,
        headers: {},
        status: 200,
        statusText: 'OK',
      };
    };

    expect(client.defaults.baseURL).toBe('https://api.example.com/Product');
    expect(client.defaults.timeout).toBe(15_000);

    await client.get('/');

    expect(capturedConfig?.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });
});
