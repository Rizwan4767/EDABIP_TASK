import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import { getPreference, setPreference } from '@/services/storage/preferenceStorage';

type PictureStore = Record<string, string>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Local profile pictures keyed by email. Matches the web app: there is no
 * upload API yet, so the picked image is stored on-device as a data URL.
 */
export async function readProfilePicture(email: string): Promise<string | null> {
  if (!email) return null;
  const store = await getPreference<PictureStore>(PREFERENCE_KEYS.profilePictures, {});
  return store[normalizeEmail(email)] ?? null;
}

export async function saveProfilePicture(email: string, dataUrl: string): Promise<void> {
  if (!email) return;
  const store = await getPreference<PictureStore>(PREFERENCE_KEYS.profilePictures, {});
  store[normalizeEmail(email)] = dataUrl;
  await setPreference(PREFERENCE_KEYS.profilePictures, store);
}
