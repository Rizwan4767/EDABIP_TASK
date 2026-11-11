import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import { getPreference, setPreference } from '@/services/storage';
import type { ColorSchemeName } from '@/theme';

export type ColorSchemePreference = 'system' | 'light' | 'dark';

interface AppContextValue {
  /** False until persisted preferences have been read from disk. */
  isReady: boolean;
  colorSchemePreference: ColorSchemePreference;
  /** The preference resolved against the OS setting. */
  colorScheme: ColorSchemeName;
  setColorSchemePreference: (preference: ColorSchemePreference) => void;
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function resolveColorScheme(
  preference: ColorSchemePreference,
  systemScheme: string | null | undefined,
): ColorSchemeName {
  if (preference !== 'system') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/**
 * Device-level application state: appearance and first-run flags.
 * Deliberately separate from auth and user state so signing out does not
 * reset the user's display preferences.
 */
export function AppProvider({ children }: Readonly<{ children: ReactNode }>) {
  const systemScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [colorSchemePreference, setPreferenceState] = useState<ColorSchemePreference>('system');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [scheme, onboarded] = await Promise.all([
        getPreference<ColorSchemePreference>(PREFERENCE_KEYS.colorScheme, 'system'),
        getPreference<boolean>(PREFERENCE_KEYS.onboardingCompleted, false),
      ]);

      if (cancelled) return;
      setPreferenceState(scheme);
      setOnboardingCompleted(onboarded);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setColorSchemePreference = useCallback((preference: ColorSchemePreference) => {
    setPreferenceState(preference);
    void setPreference(PREFERENCE_KEYS.colorScheme, preference);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    void setPreference(PREFERENCE_KEYS.onboardingCompleted, true);
  }, []);

  const colorScheme: ColorSchemeName = resolveColorScheme(colorSchemePreference, systemScheme);

  const value = useMemo<AppContextValue>(
    () => ({
      isReady,
      colorSchemePreference,
      colorScheme,
      setColorSchemePreference,
      onboardingCompleted,
      completeOnboarding,
    }),
    [
      isReady,
      colorSchemePreference,
      colorScheme,
      setColorSchemePreference,
      onboardingCompleted,
      completeOnboarding,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>.');
  }
  return context;
}
