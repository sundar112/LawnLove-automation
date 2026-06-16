import ky, { type KyInstance, HTTPError, type Options } from 'ky';
import { env } from '../config/env';
import { TIMEOUTS } from '../config/timeouts';
import { childLogger } from '../utils/logger';

const log = childLogger('http-client');

export interface HttpClientOptions {
  bearerToken?: string;
  baseUrl?: string;
}

/**
 * Thin ky wrapper. Centralises:
 *   - base URL resolution (env.API_URL by default)
 *   - bearer token injection
 *   - retries on 5xx / 429 with exponential backoff
 *   - structured error normalisation
 */
export const createHttpClient = (opts: HttpClientOptions = {}): KyInstance =>
  ky.create({
    prefix: opts.baseUrl ?? env.API_URL,
    timeout: TIMEOUTS.apiCallMs,
    retry: {
      limit: 3,
      methods: ['get', 'put', 'head', 'delete', 'options', 'trace', 'post', 'patch'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
      backoffLimit: 5_000,
    },
    hooks: {
      beforeRequest: [
        ({ request }) => {
          if (opts.bearerToken) {
            request.headers.set('Authorization', `Bearer ${opts.bearerToken}`);
          }
          if (env.TRACE_NETWORK) {
            log.debug({ url: request.url, method: request.method }, 'request');
          }
        },
      ],
      beforeRetry: [
        ({ request, error, retryCount }) => {
          log.warn(
            {
              url: request.url,
              retryCount,
              err: error instanceof Error ? error.message : String(error),
            },
            'http retry',
          );
        },
      ],
      afterResponse: [
        ({ request, response }) => {
          if (env.TRACE_NETWORK) {
            log.debug({ url: request.url, status: response.status }, 'response');
          }
          return response;
        },
      ],
    },
  });

/**
 * Normalised error type returned by all api/* helpers.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

export const toApiError = async (err: unknown): Promise<ApiError> => {
  if (err instanceof HTTPError) {
    let body: unknown = null;
    try {
      const text = await err.response.clone().text();
      try {
        body = JSON.parse(text);
      } catch {
        body = text || null;
      }
    } catch {
      body = null;
    }
    log.error(
      { status: err.response.status, method: err.request.method, url: err.request.url, body },
      'API error response',
    );
    return new ApiError(
      `HTTP ${err.response.status} on ${err.request.method} ${err.request.url}`,
      err.response.status,
      err.request.url,
      body,
    );
  }
  if (err instanceof Error) {
    return new ApiError(err.message, 0, '', null);
  }
  return new ApiError(String(err), 0, '', null);
};

export type { Options as HttpRequestOptions };
