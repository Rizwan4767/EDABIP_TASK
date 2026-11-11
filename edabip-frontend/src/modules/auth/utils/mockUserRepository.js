export const MOCK_USERS_STORAGE_KEY = "edabip_mock_users";
export const DEFAULT_MOCK_USER_EMAIL = "test@gmail.com";

export const MFA_MOCK_USER_EMAIL = "mfa@edabip.test";

const DEFAULT_MOCK_USERS = [
  {
    id: "mock-user-001",
    fullName: "Test User",
    email: DEFAULT_MOCK_USER_EMAIL,
    mobileNumber: "+919876543210",
    password: "pass12345",
    mfaEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // Login MFA mock account (separate from signup email verification).
  // Password: Pass@123 — mock OTP is documented in loginMfaService.js
  {
    id: "mock-mfa-user-001",
    fullName: "MFA Demo User",
    email: MFA_MOCK_USER_EMAIL,
    mobileNumber: "+919876543211",
    password: "Pass@123",
    mfaEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

let inMemoryUsers = DEFAULT_MOCK_USERS.map((user) => ({ ...user }));

export function normalizeMockUserEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function canUseMockUserStorage() {
  return typeof window !== "undefined" && import.meta.env?.DEV === true;
}

function cloneUsers(users) {
  return users.map((user) => ({ ...user }));
}

function isValidMockUser(user) {
  return Boolean(
    user &&
      typeof user === "object" &&
      typeof user.id === "string" &&
      typeof user.fullName === "string" &&
      typeof user.email === "string" &&
      typeof user.mobileNumber === "string" &&
      typeof user.password === "string" &&
      typeof user.createdAt === "string" &&
      (typeof user.mfaEnabled === "undefined" ||
        typeof user.mfaEnabled === "boolean")
  );
}

function ensureDefaultMockUsers(users) {
  const byEmail = new Map(
    users.map((user) => [normalizeMockUserEmail(user.email), user])
  );

  let changed = false;

  DEFAULT_MOCK_USERS.forEach((seedUser) => {
    const key = normalizeMockUserEmail(seedUser.email);
    const existing = byEmail.get(key);

    if (!existing) {
      byEmail.set(key, { ...seedUser });
      changed = true;
      return;
    }

    if (
      typeof seedUser.mfaEnabled === "boolean" &&
      existing.mfaEnabled !== seedUser.mfaEnabled
    ) {
      byEmail.set(key, { ...existing, mfaEnabled: seedUser.mfaEnabled });
      changed = true;
    }
  });

  const merged = Array.from(byEmail.values());
  return { users: merged, changed };
}

function persistMockUsers(users) {
  inMemoryUsers = cloneUsers(users);

  if (!canUseMockUserStorage()) {
    return;
  }

  try {
    // Development-only, non-secure mock repository. Remove it when real auth APIs are integrated.
    window.localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // The in-memory repository still supports the current browser session.
  }
}

export function getMockUsers() {
  if (!canUseMockUserStorage()) {
    return cloneUsers(inMemoryUsers);
  }

  try {
    const storedUsers = JSON.parse(
      window.localStorage.getItem(MOCK_USERS_STORAGE_KEY) ?? "null"
    );

    if (
      Array.isArray(storedUsers) &&
      storedUsers.length > 0 &&
      storedUsers.every(isValidMockUser)
    ) {
      const { users: mergedUsers, changed } =
        ensureDefaultMockUsers(storedUsers);

      if (changed) {
        persistMockUsers(mergedUsers);
      } else {
        inMemoryUsers = cloneUsers(mergedUsers);
      }

      return cloneUsers(mergedUsers);
    }
  } catch {
    // Invalid mock data is replaced with the known development seed below.
  }

  const seededUsers = cloneUsers(DEFAULT_MOCK_USERS);
  persistMockUsers(seededUsers);
  return cloneUsers(seededUsers);
}

export function findMockUserByEmail(email) {
  const normalizedEmail = normalizeMockUserEmail(email);

  return getMockUsers().find(
    (user) => normalizeMockUserEmail(user.email) === normalizedEmail
  );
}

export function createMockUser(user) {
  const normalizedUser = {
    ...user,
    email: normalizeMockUserEmail(user.email),
  };
  const updatedUsers = [...getMockUsers(), normalizedUser];

  persistMockUsers(updatedUsers);
  return { ...normalizedUser };
}

export function validateMockCredentials(email, password) {
  const user = findMockUserByEmail(email);

  if (!user || user.password !== password) {
    return null;
  }

  const { id, fullName, mobileNumber, createdAt } = user;
  return {
    id,
    fullName,
    email: normalizeMockUserEmail(user.email),
    mobileNumber,
    createdAt,
  };
}

export function updateMockUserPassword(email, password) {
  const normalizedEmail = normalizeMockUserEmail(email);
  let wasUpdated = false;
  const updatedUsers = getMockUsers().map((user) => {
    if (normalizeMockUserEmail(user.email) !== normalizedEmail) {
      return user;
    }

    wasUpdated = true;
    return { ...user, password };
  });

  if (wasUpdated) {
    persistMockUsers(updatedUsers);
  }

  return wasUpdated;
}
