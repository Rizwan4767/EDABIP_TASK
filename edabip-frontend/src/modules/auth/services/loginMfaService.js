/**
 * Email/password login + mock login MFA adapter.
 *
 * Signup email verification is a separate concern and must not share
 * challenge state with this module.
 *
 * Live backend:
 *   POST /auth/login → tokens
 *
 * Mock auth still issues an in-memory email OTP challenge so the MFA
 * modal can be exercised without calling login-MFA endpoints.
 */

import {
  LOGIN_RESULT_STATUS,
  MFA_METHOD,
} from "../utils/authConfig.js";
import {
  AUTH_ERROR_CODES,
  getSafeAuthErrorMessage,
} from "../utils/authErrors.js";
import {
  findMockUserByEmail,
  normalizeMockUserEmail,
  validateMockCredentials,
} from "../utils/mockUserRepository.js";
import { isMockAuthEnabled } from "../utils/mockSession.js";
import apiClient from "../../../lib/apiClient.js";
import { extractErrorMessage } from "../api/authApi.js";
import { mapBackendUser } from "../utils/authSession.js";

/** @internal Development mock OTP — never render in the UI. */
export const MOCK_LOGIN_MFA_OTP = "1234";
export const MOCK_LOGIN_MFA_OTP_LENGTH = MOCK_LOGIN_MFA_OTP.length;
const MOCK_MAX_VERIFY_ATTEMPTS = 5;
const MOCK_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MOCK_RESEND_COOLDOWN_SECONDS = 120;

