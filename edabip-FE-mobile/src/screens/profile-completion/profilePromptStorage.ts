import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import { getPreference, readAccessToken, setPreference } from '@/services/storage';
import type { User } from '@/types/auth';

type DismissedByUser = Record<string, string>;

/**
 * "Remind me later" lasts for the current login only. The stored value is the
 * access token from that session, so the next login (new token) can prompt again.
 */
export async function wasProfilePromptDismissed(user: User): Promise<boolean> {
  const token = await readAccessToken();
  if (!token) return false;
  const map = await getPreference<DismissedByUser>(PREFERENCE_KEYS.profilePromptDismissed, {});
  return map[user.id] === token;
}

export async function dismissProfilePrompt(user: User): Promise<void> {
  const token = await readAccessToken();
  if (!token) return;
  const map = await getPreference<DismissedByUser>(PREFERENCE_KEYS.profilePromptDismissed, {});
  await setPreference(PREFERENCE_KEYS.profilePromptDismissed, { ...map, [user.id]: token });
}
