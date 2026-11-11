/** Machine-readable classification of a failed request. */
export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'account_locked'
  | 'rate_limited'
  | 'server'
  | 'unknown';

/** Field-level messages parsed from a FastAPI 422 `detail` array. */
export type FieldErrors = Record<string, string>;

export interface HttpRequestOptions {
  /** Skip attaching the bearer token — used by the public auth endpoints. */
  skipAuth?: boolean;
  /** Skip the 401 refresh-and-retry cycle. */
  skipRefresh?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
