import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface AuthLinkProps {
  href: Href;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  replace?: boolean;
}

/** Themed inline navigation link used across the authentication screens. */
export function AuthLink({ href, children, style, replace = false }: Readonly<AuthLinkProps>) {
  const theme = useTheme();

  return (
    <Link
      href={href}
      replace={replace}
      accessibilityRole="link"
      style={[theme.typography.textVariants.label, { color: theme.colors.brand }, style]}
    >
      {children}
    </Link>
  );
}
