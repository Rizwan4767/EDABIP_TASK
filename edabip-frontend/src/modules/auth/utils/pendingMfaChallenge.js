/**
 * Minimal pending MFA challenge persistence (sessionStorage only).
 * Never store passwords, OTP values, or Microsoft tokens here.
 */

export const PENDING_MFA_STORAGE_KEY = "edabip_pending_mfa";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function isValidPendingMfaChallenge(challenge) {
  return Boolean(
    challenge &&
      typeof challenge === "object" &&
      typeof challenge.challengeId === "string" &&
      challenge.challengeId.trim() !== "" &&
      typeof challenge.method === "string" &&
      typeof challenge.maskedDestination === "string" &&
      Number.isFinite(challenge.expiresAt) &&
      challenge.expiresAt > Date.now()
  );
}

export function toPersistedChallenge(challenge) {
  if (!challenge || typeof challenge !== "object") {
    return null;
  }

  const expiresAt =
    Number.isFinite(challenge.expiresAt)
      ? challenge.expiresAt
      : Date.now() +
        (Number(challenge.expiresInSeconds) || 300) * 1000;

  const snapshot = challenge.userSnapshot;
  const userSnapshot =
    snapshot &&
    typeof snapshot === "object" &&
    typeof snapshot.id === "string" &&
    typeof snapshot.email === "string"
      ? {
          id: snapshot.id,
          email: snapshot.email,
          fullName:
            typeof snapshot.fullName === "string" ? snapshot.fullName : "",
          mobileNumber:
            typeof snapshot.mobileNumber === "string"
              ? snapshot.mobileNumber
              : "",
          createdAt:
            typeof snapshot.createdAt === "string" ? snapshot.createdAt : "",
        }
      : undefined;

  const persisted = {
    challengeId: String(challenge.challengeId || "").trim(),
    method: String(challenge.method || "EMAIL_OTP"),
    maskedDestination: String(challenge.maskedDestination || ""),
    expiresAt,
    resendAvailableAt:
      Number.isFinite(challenge.resendAvailableAt)
        ? challenge.resendAvailableAt
        : Date.now() +
          (Number(challenge.resendAvailableInSeconds) || 120) * 1000,
    rememberMe: Boolean(challenge.rememberMe),
    ...(userSnapshot ? { userSnapshot } : {}),
  };

  return isValidPendingMfaChallenge(persisted) ? persisted : null;
}

export function readPendingMfaChallenge() {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PENDING_MFA_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const challenge = JSON.parse(raw);

    if (!isValidPendingMfaChallenge(challenge)) {
      clearPendingMfaChallenge();
      return null;
    }

    return challenge;
  } catch {
    clearPendingMfaChallenge();
    return null;
  }
}

export function savePendingMfaChallenge(challenge) {
  if (!canUseSessionStorage()) {
    return null;
  }

  const persisted = toPersistedChallenge(challenge);
  if (!persisted) {
    clearPendingMfaChallenge();
    return null;
  }

  window.sessionStorage.setItem(
    PENDING_MFA_STORAGE_KEY,
    JSON.stringify(persisted)
  );
  return persisted;
}

export function clearPendingMfaChallenge() {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(PENDING_MFA_STORAGE_KEY);
  } catch {
    // Ignore storage failures; in-memory auth state is still cleared by callers.
  }
}
