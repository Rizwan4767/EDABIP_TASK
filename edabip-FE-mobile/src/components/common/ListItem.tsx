import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Overrides `icon` — for avatars, switches, or badges. */
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  testID?: string;
}

/** Row primitive for settings, menus, and simple record lists. */
export function ListItem({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  onPress,
  showChevron = Boolean(onPress),
  destructive = false,
  testID,
}: Readonly<ListItemProps>) {
  const theme = useTheme();
  const titleColor = destructive ? 'danger' : 'text';

  const body = (
    <View style={[styles.row, { minHeight: theme.dimensions.minTouchTarget }]}>
      {leading ??
        (icon ? (
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandSurface }]}>
            <Ionicons
              name={icon}
              size={theme.dimensions.icon.md}
              color={destructive ? theme.colors.danger : theme.colors.brand}
            />
          </View>
        ) : null)}

      <View style={styles.text}>
        <AppText variant="bodyStrong" color={titleColor} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {trailing}

      {showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={theme.dimensions.icon.md}
          color={theme.colors.textMuted}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} style={styles.container}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      style={({ pressed }) => [
        styles.container,
        pressed ? { backgroundColor: theme.colors.surfaceSunken } : null,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});