/** In-memory mock challenges keyed by challengeId (not persisted as auth). */
const mockChallenges = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDestinationLabel(email) {
  const normalized = normalizeMockUserEmail(email) || String(email || "").trim();
  if (!normalized?.includes("@")) {
    return "your email";
  }

  const [local, domain] = normalized.split("@");
  if (!domain) {
    return normalized;
  }

  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function createChallengeId() {
  return `login-mfa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getActiveChallenge(challengeId) {
  const challenge = mockChallenges.get(challengeId);

  if (!challenge) {
    return null;
  }

  if (challenge.expiresAt <= Date.now()) {
    mockChallenges.delete(challengeId);
    return null;
  }

  return challenge;
}

function toPublicChallenge(challenge) {
  const now = Date.now();
  return {
    status: LOGIN_RESULT_STATUS.MFA_REQUIRED,
    challengeId: challenge.challengeId,
    method: challenge.method,
    maskedDestination: challenge.maskedDestination,
    expiresInSeconds: Math.max(0, Math.ceil((challenge.expiresAt - now) / 1000)),
    resendAvailableInSeconds: Math.max(
      0,
      Math.ceil((challenge.resendAvailableAt - now) / 1000)
    ),
    expiresAt: challenge.expiresAt,
    resendAvailableAt: challenge.resendAvailableAt,
    userSnapshot: challenge.user
      ? {
          id: challenge.user.id,
          email: challenge.user.email,
          fullName: challenge.user.fullName || "",
          mobileNumber: challenge.user.mobileNumber || "",
          createdAt: challenge.user.createdAt || "",
        }
      : undefined,
  };
}

/**
 * Recreate an in-memory mock challenge after a page reload.
 * OTP is never read from storage; the mock OTP constant is reapplied.
 */
export function restoreMockLoginMfaChallenge(pending) {
  if (!pending?.challengeId || !pending?.userSnapshot) {
    return false;
  }

  if (mockChallenges.has(pending.challengeId)) {
    return true;
  }

  if (pending.expiresAt <= Date.now()) {
    return false;
  }

  mockChallenges.set(pending.challengeId, {
    challengeId: pending.challengeId,
    method: pending.method || MFA_METHOD.EMAIL_OTP,
    maskedDestination: pending.maskedDestination,
    email: pending.userSnapshot.email,
    user: pending.userSnapshot,
    otp: MOCK_LOGIN_MFA_OTP,
    expiresAt: pending.expiresAt,
    resendAvailableAt: pending.resendAvailableAt || Date.now(),
    attempts: 0,
    createdAt: Date.now(),
  });

  return true;
}

export async function loginWithEmail(credentials = {}) {
  const email = credentials.email;
  const password = credentials.password;

  if (!isMockAuthEnabled) {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });

      if (!data?.access_token || !data?.refresh_token || !data?.user) {
        return {
          status: LOGIN_RESULT_STATUS.REJECTED,
          success: false,
          message: data?.message || "Unable to sign in. Please try again.",
          error: {
            message: data?.message || "Unable to sign in. Please try again.",
          },
        };
      }

      return {
        status: LOGIN_RESULT_STATUS.AUTHENTICATED,
        success: true,
        user: mapBackendUser(data.user),
        tokens: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
        session: {
          provider: "credentials",
        },
      };
    } catch (error) {
      const status = error?.response?.status;
      const message = extractErrorMessage(error);

      if (status === 423) {
        return {
          status: LOGIN_RESULT_STATUS.REJECTED,
          success: false,
          locked: true,
          message,
          error: { message },
        };
      }

      if (status === 403) {
        return {
          status: LOGIN_RESULT_STATUS.REJECTED,
          success: false,
          verificationRequired: true,
          message,
          error: { message },
        };
      }

      return {
        status: LOGIN_RESULT_STATUS.REJECTED,
        success: false,
        message: message || "Invalid email or password",
        error: { message: message || "Invalid email or password." },
      };
    }
  }

  await delay(600);

  const authenticatedUser = validateMockCredentials(email, password);

  if (!authenticatedUser) {
    return {
      status: LOGIN_RESULT_STATUS.REJECTED,
      success: false,
      message: "Invalid email or password",
      error: { message: "Invalid email or password." },
    };
  }

  const repositoryUser = findMockUserByEmail(email);
  const requireEmailMfa =
    isMockAuthEnabled || Boolean(repositoryUser?.mfaEnabled);

  if (requireEmailMfa) {
    const challengeId = createChallengeId();
    const now = Date.now();
    const challenge = {
      challengeId,
      method: MFA_METHOD.EMAIL_OTP,
      maskedDestination: toDestinationLabel(authenticatedUser.email),
      email: authenticatedUser.email,
      user: authenticatedUser,
      otp: MOCK_LOGIN_MFA_OTP,
      expiresAt: now + MOCK_CHALLENGE_TTL_MS,
      resendAvailableAt: now + MOCK_RESEND_COOLDOWN_SECONDS * 1000,
      attempts: 0,
      createdAt: now,
    };

    mockChallenges.set(challengeId, challenge);
    return toPublicChallenge(challenge);
  }

  return {
    status: LOGIN_RESULT_STATUS.AUTHENTICATED,
    success: true,
    user: authenticatedUser,
    session: {
      provider: "mock-credentials",
    },
  };
}

export async function verifyLoginMfa({ challengeId, code } = {}) {
  const normalizedCode = String(code || "").replace(/\D/g, "");

  if (!isMockAuthEnabled) {
    return {
      status: LOGIN_RESULT_STATUS.REJECTED,
      success: false,
      code: AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING),
    };
  }

  await delay(500);

  const challenge = getActiveChallenge(challengeId);

  if (!challenge) {
    return {
      status: LOGIN_RESULT_STATUS.REJECTED,
      success: false,
      code: AUTH_ERROR_CODES.MFA_EXPIRED,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_EXPIRED),
    };
  }

  if (challenge.attempts >= MOCK_MAX_VERIFY_ATTEMPTS) {
    mockChallenges.delete(challengeId);
    return {
      status: LOGIN_RESULT_STATUS.REJECTED,
      success: false,
      code: AUTH_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS),
    };
  }

  challenge.attempts += 1;

  if (normalizedCode !== challenge.otp) {
    const remaining = MOCK_MAX_VERIFY_ATTEMPTS - challenge.attempts;

    if (remaining <= 0) {
      mockChallenges.delete(challengeId);
      return {
        status: LOGIN_RESULT_STATUS.REJECTED,
        success: false,
        code: AUTH_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS,
        message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS),
      };
    }

    return {
      status: LOGIN_RESULT_STATUS.REJECTED,
      success: false,
      code: AUTH_ERROR_CODES.MFA_INVALID_CODE,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_INVALID_CODE),
    };
  }

  const user = challenge.user;
  mockChallenges.delete(challengeId);

  return {
    status: LOGIN_RESULT_STATUS.AUTHENTICATED,
    success: true,
    user,
    session: {
      provider: "mock-credentials",
    },
  };
}

export async function resendLoginMfa({ challengeId } = {}) {
  if (!isMockAuthEnabled) {
    return {
      success: false,
      code: AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING),
    };
  }

  await delay(400);

  const challenge = getActiveChallenge(challengeId);

  if (!challenge) {
    return {
      success: false,
      code: AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING),
    };
  }

  const now = Date.now();

  if (challenge.resendAvailableAt > now) {
    return {
      success: false,
      code: AUTH_ERROR_CODES.MFA_RESEND_COOLDOWN,
      message: getSafeAuthErrorMessage(AUTH_ERROR_CODES.MFA_RESEND_COOLDOWN),
      resendAvailableInSeconds: Math.ceil(
        (challenge.resendAvailableAt - now) / 1000
      ),
    };
  }

  challenge.otp = MOCK_LOGIN_MFA_OTP;
  challenge.expiresAt = now + MOCK_CHALLENGE_TTL_MS;
  challenge.resendAvailableAt = now + MOCK_RESEND_COOLDOWN_SECONDS * 1000;
  challenge.attempts = 0;
  mockChallenges.set(challengeId, challenge);

  return {
    success: true,
    ...toPublicChallenge(challenge),
  };
}

export async function cancelLoginMfa({ challengeId } = {}) {
  if (challengeId) {
    mockChallenges.delete(challengeId);
  }

  return { success: true };
}
