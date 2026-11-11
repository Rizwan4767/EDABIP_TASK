import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { ColorScheme } from '@/theme';
import type { TextVariant } from '@/theme/typography';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /** Semantic colour token; defaults to the primary text colour. */
  color?: keyof ColorScheme;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

/**
 * Typography primitive. Screens use this instead of `Text` so font family,
 * size, and colour always come from the theme.
 */
export function AppText({
  variant = 'body',
  color = 'text',
  align,
  style,
  ...rest
}: Readonly<AppTextProps>) {
  const theme = useTheme();

  return (
    <Text
      {...rest}
      style={[
        theme.typography.textVariants[variant],
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
