import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { ShadowToken, SpacingToken } from '@/theme';

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Slot on the right of the header — filters, overflow menus, badges. */
  headerAccessory?: ReactNode;
  /** Makes the whole card a touch target. */
  onPress?: () => void;
  accessibilityLabel?: string;
  padding?: SpacingToken;
  elevation?: ShadowToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Surface container for grouped mobile content. */
export function Card({
  children,
  title,
  subtitle,
  headerAccessory,
  onPress,
  accessibilityLabel,
  padding = 'base',
  elevation = 'xs',
  style,
  testID,
}: Readonly<CardProps>) {
  const theme = useTheme();

  const containerStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing[padding],
    },
    theme.shadows[elevation],
    style,
  ];

  const content = (
    <>
      {title || headerAccessory ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <AppText variant="h3">{title}</AppText> : null}
            {subtitle ? (
              <AppText variant="caption" color="textSecondary" style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {headerAccessory}
        </View>
      ) : null}
      {children}
    </>
  );

  if (!onPress) {
    return (
      <View style={containerStyle} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [containerStyle, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  headerText: { flex: 1 },
  subtitle: { marginTop: 2 },
  pressed: { opacity: 0.85 },
});
