import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function resolveColors(theme: Theme, variant: ButtonVariant) {
  switch (variant) {
    case 'secondary':
      return {
        background: theme.colors.brandSurface,
        text: theme.colors.brand,
        border: 'transparent',
      };
    case 'outline':
      return {
        background: 'transparent',
        text: theme.colors.brand,
        border: theme.colors.borderStrong,
      };
    case 'ghost':
      return { background: 'transparent', text: theme.colors.brand, border: 'transparent' };
    case 'danger':
      return {
        background: theme.colors.danger,
        text: theme.colors.textInverse,
        border: 'transparent',
      };
    case 'primary':
    default:
      return {
        background: theme.colors.brand,
        text: theme.colors.textOnBrand,
        border: 'transparent',
      };
  }
}

const SIZES = {
  sm: { height: 'heightSm', paddingHorizontal: 12 },
  md: { height: 'heightMd', paddingHorizontal: 16 },
  lg: { height: 'heightLg', paddingHorizontal: 20 },
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  accessibilityHint,
  style,
  testID,
}: Readonly<ButtonProps>) {
  const theme = useTheme();
  const isInactive = disabled || loading;
  const colors = resolveColors(theme, variant);
  const sizing = SIZES[size];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: theme.dimensions.control[sizing.height],
          paddingHorizontal: sizing.paddingHorizontal,
          borderRadius: theme.radii.md,
          backgroundColor: isInactive ? theme.colors.disabled : colors.background,
          borderColor: isInactive ? theme.colors.disabled : colors.border,
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: pressed && !isInactive ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isInactive ? theme.colors.disabledText : colors.text}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <AppText
            variant="button"
            style={{
              color: isInactive ? theme.colors.disabledText : colors.text,
              fontSize: size === 'sm' ? theme.typography.fontSize.base : undefined,
            }}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
});
