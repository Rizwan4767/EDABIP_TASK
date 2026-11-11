import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearMockSession,
  createMockSession,
  isMockAuthEnabled,
  MOCK_AUTH_UNAVAILABLE_MESSAGE,
  readMockSession,
  saveMockSession,
} from "../modules/auth/utils/mockSession.js";
import {
  createAuthSession,
  readAuthSession,
  saveAuthSession,
  clearAuthSession,
} from "../modules/auth/utils/authSession.js";
import {
  AUTH_STATUS,
  LOGIN_RESULT_STATUS,
} from "../modules/auth/utils/authConfig.js";
import {
  AUTH_ERROR_CODES,
  getSafeAuthErrorMessage,
} from "../modules/auth/utils/authErrors.js";
import {
  clearPendingMfaChallenge,
  readPendingMfaChallenge,
  savePendingMfaChallenge,
} from "../modules/auth/utils/pendingMfaChallenge.js";
import {
  signup as requestSignup,
  logout as requestLogout,
  fetchCurrentUser,
} from "../modules/auth/api/authApi.js";
import {
  DEFAULT_MOCK_USER_EMAIL,
  updateMockUserPassword,
} from "../modules/auth/utils/mockUserRepository.js";
import {
  cancelLoginMfa,
  loginWithEmail,
  resendLoginMfa,
  restoreMockLoginMfaChallenge,
  verifyLoginMfa,
} from "../modules/auth/services/loginMfaService.js";
import { GOOGLE_SIGN_IN_FAILED } from "../modules/auth/services/googleRedirectAuth.js";
import {
  readProfilePicture,
  saveProfilePicture,
} from "../modules/auth/utils/profilePictureStorage.js";

const AuthContext = createContext(null);

let mockAttemptsUsed = 0;
const MAX_ATTEMPTS = 5;

function establishMockSession(user, { rememberMe = false, provider }) {
  if (isMockAuthEnabled) {
    const session = createMockSession(user, { rememberMe, provider });
    saveMockSession(session);
  }
}

function establishRealSession(user, { rememberMe = false, provider, tokens }) {
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    return;
  }

  const session = createAuthSession({
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    rememberMe,
    provider,
  });
  saveAuthSession(session);
}

function applySessionSnapshot(snapshot, setters) {
  const { setUser, setPendingChallenge, setAuthStatus } = setters;
  if (snapshot.kind === 'authenticated') {
    setUser(snapshot.user);
    setPendingChallenge(null);
    setAuthStatus(AUTH_STATUS.AUTHENTICATED);
    return;
  }
  if (snapshot.kind === 'mfa') {
    setUser(null);
    setPendingChallenge(snapshot.pending);
    setAuthStatus(AUTH_STATUS.MFA_PENDING);
    return;
  }
  setUser(null);
  setPendingChallenge(null);
  setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
}

function resolveMockBootstrapSnapshot() {
  const session = readMockSession();
  if (session) {
    clearPendingMfaChallenge();
    return { kind: 'authenticated', user: session.user };
  }

  const pending = readPendingMfaChallenge();
  if (pending && restoreMockLoginMfaChallenge(pending)) {
    return { kind: 'mfa', pending };
  }
  if (pending) {
    clearPendingMfaChallenge();
  }
  return { kind: 'unauthenticated' };
}

