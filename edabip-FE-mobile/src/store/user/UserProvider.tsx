import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getErrorMessage } from '@/services/api/apiError';
import * as authApi from '@/services/api/authApi';
import { readProfilePicture, saveProfilePicture } from '@/services/storage';
import { useAuth } from '@/store/auth';
import type { User } from '@/types/auth';

type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ProfileState {
  profile: User | null;
  status: ProfileStatus;
  error: string | null;
}

interface UserContextValue extends ProfileState {
  reload: () => Promise<void>;
  /** Apply a locally known profile change without a round trip. */
  applyProfilePatch: (patch: Partial<User>) => void;
  /** Persist a picked profile photo locally and reflect it in the session. */
  updateAvatar: (dataUrl: string) => Promise<void>;
}

const SIGNED_OUT: ProfileState = { profile: null, status: 'idle', error: null };

const UserContext = createContext<UserContextValue | null>(null);

async function withLocalAvatar(profile: User): Promise<User> {
  const localPicture = await readProfilePicture(profile.email);
  return localPicture ? { ...profile, avatarUrl: localPicture } : profile;
}

/**
 * Resolves to the next state instead of setting it, so both the mount effect
 * and the manual reload share one implementation without either of them
 * driving state from inside an effect body.
 */
async function loadProfileState(): Promise<ProfileState> {
  try {
    const profile = await withLocalAvatar(await authApi.fetchCurrentUser());
    return { profile, status: 'ready', error: null };
  } catch (cause) {
    // A 401 here means the refresh token is dead too; AuthProvider is notified
    // through the sessionExpired event and signs the user out.
    return {
      profile: null,
      status: 'error',
      error: getErrorMessage(cause, 'Could not load your profile.'),
    };
  }
}

function resolveLoadedProfile(isAuthenticated: boolean, loaded: ProfileState): ProfileState {
  if (!isAuthenticated) return SIGNED_OUT;
  if (loaded.status === 'idle') return { ...loaded, status: 'loading' };
  return loaded;
}

/**
 * Owns the signed-in user's profile. Kept separate from `AuthProvider` so the
 * session lifecycle and the user record can evolve independently — profile
 * editing, avatars, and preferences all belong here, not in the auth store.
 *
 * Must be rendered inside `<AuthProvider>`.
 */
export function UserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const [loaded, setLoaded] = useState<ProfileState>(SIGNED_OUT);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;
    void loadProfileState().then((next) => {
      if (!cancelled) setLoaded(next);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const reload = useCallback(async () => {
    setLoaded((current) => ({ ...current, status: 'loading', error: null }));
    setLoaded(await loadProfileState());
  }, []);

  const applyProfilePatch = useCallback((patch: Partial<User>) => {
    setLoaded((current) =>
      current.profile ? { ...current, profile: { ...current.profile, ...patch } } : current,
    );
  }, []);

  const updateAvatar = useCallback(
    async (dataUrl: string) => {
      const email = loaded.profile?.email;
      if (!email) return;
      await saveProfilePicture(email, dataUrl);
      applyProfilePatch({ avatarUrl: dataUrl });
    },
    [applyProfilePatch, loaded.profile?.email],
  );

  const value = useMemo<UserContextValue>(() => {
    // Derived rather than cleared in an effect, so a signed-out render can
    // never briefly expose the previous user's profile. Being authenticated
    // with nothing loaded yet means the initial fetch is still in flight.
    const state: ProfileState = resolveLoadedProfile(isAuthenticated, loaded);

    return { ...state, reload, applyProfilePatch, updateAvatar };
  }, [isAuthenticated, loaded, reload, applyProfilePatch, updateAvatar]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside <UserProvider>.');
  }
  return context;
}
