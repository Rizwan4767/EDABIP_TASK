import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import * as authApi from '@/services/api/authApi';
import { onSessionExpired } from '@/services/api/sessionEvents';
import { clearSession, readRefreshToken, readSession, setPreference } from '@/services/storage';
import type {
  AuthStatus,
  LoginCredentials,
  LoginResult,
  MessageResult,
  OtpVerificationResult,
  SignupPayload,
  SignupResult,
} from '@/types/auth';
import { logger } from '@/utils/logger';

interface AuthContextValue {
  status: AuthStatus;
  isAuthenticated: boolean;
  /** Email awaiting email-verification after signup, used to prefill the OTP screen. */
  pendingVerificationEmail: string | null;

  signIn: (credentials: LoginCredentials) => Promise<LoginResult>;

  signUp: (payload: SignupPayload) => Promise<SignupResult>;
  verifyEmailOtp: (email: string, otp: string) => Promise<OtpVerificationResult>;
  resendEmailOtp: (email: string) => Promise<MessageResult>;

  requestPasswordReset: (email: string) => Promise<MessageResult>;
  resetPassword: (token: string, newPassword: string) => Promise<MessageResult>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the session lifecycle only — tokens live in secure storage and the
 * user profile lives in `UserProvider`. Actions throw `ApiError` so screens can
 * render field-level and status-specific messages; this provider does not hold
 * form error state.
 */
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Restore a persisted session. Token validity is not checked here: the first
  // authenticated request refreshes or fails, and a failed refresh emits
  // `sessionExpired`, which is handled below.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const session = await readSession();
      if (cancelled) return;
      setStatus(session ? 'authenticated' : 'unauthenticated');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        logger.warn('auth', 'Session expired; signing out');
        setStatus('unauthenticated');
      }),
    [],
  );

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const result = await authApi.login(credentials);

    setPendingVerificationEmail(null);
    void setPreference(PREFERENCE_KEYS.lastSignedInEmail, result.user.email);
    setStatus('authenticated');
    return result;
  }, []);

  const signUp = useCallback(async (payload: SignupPayload) => {
    const result = await authApi.register(payload);
    setPendingVerificationEmail(payload.email.trim().toLowerCase());
    return result;
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    const result = await authApi.verifyEmailOtp(email, otp);
    if (result.isFullyVerified) {
      setPendingVerificationEmail(null);
    }
    return result;
  }, []);

  const resendEmailOtp = useCallback((email: string) => authApi.resendEmailOtp(email), []);

  const requestPasswordReset = useCallback(
    (email: string) => authApi.requestPasswordReset(email),
    [],
  );

  const resetPassword = useCallback(
    (token: string, newPassword: string) => authApi.resetPassword(token, newPassword),
    [],
  );

  const signOut = useCallback(async () => {
    const refreshToken = await readRefreshToken();
    // Flip the UI immediately; revoking the token server-side is best effort.
    setStatus('unauthenticated');

    try {
      await authApi.logout(refreshToken);
    } finally {
      await clearSession();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      pendingVerificationEmail,
      signIn,
      signUp,
      verifyEmailOtp,
      resendEmailOtp,
      requestPasswordReset,
      resetPassword,
      signOut,
    }),
    [
      status,
      pendingVerificationEmail,
      signIn,
      signUp,
      verifyEmailOtp,
      resendEmailOtp,
      requestPasswordReset,
      resetPassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
