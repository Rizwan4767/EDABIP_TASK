import { appConfig } from '@/config/appConfig';
import { SECURE_KEYS } from '@/constants/storageKeys';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/services/storage/secureStorage';
import type { AuthSession, AuthTokens } from '@/types/auth';

/**
 * Backend access tokens live for 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
 * Storing a local expiry lets the client refresh proactively instead of waiting
 * for a request to fail with 401.
 */
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Tokens are stored under separate keys rather than as one JSON blob: Android's
 * SecureStore warns above ~2KB per entry, and two JWTs plus metadata can
 * approach that.
 */
export async function readSession(): Promise<AuthSession | null> {
  const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
    getSecureItem(SECURE_KEYS.accessToken),
    getSecureItem(SECURE_KEYS.refreshToken),
    getSecureItem(SECURE_KEYS.accessTokenExpiresAt),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  const parsedExpiry = Number.parseInt(expiresAtRaw ?? '', 10);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: Number.isFinite(parsedExpiry) ? parsedExpiry : 0,
  };
}

export async function writeSession(tokens: AuthTokens): Promise<AuthSession> {
  const session: AuthSession = {
    ...tokens,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };

  await Promise.all([
    setSecureItem(SECURE_KEYS.accessToken, session.accessToken),
    setSecureItem(SECURE_KEYS.refreshToken, session.refreshToken),
    setSecureItem(SECURE_KEYS.accessTokenExpiresAt, String(session.accessTokenExpiresAt)),
  ]);

  return session;
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteSecureItem(SECURE_KEYS.accessToken),
    deleteSecureItem(SECURE_KEYS.refreshToken),
    deleteSecureItem(SECURE_KEYS.accessTokenExpiresAt),
  ]);
}

export async function readAccessToken(): Promise<string | null> {
  return getSecureItem(SECURE_KEYS.accessToken);
}

export async function readRefreshToken(): Promise<string | null> {
  return getSecureItem(SECURE_KEYS.refreshToken);
}

/** True when the access token is expired or close enough that it should be renewed now. */
export function isAccessTokenStale(session: AuthSession): boolean {
  const leadMs = appConfig.auth.accessTokenRefreshLeadSeconds * 1000;
  return session.accessTokenExpiresAt - leadMs <= Date.now();
}
