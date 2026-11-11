import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronDownIcon } from '@/assets/settings';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  sectionCardFill,
  settingsSectionCardStyles as styles,
} from '@/screens/settings/components/settingsSectionCardStyles';

export function SettingsSectionCard({
  title,
  description,
  expanded,
  onToggle,
  accessibilityLabel,
  children,
}: Readonly<{
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
  children: ReactNode;
}>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, sectionCardFill(theme.colors.surface), theme.shadows.sm]}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? `Collapse ${title}` : `Expand ${title}`}
        style={styles.header}
      >
        <View style={styles.heading}>
          <AppText variant="h3" style={styles.title}>
            {title}
          </AppText>
          {description ? (
            <AppText variant="caption" style={styles.description}>
              {description}
            </AppText>
          ) : null}
        </View>
        <View style={expanded ? styles.chevronOpen : styles.chevronClosed}>
          <DashboardIcon icon={ChevronDownIcon} size={12} />
        </View>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}
