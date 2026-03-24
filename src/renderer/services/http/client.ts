import axios, { AxiosError, AxiosHeaders } from 'axios';

import { HTTP_REQUEST_TIMEOUT_IN_MS } from './api-config';

export interface HttpClientError {
  status?: number;
  message: string;
  data?: unknown;
}

export const normalizeHttpClientError = (error: unknown): HttpClientError => {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Unknown HTTP error',
  };
};

export const createHttpClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    timeout: HTTP_REQUEST_TIMEOUT_IN_MS,
  });

  client.interceptors.request.use((config) => {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('X-Requested-With', 'XMLHttpRequest');
    config.headers = headers;

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => Promise.reject(normalizeHttpClientError(error)),
  );

  return client;
};
