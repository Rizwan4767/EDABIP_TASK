import { getPersistedGeneralSettings } from "../../settings/api/settingsApi.js";

function splitName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function hasValue(value) {
  return String(value || "").trim() !== "";
}

export function isProfileComplete(user) {
  if (!user) {
    return true;
  }

  const names = splitName(user.fullName || user.name);
  const persisted = getPersistedGeneralSettings(user) || {};

  return (
    hasValue(persisted.firstName || names.firstName) &&
    hasValue(persisted.lastName || names.lastName) &&
    hasValue(persisted.email || user.email) &&
    hasValue(persisted.mobileNumber || user.mobileNumber) &&
    hasValue(persisted.companySize) &&
    hasValue(persisted.industry)
  );
}
