import { useCallback, useEffect, useState } from 'react';

import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import {
  DEFAULT_GENERAL,
  DEFAULT_INTEGRATIONS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_SECURITY,
  SETTINGS_OPTIONS,
  SETTINGS_ROLES,
  type GeneralSettings,
  type NotificationSettings,
  type PersistedSettings,
  type SecuritySettings,
  type SettingsData,
  type SettingsIntegration,
} from '@/screens/settings/settingsData';
import {
  buildDefaultPermissions,
  hydratePermissions,
  type PermissionLevel,
} from '@/screens/settings/permissionMatrix';
import { getPreference, setPreference } from '@/services/storage';
import type { User } from '@/types/auth';
import { splitFullName } from '@/utils/format';
import { normalizeEmail } from '@/utils/validation';

type SettingsByEmail = Record<string, PersistedSettings>;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function filled(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    const next = value?.trim() ?? '';
    if (next) return next;
  }
  return '';
}

function namesFromUser(user: User | null): { firstName: string; lastName: string } {
  const split = splitFullName(user?.fullName ?? '');
  const parts = (user?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: filled(user?.firstName, split.firstName),
    lastName: filled(user?.lastName, parts.length > 1 ? split.lastName : ''),
  };
}

function generalFromUser(user: User | null, persisted?: Partial<GeneralSettings>): GeneralSettings {
  const names = namesFromUser(user);
  return {
    ...DEFAULT_GENERAL,
    ...persisted,
    firstName: filled(persisted?.firstName, names.firstName),
    lastName: filled(persisted?.lastName, names.lastName),
    email: filled(persisted?.email, user?.email),
    mobileNumber: filled(persisted?.mobileNumber, user?.phone),
  };
}

function mergeData(user: User | null, persisted: PersistedSettings | undefined): SettingsData {
  const integrations = DEFAULT_INTEGRATIONS.map((item) => {
    const saved = persisted?.integrations?.find((entry) => entry.id === item.id);
    return saved ? { ...item, connected: saved.connected } : item;
  });

  const roles = SETTINGS_ROLES.map((role) => ({
    ...role,
    permissions: hydratePermissions(role.name, persisted?.rolePermissions?.[role.id]),
  }));

  return {
    general: generalFromUser(user, persisted?.general),
    notifications: { ...DEFAULT_NOTIFICATIONS, ...persisted?.notifications },
    security: { ...DEFAULT_SECURITY, ...persisted?.security },
    integrations,
    roles,
    options: SETTINGS_OPTIONS,
  };
}

function toPersisted(data: SettingsData): PersistedSettings {
  return {
    general: data.general,
    notifications: data.notifications,
    security: data.security,
    integrations: data.integrations.map((item) => ({ id: item.id, connected: item.connected })),
    rolePermissions: Object.fromEntries(data.roles.map((role) => [role.id, role.permissions])),
  };
}

export function useSettingsData(user: User | null) {
  const [data, setData] = useState<SettingsData>(() => mergeData(user, undefined));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailKey = normalizeEmail(user?.email ?? '');

  const persist = useCallback(
    async (next: SettingsData) => {
      if (!emailKey) return;
      const map = await getPreference<SettingsByEmail>(PREFERENCE_KEYS.settingsByEmail, {});
      await setPreference(PREFERENCE_KEYS.settingsByEmail, {
        ...map,
        [emailKey]: toPersisted(next),
      });
    },
    [emailKey],
  );

  const readSettings = useCallback(async () => {
    const map = await getPreference<SettingsByEmail>(PREFERENCE_KEYS.settingsByEmail, {});
    return mergeData(user, emailKey ? map[emailKey] : undefined);
  }, [emailKey, user]);

  useEffect(() => {
    let active = true;

    getPreference<SettingsByEmail>(PREFERENCE_KEYS.settingsByEmail, {})
      .then((map) => {
        if (!active) return;
        setData(mergeData(user, emailKey ? map[emailKey] : undefined));
        setError(null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load settings. Pull to try again.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [emailKey, user]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await readSettings());
    } catch {
      setError('Unable to load settings. Pull to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [readSettings]);

  const saveGeneral = useCallback(
    async (payload: GeneralSettings) => {
      await delay(400);
      const next = { ...data, general: payload };
      setData(next);
      await persist(next);
      return next.general;
    },
    [data, persist],
  );

  const saveNotifications = useCallback(
    async (payload: NotificationSettings) => {
      await delay(400);
      const next = { ...data, notifications: payload };
      setData(next);
      await persist(next);
      return next.notifications;
    },
    [data, persist],
  );

  const saveSecurity = useCallback(
    async (payload: SecuritySettings) => {
      await delay(400);
      const next = { ...data, security: payload };
      setData(next);
      await persist(next);
      return next.security;
    },
    [data, persist],
  );

  const changePassword = useCallback(async (newPassword: string) => {
    await delay(400);
    if (!newPassword) {
      throw new Error('Password is required.');
    }
  }, []);

  const saveRolePermission = useCallback(
    (roleId: string, moduleId: string, actionId: string, level: PermissionLevel) => {
      setData((current) => {
        const next: SettingsData = {
          ...current,
          roles: current.roles.map((role) => {
            if (role.id !== roleId) return role;
            const permissions = role.permissions ?? buildDefaultPermissions(role.name);
            return {
              ...role,
              permissions: {
                ...permissions,
                [moduleId]: {
                  ...permissions[moduleId],
                  [actionId]: level,
                },
              },
            };
          }),
        };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleIntegration = useCallback(
    async (id: string, connected: boolean) => {
      await delay(280);
      let saved: SettingsIntegration | undefined;
      const next: SettingsData = {
        ...data,
        integrations: data.integrations.map((item) => {
          if (item.id !== id) return item;
          saved = { ...item, connected };
          return saved;
        }),
      };
      if (!saved) {
        throw new Error('Integration not found.');
      }
      setData(next);
      await persist(next);
      return saved;
    },
    [data, persist],
  );

  return {
    data,
    isLoading,
    error,
    reload,
    saveGeneral,
    saveNotifications,
    saveSecurity,
    changePassword,
    saveRolePermission,
    toggleIntegration,
  };
}
