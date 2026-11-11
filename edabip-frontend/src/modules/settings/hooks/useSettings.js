import { useCallback, useEffect, useState } from 'react';
import {
  getSettingsData,
  saveGeneralSettings,
  saveNotificationPreferences,
  saveSecuritySettings,
  changePassword,
  setIntegrationConnected,
  saveRolePermissions,
} from '../api/settingsApi.js';

const EMPTY_SETTINGS = {
  general: null,
  notifications: null,
  security: null,
  integrations: [],
  roles: [],
  options: {
    timezones: [],
    companySizes: [],
    industries: [],
    dashboardAlerts: [],
    reportUpdates: [],
    modules: [],
  },
};

export function useSettings(user) {
  const [data, setData] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await getSettingsData(user);
      setData(next);
    } catch (err) {
      setError(err?.message || 'Unable to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    getSettingsData(user)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Unable to load settings. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const updateGeneral = useCallback(async (payload) => {
    const saved = await saveGeneralSettings(payload);
    setData((prev) => ({ ...prev, general: saved }));
    return saved;
  }, []);

  const updateNotifications = useCallback(async (payload) => {
    const saved = await saveNotificationPreferences(payload);
    setData((prev) => ({ ...prev, notifications: saved }));
    return saved;
  }, []);

  const updateSecurity = useCallback(async (payload) => {
    const saved = await saveSecuritySettings(payload);
    setData((prev) => ({ ...prev, security: saved }));
    return saved;
  }, []);

  const updatePassword = useCallback(async ({ currentPassword, newPassword }) => {
    return changePassword({ currentPassword, newPassword });
  }, []);

  const updateIntegration = useCallback(async (id, connected) => {
    const saved = await setIntegrationConnected(id, connected);
    setData((prev) => ({
      ...prev,
      integrations: prev.integrations.map((item) => (item.id === id ? saved : item)),
    }));
    return saved;
  }, []);

  const updateRolePermissions = useCallback(async (roleId, permissions) => {
    const saved = await saveRolePermissions(roleId, permissions);
    setData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) => (role.id === roleId ? saved : role)),
    }));
    return saved;
  }, []);

  return {
    data,
    loading,
    error,
    reload: load,
    updateGeneral,
    updateNotifications,
    updateSecurity,
    updatePassword,
    updateIntegration,
    updateRolePermissions,
  };
}
