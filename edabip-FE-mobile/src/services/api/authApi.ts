import { apiClient } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';
import { clearSession, writeSession } from '@/services/storage';
import type {
  AuthTokens,
  BackendTokenResponse,
  BackendUser,
  LoginCredentials,
  LoginResult,
  MessageResult,
  OtpVerificationResult,
  SignupPayload,
  SignupResult,
  User,
} from '@/types/auth';
import { logger } from '@/utils/logger';
import { normalizeEmail } from '@/utils/validation';

/** Public endpoints must not send a stale bearer token. */
const PUBLIC = { skipAuth: true, skipRefresh: true } as const;

export function mapUser(user: BackendUser): User {
  const reportedFirst = user.first_name?.trim() ?? '';
  const reportedLast = user.last_name?.trim() ?? '';
  const fullName = (user.full_name ?? '').trim() || `${reportedFirst} ${reportedLast}`.trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = reportedFirst || parts[0] || '';
  const lastName = reportedLast || (parts.length > 1 ? parts.slice(1).join(' ') : '');

  return {
    id: String(user.id),
    firstName,
    lastName,
    fullName: fullName || `${firstName} ${lastName}`.trim(),
    email: user.email,
    phone: user.phone ?? '',
    role: user.role ?? 'user',
    isActive: user.is_active ?? true,
    isVerified: Boolean(user.is_verified),
    emailVerified: Boolean(user.email_verified),
    phoneVerified: Boolean(user.phone_verified),
    avatarUrl: user.avatar_url ?? '',
  };
}

function toTokens(response: BackendTokenResponse): AuthTokens {
  return { accessToken: response.access_token, refreshToken: response.refresh_token };
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const response = await apiClient.post<BackendTokenResponse>(
    ENDPOINTS.auth.login,
    { email: normalizeEmail(credentials.email), password: credentials.password },
    PUBLIC,
  );

  if (!response.access_token || !response.refresh_token || !response.user) {
    throw new Error('Login response did not include a session.');
  }

  const tokens = toTokens(response);
  await writeSession(tokens);

  return { kind: 'authenticated', user: mapUser(response.user), tokens };
}

export async function register(payload: SignupPayload): Promise<SignupResult> {
  const response = await apiClient.post<{
    message?: string;
    user_id?: number;
    dev_email_otp?: string;
  }>(
    ENDPOINTS.auth.register,
    {
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      email: normalizeEmail(payload.email),
      password: payload.password,
    },
    PUBLIC,
  );

  return {
    message: response.message ?? 'Registration successful. Please verify your email.',
    userId: response.user_id ?? null,
    devOtp: response.dev_email_otp ?? null,
  };
}

export async function verifyEmailOtp(email: string, otp: string): Promise<OtpVerificationResult> {
  const response = await apiClient.post<{ message?: string; is_fully_verified?: boolean }>(
    ENDPOINTS.auth.verifyOtp,
    { email: normalizeEmail(email), otp },
    PUBLIC,
  );

  return {
    message: response.message ?? 'Email verified.',
    isFullyVerified: Boolean(response.is_fully_verified),
  };
}

export async function resendEmailOtp(email: string): Promise<MessageResult> {
  const response = await apiClient.post<{
    message?: string;
    dev_email_otp?: string;
    is_fully_verified?: boolean;
  }>(ENDPOINTS.auth.resendOtp, { email: normalizeEmail(email) }, PUBLIC);

  return {
    message: response.message ?? 'A new verification code has been sent.',
    devOtp: response.dev_email_otp ?? null,
    isFullyVerified: Boolean(response.is_fully_verified),
  };
}

export async function requestPasswordReset(email: string): Promise<MessageResult> {
  const response = await apiClient.post<{ message?: string }>(
    ENDPOINTS.auth.forgotPassword,
    { email: normalizeEmail(email) },
    PUBLIC,
  );

  return { message: response.message ?? 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(token: string, newPassword: string): Promise<MessageResult> {
  const response = await apiClient.post<{ message?: string }>(
    ENDPOINTS.auth.resetPassword,
    { token, new_password: newPassword },
    PUBLIC,
  );

  return { message: response.message ?? 'Password reset successfully.' };
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get<BackendUser>(ENDPOINTS.auth.me);
  return mapUser(response);
}

/**
 * Revokes the refresh token server-side, then clears local credentials.
 * Local state is cleared even if the network call fails — a user who taps
 * "sign out" must end up signed out on the device regardless.
 */
export async function logout(refreshToken: string | null): Promise<void> {
  try {
    if (refreshToken) {
      await apiClient.post(ENDPOINTS.auth.logout, { refresh_token: refreshToken }, PUBLIC);
    }
  } catch (error) {
    logger.warn('authApi', 'Server logout failed; clearing local session anyway', error);
  } finally {
    await clearSession();
  }
}
