import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '@/utils/logger';

/**
 * Non-sensitive, JSON-serialisable device preferences.
 * Anything credential-shaped belongs in `secureStorage` instead.
 */
export async function getPreference<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch (error) {
    logger.warn('preferenceStorage', `Failed to read "${key}"`, error);
    return fallback;
  }
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('preferenceStorage', `Failed to write "${key}"`, error);
  }
}

export async function removePreference(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.warn('preferenceStorage', `Failed to delete "${key}"`, error);
  }
}
