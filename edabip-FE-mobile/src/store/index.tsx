import type { ReactNode } from 'react';

import { AppProvider } from '@/store/app';
import { AuthProvider } from '@/store/auth';
import { UserProvider } from '@/store/user';

/**
 * Composes the independent state slices.
 *
 * Ordering matters: `UserProvider` reads auth status, and `AppProvider` sits
 * outermost because appearance preferences outlive any session.
 */
export function StoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AppProvider>
      <AuthProvider>
        <UserProvider>{children}</UserProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export { AppProvider, useApp } from './app';
export type { ColorSchemePreference } from './app';
export { AuthProvider, useAuth } from './auth';
export { UserProvider, useUser } from './user';
