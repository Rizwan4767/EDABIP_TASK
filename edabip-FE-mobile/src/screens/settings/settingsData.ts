import type { ImageSourcePropType } from 'react-native';

import {
  GoogleAnalyticsIcon,
  MicrosoftTeamsIcon,
  RoleAdminIcon,
  RoleAnalystIcon,
  RoleEditorIcon,
  RoleViewerIcon,
  SalesforceIcon,
  SlackIcon,
} from '@/assets/settings';
import { buildDefaultPermissions, type RolePermissions } from '@/screens/settings/permissionMatrix';

export interface SettingsOption {
  value: string;
  label: string;
}

export interface GeneralSettings {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  applicationName: string;
  timezone: string;
  companySize: string;
  industry: string;
  emailNotifications: boolean;
}

export interface NotificationSettings {
  dashboardAlerts: string;
  reportUpdates: string;
  smsNotifications: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
}

export interface SettingsIntegration {
  id: string;
  name: string;
  connected: boolean;
  icon: ImageSourcePropType;
}

export interface SettingsRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  icon: ImageSourcePropType;
  permissions: RolePermissions;
}

export interface SettingsOptions {
  timezones: SettingsOption[];
  companySizes: SettingsOption[];
  industries: SettingsOption[];
  dashboardAlerts: SettingsOption[];
  reportUpdates: SettingsOption[];
}

export interface SettingsData {
  general: GeneralSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  integrations: SettingsIntegration[];
  roles: SettingsRole[];
  options: SettingsOptions;
}

export interface PersistedSettings {
  general?: Partial<GeneralSettings>;
  notifications?: Partial<NotificationSettings>;
  security?: Partial<SecuritySettings>;
  integrations?: { id: string; connected: boolean }[];
  rolePermissions?: Record<string, RolePermissions>;
}

export const SETTINGS_OPTIONS: SettingsOptions = {
  timezones: [
    { value: 'UTC', label: 'UTC(Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'EST (Eastern Standard Time)' },
    { value: 'America/Chicago', label: 'CST (Central Standard Time)' },
    { value: 'America/Denver', label: 'MST (Mountain Standard Time)' },
    { value: 'America/Los_Angeles', label: 'PST (Pacific Standard Time)' },
    { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
    { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
    { value: 'Asia/Dubai', label: 'GST (Gulf Standard Time)' },
    { value: 'Asia/Singapore', label: 'SGT (Singapore Time)' },
    { value: 'Australia/Sydney', label: 'AEST (Australian Eastern Time)' },
  ],
  companySizes: [
    { value: '1-50', label: '1-50 Employees' },
    { value: '51-200', label: '51-200 Employees' },
    { value: '201-500', label: '201-500 Employees' },
    { value: '501-1000', label: '501-1000 Employees' },
    { value: '1000+', label: '1000+ Employees' },
  ],
  industries: [
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'retail', label: 'Retail' },
    { value: 'finance', label: 'Finance' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'education', label: 'Education' },
  ],
  dashboardAlerts: [
    { value: 'all', label: 'All Alerts' },
    { value: 'critical', label: 'Critical Only' },
    { value: 'warnings', label: 'Warnings & Critical' },
    { value: 'none', label: 'None' },
  ],
  reportUpdates: [
    { value: 'realtime', label: 'Real Time' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ],
};

export const DEFAULT_GENERAL: GeneralSettings = {
  firstName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  applicationName: 'EDABIP',
  timezone: 'UTC',
  companySize: '',
  industry: '',
  emailNotifications: true,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  dashboardAlerts: 'all',
  reportUpdates: 'daily',
  smsNotifications: true,
};

export const DEFAULT_SECURITY: SecuritySettings = {
  twoFactorEnabled: true,
};

export const DEFAULT_INTEGRATIONS: SettingsIntegration[] = [
  { id: 'salesforce', name: 'Salesforce CRM', connected: true, icon: SalesforceIcon },
  { id: 'google-analytics', name: 'Google Analytics', connected: false, icon: GoogleAnalyticsIcon },
  { id: 'slack', name: 'Slack', connected: true, icon: SlackIcon },
  { id: 'microsoft-teams', name: 'Microsoft Teams', connected: true, icon: MicrosoftTeamsIcon },
];

/**
 * Role cards transcribed from the mobile Figma settings screen (204:4127).
 * Replaced by a settings API once the backend router exists.
 */
export const SETTINGS_ROLES: SettingsRole[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to all features setting',
    userCount: 5,
    icon: RoleAdminIcon,
    permissions: buildDefaultPermissions('Admin'),
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'Access to analytics, reports and dashboards',
    userCount: 18,
    icon: RoleAnalystIcon,
    permissions: buildDefaultPermissions('Business Analyst'),
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can edit reports and dashboards',
    userCount: 32,
    icon: RoleEditorIcon,
    permissions: buildDefaultPermissions('Editor'),
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'View only access to reports and dashboards',
    userCount: 120,
    icon: RoleViewerIcon,
    permissions: buildDefaultPermissions('Viewer'),
  },
];

export function integrationStatusLabel(
  item: SettingsIntegration,
): 'Connected' | 'Active' | 'Inactive' {
  if (!item.connected) return 'Inactive';
  return item.id === 'microsoft-teams' ? 'Active' : 'Connected';
}

export function optionLabel(options: SettingsOption[], value: string, fallback = 'Select'): string {
  return options.find((option) => option.value === value)?.label ?? fallback;
}
