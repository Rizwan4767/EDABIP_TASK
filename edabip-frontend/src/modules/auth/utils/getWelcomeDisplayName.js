const DEFAULT_WELCOME_NAME = "Alin";

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function getWelcomeDisplayName(user, fallback = DEFAULT_WELCOME_NAME) {
  const named = normalizeName(user?.fullName || user?.name);
  if (named) {
    return named;
  }

  const emailLocalPart = normalizeName(String(user?.email || "").split("@")[0]);
  if (emailLocalPart) {
    return emailLocalPart;
  }

  return fallback;
}
