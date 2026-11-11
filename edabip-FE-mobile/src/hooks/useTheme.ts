import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

import { useApp } from '@/store/app';
import { getTheme, type ColorSchemeName, type Theme } from '@/theme';

const ThemeSchemeOverrideContext = createContext<ColorSchemeName | null>(null);

/**
 * Force descendant `useTheme()` calls onto a specific scheme. Used by screens
 * that are designed for one canvas (the Figma dashboard is light).
 */
export function ThemeSchemeOverride({
  scheme,
  children,
}: {
  scheme: ColorSchemeName;
  children: ReactNode;
}) {
  return createElement(ThemeSchemeOverrideContext.Provider, { value: scheme }, children);
}

/** Resolved theme for the active colour scheme. */
export function useTheme(): Theme {
  const { colorScheme } = useApp();
  const override = useContext(ThemeSchemeOverrideContext);
  const scheme = override ?? colorScheme;
  return useMemo(() => getTheme(scheme), [scheme]);
}

/**
 * Builds themed styles without recreating the StyleSheet on every render.
 *
 * ```ts
 * const styles = useThemedStyles(createStyles);
 * ```
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
