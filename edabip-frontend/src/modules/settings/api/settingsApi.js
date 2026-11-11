/**
 * Settings API.
 *
 * Talks to the EDABIP Settings module (FastAPI). Every response below is
 * already camelCase and shaped the way the Settings components expect, so
 * nothing here reshapes data — it forwards what the server returns.
 *
 * Set VITE_ENABLE_MOCK_SETTINGS=true in dev to fall back to the in-browser
 * mock (settingsMockApi.js) when the Settings backend isn't running.
 */
import settingsClient from "../../../lib/settingsClient.js";
import { toDisplayError } from "../../../lib/apiError.js";
import { cacheGeneralSettings } from "./generalSettingsCache.js";
import * as mock from "./settingsMockApi.js";

export { getPersistedGeneralSettings } from "./generalSettingsCache.js";

export const isMockSettingsEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_SETTINGS === "true";

/**
 * The fields the server accepts on a general-settings update.
 *
 * GeneralSettingsForm spreads its whole state back on save, which now also
 * carries the `id` the server sent us. Sending it back is harmless but
 * meaningless, so only the real fields go out.
 */
const GENERAL_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "mobileNumber",
  "applicationName",
  "timezone",
  "companySize",
  "industry",
  "emailNotifications",
];

function pickGeneralFields(payload) {
  return Object.fromEntries(
    GENERAL_FIELDS.filter((field) => payload?.[field] !== undefined).map((field) => [
      field,
      payload[field],
    ])
  );
}

export async function getSettingsData(user) {
  if (isMockSettingsEnabled) {
    return mock.getSettingsData(user);
  }

  try {
    // One request for the whole page: profile, notification prefs, security,
    // integration statuses, every role with its permission matrix, and all
    // dropdown options.
    const { data } = await settingsClient.get("/settings/me");
    cacheGeneralSettings(data.general);
    return data;
  } catch (error) {
    throw toDisplayError(error, "Unable to load settings. Please try again.");
  }
}

export async function saveGeneralSettings(payload) {
  if (isMockSettingsEnabled) {
    return mock.saveGeneralSettings(payload);
  }

  try {
    const { data } = await settingsClient.put(
      "/settings/general/me",
      pickGeneralFields(payload)
    );
    cacheGeneralSettings(data);
    return data;
  } catch (error) {
    throw toDisplayError(error, "Could not save general settings. Try again.");
  }
}

export async function saveNotificationPreferences(payload) {
  if (isMockSettingsEnabled) {
    return mock.saveNotificationPreferences(payload);
  }

  try {
    const { data } = await settingsClient.put("/settings/notifications/me", {
      dashboardAlerts: payload.dashboardAlerts,
      reportUpdates: payload.reportUpdates,
      smsNotifications: Boolean(payload.smsNotifications),
    });
    return data;
  } catch (error) {
    throw toDisplayError(error, "Could not update preferences. Try again.");
  }
}

export async function saveSecuritySettings(payload) {
  if (isMockSettingsEnabled) {
    return mock.saveSecuritySettings(payload);
  }

  try {
    const { data } = await settingsClient.put("/settings/security/me", {
      twoFactorEnabled: Boolean(payload.twoFactorEnabled),
    });
    return data;
  } catch (error) {
    throw toDisplayError(error, "Could not save security settings. Try again.");
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  if (isMockSettingsEnabled) {
    return mock.changePassword({ currentPassword, newPassword });
  }

  try {
    // `currentPassword` is mandatory: the server verifies it against the live
    // login credential before writing anything, so a valid session on its own
    // is not enough to replace the password it was issued for.
    const { data } = await settingsClient.post("/settings/security/me/change-password", {
      currentPassword,
      newPassword,
    });
    return data;
  } catch (error) {
    // The server re-checks the same six rules the form does and returns the
    // failing one as plain text, so this message is safe to show verbatim.
    // A 400 means the current password was wrong — SecuritySettings.jsx reads
    // `.status` to put that message on the right field.
    throw toDisplayError(error, "Could not update password. Try again.");
  }
}

export async function setIntegrationConnected(id, connected) {
  if (isMockSettingsEnabled) {
    return mock.setIntegrationConnected(id, connected);
  }

  try {
    // `id` is the provider id straight off the list response — no translation.
    const { data } = await settingsClient.post(`/settings/integrations/me/${id}/toggle`, {
      connected: Boolean(connected),
    });
    return data;
  } catch (error) {
    throw toDisplayError(error, "Could not update the integration. Try again.");
  }
}

export async function saveRolePermissions(roleId, permissions) {
  if (isMockSettingsEnabled) {
    return mock.saveRolePermissions(roleId, permissions);
  }

  try {
    // Note the wrapper: the endpoint expects { permissions: {...} }, not the
    // matrix on its own.
    const { data } = await settingsClient.put(`/settings/permissions/${roleId}`, {
      permissions,
    });
    return data;
  } catch (error) {
    throw toDisplayError(error, "Could not save permissions. Try again.");
  }
}
