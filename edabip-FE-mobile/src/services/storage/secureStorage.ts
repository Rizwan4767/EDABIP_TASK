import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';

/**
 * Keychain (iOS) / EncryptedSharedPreferences (Android) backed storage for
 * credentials. `expo-secure-store` has no web implementation, so the web target
 * falls back to `localStorage` — acceptable only because web is a development
 * convenience here, not a shipping platform.
 */
const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    logger.warn('secureStorage', `Failed to read "${key}"`, error);
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    logger.error('secureStorage', `Failed to write "${key}"`, error);
    throw error;
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    logger.warn('secureStorage', `Failed to delete "${key}"`, error);
  }
}
