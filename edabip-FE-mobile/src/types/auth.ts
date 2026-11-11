/**
 * Wire shapes are snake_case because the EDABIP FastAPI backend serialises that
 * way (`utils/auth.py: user_to_dict`, `routers/auth.py: TokenResponse`). They
 * are mapped to the camelCase domain types below at the API boundary so no
 * snake_case leaks into components.
 */
export interface BackendUser {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  role?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  avatar_url?: string | null;
}

export interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: BackendUser;
}

export type UserRole = 'admin' | 'user' | (string & {});

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  /** Epoch milliseconds at which the access token stops being accepted. */
  accessTokenExpiresAt: number;
}

export type AuthStatus =
  /** Reading persisted tokens and revalidating them. */
  'bootstrapping' | 'unauthenticated' | 'authenticated';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResult {
  message: string;
  userId: number | null;
  /** Only returned by the backend when SMTP is unconfigured (dev convenience). */
  devOtp: string | null;
}

/** `/auth/login` completes the session with tokens. */
export type LoginResult = { kind: 'authenticated'; user: User; tokens: AuthTokens };

/** A login outcome that is guaranteed to have produced a session. */
export type AuthenticatedLoginResult = LoginResult;

export interface OtpVerificationResult {
  message: string;
  isFullyVerified: boolean;
}

export interface MessageResult {
  message: string;
  devOtp?: string | null;
  isFullyVerified?: boolean;
}
