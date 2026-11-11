/**
 * In-browser mock of the Settings API.
 *
 * Used only when VITE_ENABLE_MOCK_SETTINGS=true in dev — see settingsApi.js.
 * Kept so the Settings page still demos when the Settings backend isn't
 * running. Nothing here talks to the network; the store resets on reload.
 */
import { buildDefaultPermissions, PERMISSION_MODULES } from "../data/permissionMatrix.js";
import { cacheGeneralSettings, getPersistedGeneralSettings } from "./generalSettingsCache.js";

const DELAY_MS = 650;

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC(Coordinated Universal Time)" },
  { value: "America/New_York", label: "EST (Eastern Standard Time)" },
  { value: "America/Chicago", label: "CST (Central Standard Time)" },
  { value: "America/Denver", label: "MST (Mountain Standard Time)" },
  { value: "America/Los_Angeles", label: "PST (Pacific Standard Time)" },
  { value: "Europe/London", label: "GMT (Greenwich Mean Time)" },
  { value: "Asia/Kolkata", label: "IST (India Standard Time)" },
  { value: "Asia/Dubai", label: "GST (Gulf Standard Time)" },
  { value: "Asia/Singapore", label: "SGT (Singapore Time)" },
  { value: "Australia/Sydney", label: "AEST (Australian Eastern Time)" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "1-50", label: "1-50 Employees" },
  { value: "51-200", label: "51-200 Employees" },
  { value: "201-500", label: "201-500 Employees" },
  { value: "501-1000", label: "501-1000 Employees" },
  { value: "1000+", label: "1000+ Employees" },
];

const INDUSTRY_OPTIONS = [
  { value: "healthcare", label: "Healthcare" },
  { value: "retail", label: "Retail" },
  { value: "finance", label: "Finance" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
];

const DASHBOARD_ALERT_OPTIONS = [
  { value: "all", label: "All Alerts" },
  { value: "critical", label: "Critical Only" },
  { value: "warnings", label: "Warnings & Critical" },
  { value: "none", label: "None" },
];

const REPORT_UPDATE_OPTIONS = [
  { value: "realtime", label: "Real Time" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const MODULES = PERMISSION_MODULES.map((module) => ({
  id: module.id,
  label: module.label,
}));

const ROLE_TEMPLATES = [
  {
    name: "Admin",
    description: "Full access to all modules and settings",
    userCount: 5,
  },
  {
    name: "Executive",
    description: "Leadership access to dashboards, reports, and operational insights",
    userCount: 8,
  },
  {
    name: "Business Analyst",
    description: "Can view and analyze reports and dashboards",
    userCount: 18,
  },
  {
    name: "Data Engineer",
    description: "Build and manage data pipelines, sources, and models",
    userCount: 12,
  },
  {
    name: "Client User",
    description: "External partner access to shared dashboards and reports",
    userCount: 24,
  },
];

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildRoles() {
  return Array.from({ length: 20 }, (_, index) => {
    const template = ROLE_TEMPLATES[index % ROLE_TEMPLATES.length];
    return {
      id: `ROL${String(index + 1).padStart(3, "0")}`,
      name: template.name,
      description: template.description,
      userCount: Math.max(1, template.userCount - (index % 4)),
      permissions: buildDefaultPermissions(template.name),
    };
  });
}

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

function createStore() {
  return {
    general: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      applicationName: "EDABIP",
      timezone: "UTC",
      companySize: "",
      industry: "",
      emailNotifications: true,
    },
    notifications: {
      dashboardAlerts: "all",
      reportUpdates: "daily",
      smsNotifications: true,
    },
    security: {
      twoFactorEnabled: true,
    },
    integrations: [
      { id: "salesforce", name: "Salesforce CRM", connected: true },
      { id: "google-analytics", name: "Google Analytics", connected: false },
      { id: "slack", name: "Slack", connected: true },
      { id: "microsoft-teams", name: "Microsoft Teams", connected: true },
    ],
    roles: buildRoles(),
    options: {
      timezones: TIMEZONE_OPTIONS,
      companySizes: COMPANY_SIZE_OPTIONS,
      industries: INDUSTRY_OPTIONS,
      dashboardAlerts: DASHBOARD_ALERT_OPTIONS,
      reportUpdates: REPORT_UPDATE_OPTIONS,
      modules: MODULES,
    },
  };
}

let store = createStore();

export function resetSettingsStore() {
  store = createStore();
}

export async function getSettingsData(user) {
  await delay();
  const data = clone(store);
  const defaults = createStore().general;

  if (user) {
    const names = splitName(user.fullName || user.name);
    const persisted = getPersistedGeneralSettings(user);
    data.general = {
      ...defaults,
      firstName: names.firstName,
      lastName: names.lastName,
      email: user.email || "",
      mobileNumber: user.mobileNumber || "",
      companySize: user.companySize || "",
      industry: user.industry || "",
      ...persisted,
    };
    store.general = clone(data.general);
  }

  return data;
}

export async function saveGeneralSettings(payload) {
  await delay(500);
  store.general = {
    ...store.general,
    ...payload,
  };
  cacheGeneralSettings(store.general);
  return clone(store.general);
}

export async function saveNotificationPreferences(payload) {
  await delay(500);
  store.notifications = {
    ...store.notifications,
    ...payload,
  };
  return clone(store.notifications);
}

export async function saveSecuritySettings(payload) {
  await delay(500);
  store.security = {
    ...store.security,
    twoFactorEnabled: Boolean(payload.twoFactorEnabled),
  };
  return clone(store.security);
}

// Whatever the mock treats as the signed-in user's existing password. The
// real check happens server-side against the auth backend's store; this only
// exists so the form's current-password field behaves the same way in mock
// mode as it does against the live API.
const MOCK_CURRENT_PASSWORD = "Password1!";

// Every rejection carries the status the live API uses for the same failure,
// because SecuritySettings.jsx decides which field to flag from `.status`:
// 400 = the current password, 422 = the new one.
function passwordError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function changePassword({ currentPassword, newPassword }) {
  await delay(500);
  if (!currentPassword) {
    throw passwordError("Enter your current password.", 400);
  }
  if (currentPassword !== MOCK_CURRENT_PASSWORD) {
    throw passwordError("Current password is incorrect.", 400);
  }
  if (!newPassword) {
    throw passwordError("Password is required.", 422);
  }
  if (newPassword === currentPassword) {
    throw passwordError(
      "New password cannot be the same as your current password. Please choose a different password.",
      422
    );
  }
  return { ok: true };
}

export async function setIntegrationConnected(id, connected) {
  await delay(350);
  const integration = store.integrations.find((item) => item.id === id);
  if (!integration) {
    throw new Error("Integration not found.");
  }
  integration.connected = Boolean(connected);
  return clone(integration);
}

export async function saveRolePermissions(roleId, permissions) {
  await delay(400);
  const role = store.roles.find((item) => item.id === roleId);
  if (!role) {
    throw new Error("Role not found.");
  }
  role.permissions = { ...role.permissions, ...permissions };
  return clone(role);
}
