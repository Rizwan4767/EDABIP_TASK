import { useCallback, useEffect, useState } from 'react';

import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import { isProfileComplete } from '@/screens/profile-completion/profileCompleteness';
import {
  dismissProfilePrompt,
  wasProfilePromptDismissed,
} from '@/screens/profile-completion/profilePromptStorage';
import type { PersistedSettings } from '@/screens/settings/settingsData';
import { getPreference } from '@/services/storage';
import type { User } from '@/types/auth';
import { normalizeEmail } from '@/utils/validation';

type SettingsByEmail = Record<string, PersistedSettings>;

async function shouldOpenPrompt(user: User): Promise<boolean> {
  if (await wasProfilePromptDismissed(user)) return false;
  const map = await getPreference<SettingsByEmail>(PREFERENCE_KEYS.settingsByEmail, {});
  const general = map[normalizeEmail(user.email)]?.general;
  return !isProfileComplete(user, general);
}

export function useIncompleteProfilePrompt(user: User | null) {
  const [loaded, setLoaded] = useState<{ userId: string; open: boolean } | null>(null);

  useEffect(() => {
    if (!user) return undefined;

    const userId = user.id;
    let cancelled = false;

    void shouldOpenPrompt(user).then((open) => {
      if (!cancelled) setLoaded({ userId, open });
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismiss = useCallback(() => {
    if (user) void dismissProfilePrompt(user);
    setLoaded((current) => (current ? { ...current, open: false } : current));
  }, [user]);

  return {
    isOpen: Boolean(user && loaded?.userId === user.id && loaded.open),
    dismiss,
  };
}
