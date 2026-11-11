import { env } from '@/config/env';
import { networkError, timeoutError, toApiError } from '@/services/api/apiError';
import { ENDPOINTS } from '@/services/api/endpoints';
import { emitSessionExpired } from '@/services/api/sessionEvents';
import {
  clearSession,
  isAccessTokenStale,
  readAccessToken,
  readRefreshToken,
  readSession,
  writeSession,
} from '@/services/storage';
import type { HttpRequestOptions } from '@/types/api';
import type { BackendTokenResponse } from '@/types/auth';
import { logger } from '@/utils/logger';

logger.debug('api', 'API configuration', {
  baseUrl: env.apiBaseUrl,
  devApiHost: env.devApiHost,
  platform: env.platform,
});

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function buildUrl(path: string, query: HttpRequestOptions['query']): string {
  const url = `${env.apiBaseUrl}${path}`;
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }

  const serialized = search.toString();
  return serialized ? `${url}?${serialized}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function send(
  method: HttpMethod,
  path: string,
  body: unknown,
  options: HttpRequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.skipAuth) {
    const accessToken = await readAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? env.apiTimeoutMs;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const externalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', externalAbort);

  try {
    return await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (controller.signal.aborted) {
      logger.warn('api', `Request timed out after ${timeoutMs}ms`, buildUrl(path, options.query));
      throw timeoutError(env.isDevelopment ? env.apiBaseUrl : undefined);
    }
    logger.warn('api', 'Network request failed', buildUrl(path, options.query), error);
    throw networkError(error, env.isDevelopment ? env.apiBaseUrl : undefined);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', externalAbort);
  }
}

/**
 * Only one refresh may be in flight. The backend rotates and revokes the old
 * refresh token on every `/auth/refresh`, so concurrent refreshes would
 * invalidate each other and log the user out.
 */
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await send(
    'POST',
    ENDPOINTS.auth.refresh,
    { refresh_token: refreshToken },
    { skipAuth: true, skipRefresh: true },
  );

  const payload = await parseBody(response);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  const tokens = payload as BackendTokenResponse;
  await writeSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });

  return tokens.access_token;
}

function refreshAccessToken(): Promise<string> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * Renew a token that is about to expire before spending a round trip on a
 * request that would come back 401 anyway. Failures are swallowed: the normal
 * 401 handling below is the authoritative path.
 */
async function ensureFreshAccessToken(options: HttpRequestOptions): Promise<void> {
  if (options.skipAuth || options.skipRefresh) return;

  const session = await readSession();
  if (!session || !isAccessTokenStale(session)) return;

  try {
    await refreshAccessToken();
  } catch (error) {
    logger.debug('api', 'Proactive token refresh failed', error);
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: HttpRequestOptions = {},
): Promise<T> {
  logger.debug('api', `${method} ${path}`);

  await ensureFreshAccessToken(options);

  let response = await send(method, path, body, options);

  if (response.status === 401 && !options.skipRefresh && !options.skipAuth) {
    try {
      await refreshAccessToken();
      response = await send(method, path, body, { ...options, skipRefresh: true });
    } catch (error) {
      logger.warn('api', 'Token refresh failed; clearing session', error);
      await clearSession();
      emitSessionExpired();
      throw toApiError(401, await parseBody(response));
    }
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return payload as T;
}

async function requestBinary(
  path: string,
  options: HttpRequestOptions = {},
): Promise<{ bytes: ArrayBuffer; filename: string; contentType: string }> {
  logger.debug('api', `GET ${path} (binary)`);
  await ensureFreshAccessToken(options);

  let response = await send('GET', path, undefined, {
    ...options,
    headers: { Accept: 'application/pdf', ...options.headers },
  });

  if (response.status === 401 && !options.skipRefresh && !options.skipAuth) {
    try {
      await refreshAccessToken();
      response = await send('GET', path, undefined, {
        ...options,
        skipRefresh: true,
        headers: { Accept: 'application/pdf', ...options.headers },
      });
    } catch (error) {
      logger.warn('api', 'Token refresh failed; clearing session', error);
      await clearSession();
      emitSessionExpired();
      throw toApiError(401, await parseBody(response));
    }
  }

  if (!response.ok) {
    throw toApiError(response.status, await parseBody(response));
  }

  const disposition = response.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ? decodeURIComponent(match[1].trim()) : 'invoice.pdf';
  return {
    bytes: await response.arrayBuffer(),
    filename,
    contentType: response.headers.get('content-type') || 'application/pdf',
  };
}

export const apiClient = {
  get: <T>(path: string, options?: HttpRequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: HttpRequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: HttpRequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: HttpRequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: HttpRequestOptions) =>
    request<T>('DELETE', path, undefined, options),
  getBinary: (path: string, options?: HttpRequestOptions) => requestBinary(path, options),
};
