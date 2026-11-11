import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

import { createLandingStyles, type LandingStyles } from '@/screens/landing/landingScreenStyles';
import { useLandingLayout, type LandingLayout } from '@/screens/landing/useLandingLayout';

const LandingStylesContext = createContext<{
  layout: LandingLayout;
  styles: LandingStyles;
} | null>(null);

export function LandingStylesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const layout = useLandingLayout();
  const styles = useMemo(() => createLandingStyles(layout), [layout]);
  const value = useMemo(() => ({ layout, styles }), [layout, styles]);
  return createElement(LandingStylesContext.Provider, { value }, children);
}

export function useLandingStyles(): { layout: LandingLayout; styles: LandingStyles } {
  const value = useContext(LandingStylesContext);
  if (!value) {
    throw new Error('useLandingStyles must be used within LandingStylesProvider');
  }
  return value;
}
