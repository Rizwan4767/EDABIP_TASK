import type { ApiErrorCode, FieldErrors } from '@/types/api';

interface ApiErrorInit {
  message: string;
  status: number;
  code: ApiErrorCode;
  fieldErrors?: FieldErrors;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fieldErrors: FieldErrors;

  constructor({ message, status, code, fieldErrors, cause }: ApiErrorInit) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors ?? {};
  }

  get isRetryable(): boolean {
    return this.code === 'network' || this.code === 'timeout' || this.status >= 500;
  }
}

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  422: 'validation',
  423: 'account_locked',
  429: 'rate_limited',
};

function codeForStatus(status: number): ApiErrorCode {
  return STATUS_CODES[status] ?? (status >= 500 ? 'server' : 'unknown');
}

/** FastAPI 422 payload: `{ detail: [{ loc: ["body", "email"], msg, type }] }`. */
interface ValidationDetail {
  loc?: unknown[];
  msg?: string;
}

function isValidationDetail(value: unknown): value is ValidationDetail {
  return typeof value === 'object' && value !== null && 'msg' in value;
}

function parseValidationDetail(detail: unknown[]): {
  message: string;
  fieldErrors: FieldErrors;
} {
  const fieldErrors: FieldErrors = {};
  const messages: string[] = [];

  for (const entry of detail) {
    if (!isValidationDetail(entry)) continue;
    const message = entry.msg ?? 'Invalid value';
    messages.push(message);

    const field = Array.isArray(entry.loc) ? entry.loc.at(-1) : undefined;
    if (typeof field === 'string' && field !== 'body') {
      fieldErrors[field] = message;
    }
  }

  return {
    message: messages[0] ?? 'Please check the highlighted fields and try again.',
    fieldErrors,
  };
}

const GENERIC_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again shortly.',
};

/**
 * Turns a FastAPI error response into an `ApiError`.
 * The backend responds with `{ "detail": string }` for handled errors and
 * `{ "detail": [...] }` for Pydantic validation failures.
 */
export function toApiError(status: number, body: unknown): ApiError {
  const code = codeForStatus(status);
  const detail =
    typeof body === 'object' && body !== null && 'detail' in body
      ? (body as { detail: unknown }).detail
      : undefined;

  if (Array.isArray(detail)) {
    const { message, fieldErrors } = parseValidationDetail(detail);
    return new ApiError({ message, status, code, fieldErrors });
  }

  if (typeof detail === 'string' && detail.trim() !== '') {
    return new ApiError({ message: detail, status, code });
  }

  return new ApiError({
    message: GENERIC_MESSAGES[status] ?? `Request failed with status ${status}.`,
    status,
    code,
  });
}

function withDevApiHint(message: string, apiBaseUrl?: string): string {
  if (!apiBaseUrl) return message;
  return `${message} (API: ${apiBaseUrl})`;
}

export function networkError(cause?: unknown, apiBaseUrl?: string): ApiError {
  return new ApiError({
    message: withDevApiHint(
      'Unable to reach EDABIP. Check your connection and try again.',
      apiBaseUrl,
    ),
    status: 0,
    code: 'network',
    cause,
  });
}

export function timeoutError(apiBaseUrl?: string): ApiError {
  return new ApiError({
    message: withDevApiHint('The request took too long to complete. Please try again.', apiBaseUrl),
    status: 0,
    code: 'timeout',
  });
}

/** Safe message extraction for any thrown value, for use in UI error states. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