export function AuthProvider({ children }) {
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.UNAUTHENTICATED);
  const [user, setUser] = useState(null);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  const isAuthenticated = authStatus === AUTH_STATUS.AUTHENTICATED;

  useEffect(() => {
    setProfilePictureUrl(user?.email ? readProfilePicture(user.email) : null);
  }, [user?.email]);

  const updateProfilePicture = useCallback(
    (dataUrl) => {
      if (!user?.email) return;
      saveProfilePicture(user.email, dataUrl);
      setProfilePictureUrl(dataUrl);
    },
    [user?.email]
  );
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };

      if (isMockAuthEnabled) {
        const session = readMockSession();
        if (session) {
          saveMockSession({ ...session, user: next });
        }
      } else {
        const session = readAuthSession();
        if (session) {
          saveAuthSession({ ...session, user: next });
        }
      }

      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const setters = { setUser, setPendingChallenge, setAuthStatus };

      if (isMockAuthEnabled) {
        applySessionSnapshot(resolveMockBootstrapSnapshot(), setters);
        setIsInitializing(false);
        return;
      }

      clearMockSession();

      const session = readAuthSession();

      if (session) {
        clearPendingMfaChallenge();

        try {
          const currentUser = await fetchCurrentUser();
          if (cancelled) {
            return;
          }

          applySessionSnapshot({ kind: 'authenticated', user: currentUser }, setters);
        } catch {
          if (cancelled) {
            return;
          }

          clearAuthSession();
          applySessionSnapshot({ kind: 'unauthenticated' }, setters);
        } finally {
          if (!cancelled) {
            setIsInitializing(false);
          }
        }
        return;
      }

      const pending = readPendingMfaChallenge();
      if (pending) {
        applySessionSnapshot({ kind: 'mfa', pending }, setters);
        setIsInitializing(false);
        return;
      }

      applySessionSnapshot({ kind: 'unauthenticated' }, setters);
      setIsInitializing(false);
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetSession = useCallback(() => {}, []);

  const isSessionExpired = useCallback(() => false, []);

  const updatePassword = useCallback((newPassword) => {
    if (isMockAuthEnabled) {
      updateMockUserPassword(DEFAULT_MOCK_USER_EMAIL, newPassword);
    }
  }, []);

  const clearPendingAuthentication = useCallback(async () => {
    const challengeId = pendingChallenge?.challengeId;

    if (challengeId) {
      try {
        await cancelLoginMfa({ challengeId });
      } catch {
        // Best-effort cancel; local state is still cleared below.
      }
    }

    clearPendingMfaChallenge();
    setPendingChallenge(null);

    if (authStatus === AUTH_STATUS.MFA_PENDING) {
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
    }
  }, [authStatus, pendingChallenge]);

  const completeAuthentication = useCallback(
    (authenticatedUser, { rememberMe = false, provider, tokens } = {}) => {
      clearPendingMfaChallenge();
      setPendingChallenge(null);
      setUser(authenticatedUser);
      setAuthStatus(AUTH_STATUS.AUTHENTICATED);

      if (isMockAuthEnabled) {
        establishMockSession(authenticatedUser, { rememberMe, provider });
        return;
      }

      establishRealSession(authenticatedUser, { rememberMe, provider, tokens });
    },
    []
  );

  const login = useCallback(
    async (credentials, rememberMe = false) => {
      if (isMockAuthEnabled && mockAttemptsUsed >= MAX_ATTEMPTS) {
        return {
          success: false,
          locked: true,
          message: "Account temporarily locked",
        };
      }

      await clearPendingAuthentication();

      try {
        const result = await loginWithEmail(credentials);

        if (result.status === LOGIN_RESULT_STATUS.MFA_REQUIRED) {
          mockAttemptsUsed = 0;

          const challenge = savePendingMfaChallenge({
            ...result,
            rememberMe,
          });

          setUser(null);
          setPendingChallenge(challenge);
          setAuthStatus(AUTH_STATUS.MFA_PENDING);

          return {
            success: false,
            mfaRequired: true,
            challenge,
          };
        }

        if (result.status === LOGIN_RESULT_STATUS.AUTHENTICATED && result.user) {
          mockAttemptsUsed = 0;
          completeAuthentication(result.user, {
            rememberMe,
            provider: result.session?.provider || "credentials",
            tokens: result.tokens,
          });

          return {
            success: true,
            data: { user: result.user },
          };
        }

        if (isMockAuthEnabled) {
          mockAttemptsUsed += 1;
        }

        return {
          success: false,
          locked: Boolean(result.locked) || (isMockAuthEnabled && mockAttemptsUsed >= MAX_ATTEMPTS),
          attemptsRemaining: isMockAuthEnabled
            ? Math.max(0, MAX_ATTEMPTS - mockAttemptsUsed)
            : null,
          verificationRequired: Boolean(result.verificationRequired),
          message: result.message || "Invalid email or password",
          error: result.error || { message: "Invalid email or password." },
        };
      } catch (error) {
        return {
          success: false,
          message: getSafeAuthErrorMessage(
            error?.code,
            "Unable to sign in. Please try again."
          ),
          error: {
            message: getSafeAuthErrorMessage(
              error?.code,
              "Unable to sign in. Please try again."
            ),
          },
        };
      }
    },
    [clearPendingAuthentication, completeAuthentication]
  );

  const verifyMfa = useCallback(
    async (code) => {
      if (!pendingChallenge?.challengeId) {
        return {
          success: false,
          code: AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING,
          message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING),
        };
      }

      try {
        const result = await verifyLoginMfa({
          challengeId: pendingChallenge.challengeId,
          code,
        });

        if (result.status === LOGIN_RESULT_STATUS.AUTHENTICATED && result.user) {
          completeAuthentication(result.user, {
            rememberMe: Boolean(pendingChallenge.rememberMe),
            provider: result.session?.provider || "credentials",
            tokens: result.tokens,
          });

          return {
            success: true,
            data: { user: result.user },
          };
        }

        if (
          result.code === AUTH_ERROR_CODES.MFA_EXPIRED ||
          result.code === AUTH_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS ||
          result.code === AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING
        ) {
          clearPendingMfaChallenge();
          setPendingChallenge(null);
          setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
        }

        return {
          success: false,
          code: result.code,
          message:
            result.message ||
            getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_INVALID_CODE),
        };
      } catch (error) {
        return {
          success: false,
          code: error?.code || AUTH_ERROR_CODES.UNKNOWN,
          message: getSafeAuthErrorMessage(
            error?.code,
            "Unable to verify the code. Please try again."
          ),
        };
      }
    },
    [completeAuthentication, pendingChallenge]
  );

  const resendMfa = useCallback(async () => {
    if (!pendingChallenge?.challengeId) {
      return {
        success: false,
        code: AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING,
        message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING),
      };
    }

    try {
      const result = await resendLoginMfa({
        challengeId: pendingChallenge.challengeId,
      });

      if (!result.success) {
        return result;
      }

      const updated = savePendingMfaChallenge({
        ...pendingChallenge,
        ...result,
        rememberMe: pendingChallenge.rememberMe,
      });

      setPendingChallenge(updated);

      return {
        success: true,
        resendAvailableInSeconds: result.resendAvailableInSeconds,
        challenge: updated,
      };
    } catch (error) {
      return {
        success: false,
        code: error?.code || AUTH_ERROR_CODES.UNKNOWN,
        message: getSafeAuthErrorMessage(
          error?.code,
          "Unable to resend the code. Please try again."
        ),
      };
    }
  }, [pendingChallenge]);

  /**
   * Completes the backend's Google redirect flow. The redirect hands back
   * tokens but no profile, so the user has to be hydrated from /auth/me before
   * a session can be written — `isValidAuthSession` rejects a session without
   * one, and a rejected session is cleared on the next read.
   *
   * Throws on failure so the caller can clear state and route to /login.
   */
  const completeOAuthLogin = useCallback(
    async ({ accessToken, refreshToken, provider = "google" }) => {
      if (!accessToken || !refreshToken) {
        throw new Error(GOOGLE_SIGN_IN_FAILED);
      }

      // The request interceptor prefers a stored token, so a leftover session
      // would shadow the token we were just handed.
      clearAuthSession();
      clearMockSession();

      let authenticatedUser;

      try {
        authenticatedUser = await fetchCurrentUser(accessToken);
      } catch {
        throw new Error(GOOGLE_SIGN_IN_FAILED);
      }

      if (!authenticatedUser?.email) {
        throw new Error(GOOGLE_SIGN_IN_FAILED);
      }

      clearPendingMfaChallenge();

      // Persist before flipping React state: if storage is unavailable this
      // throws, and an in-memory-only session would break on the next reload.
      // Always a real session — OAuth talks to the backend even in mock mode.
      establishRealSession(authenticatedUser, {
        rememberMe: true,
        provider,
        tokens: { accessToken, refreshToken },
      });

      setPendingChallenge(null);
      setUser(authenticatedUser);
      setAuthStatus(AUTH_STATUS.AUTHENTICATED);

      return authenticatedUser;
    },
    []
  );

  const loginWithGoogleMock = useCallback(
    (googleUser, rememberMe = true) => {
      if (!isMockAuthEnabled) {
        throw new Error(MOCK_AUTH_UNAVAILABLE_MESSAGE);
      }

      if (
        !googleUser ||
        typeof googleUser !== "object" ||
        typeof googleUser.id !== "string" ||
        typeof googleUser.email !== "string" ||
        googleUser.provider !== "google"
      ) {
        throw new Error("Google returned an incomplete user profile.");
      }

      clearPendingMfaChallenge();
      setPendingChallenge(null);
      completeAuthentication(googleUser, {
        rememberMe,
        provider: "google",
      });
    },
    [completeAuthentication]
  );

  const loginWithMicrosoftIdentity = useCallback(
    (microsoftUser, { rememberMe = true, isMock = false } = {}) => {
      if (isMock && !isMockAuthEnabled) {
        throw new Error(MOCK_AUTH_UNAVAILABLE_MESSAGE);
      }

      if (!isMock && !isMockAuthEnabled) {
        throw new Error(
          getSafeAuthErrorMessage(AUTH_ERROR_CODES.MICROSOFT_EXCHANGE_FAILED)
        );
      }

      if (
        !microsoftUser ||
        typeof microsoftUser !== "object" ||
        typeof microsoftUser.id !== "string" ||
        typeof microsoftUser.email !== "string" ||
        microsoftUser.provider !== "microsoft"
      ) {
        throw new Error("Microsoft returned an incomplete user profile.");
      }

      clearPendingMfaChallenge();
      setPendingChallenge(null);
      completeAuthentication(microsoftUser, {
        rememberMe,
        provider: "microsoft",
      });
    },
    [completeAuthentication]
  );

  const signup = useCallback(async (payload) => {
    return requestSignup(payload);
  }, []);

  const logout = useCallback(async () => {
    if (!isMockAuthEnabled) {
      try {
        const session = readAuthSession();
        if (session?.refreshToken) {
          await requestLogout(session.refreshToken);
        }
      } catch {
        // Local session is still cleared below.
      }
    }

    clearAuthSession();
    clearMockSession();
    clearPendingMfaChallenge();
    setUser(null);
    setPendingChallenge(null);
    setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
  }, []);

  const value = useMemo(
    () => ({
      authStatus,
      isAuthenticated,
      isInitializing,
      user,
      pendingChallenge,
      login,
      verifyMfa,
      resendMfa,
      clearPendingAuthentication,
      signup,
      completeOAuthLogin,
      loginWithGoogleMock,
      loginWithMicrosoftIdentity,
      logout,
      updatePassword,
      resetSession,
      isSessionExpired,
      profilePictureUrl,
      updateProfilePicture,
      updateUser,
    }),
    [
      authStatus,
      isAuthenticated,
      isInitializing,
      user,
      pendingChallenge,
      login,
      verifyMfa,
      resendMfa,
      clearPendingAuthentication,
      signup,
      completeOAuthLogin,
      loginWithGoogleMock,
      loginWithMicrosoftIdentity,
      logout,
      updatePassword,
      resetSession,
      isSessionExpired,
      profilePictureUrl,
      updateProfilePicture,
      updateUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
