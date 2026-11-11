import type { ReactNode } from 'react';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import {
  AvatarPlaceholder,
  FilterRefreshIcon,
  LogoWordmarkIcon,
  MenuIcon,
  SearchIcon,
} from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { edabipAppHeaderStyles as styles } from '@/components/layout/edabipAppHeaderStyles';
import {
  createDefaultFilter,
  FilterSheet,
  type AppFilterValue,
  type FilterSheetMode,
} from '@/components/modals/FilterSheet';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

export interface EdabipAppHeaderProps {
  topInset: number;
  firstName: string;
  avatarUrl?: string;
  initialsSource: string;
  onMenuPress: () => void;
  onSearchPress?: () => void;
  onProfilePress: () => void;
  onRefreshPress: () => void;
  /** Power BI listing shows category checkboxes; other screens are date-only. */
  filterMode?: FilterSheetMode;
  onApplyFilter?: (value: AppFilterValue) => void;
  children?: ReactNode;
}

/**
 * Shared teal chrome for primary mobile screens: hamburger, wordmark, search,
 * avatar, welcome row, and optional page-specific content underneath.
 */
export function EdabipAppHeader({
  topInset,
  firstName,
  avatarUrl,
  initialsSource,
  onMenuPress,
  onSearchPress,
  onProfilePress,
  onRefreshPress,
  filterMode = 'date',
  onApplyFilter,
  children,
}: Readonly<EdabipAppHeaderProps>) {
  const theme = useTheme();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterEpoch, setFilterEpoch] = useState(0);
  const [filterValue, setFilterValue] = useState(createDefaultFilter);

  const onOpenFilter = () => {
    setFilterEpoch((current) => current + 1);
    setFilterOpen(true);
  };

  const onApplyHeaderFilter = (value: AppFilterValue) => {
    setFilterValue(value);
    onApplyFilter?.(value);
  };

  return (
    <>
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.colors.brand,
            paddingTop: topInset + theme.spacing.sm,
            borderBottomLeftRadius: theme.radii.xxl,
            borderBottomRightRadius: theme.radii.xxl,
          },
        ]}
      >
        <View style={styles.nav}>
          <Pressable
            onPress={onMenuPress}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={theme.dimensions.hitSlop}
            style={styles.navButton}
          >
            <DashboardIcon icon={MenuIcon} size={26} />
          </Pressable>

          <View style={styles.logo}>
            <DashboardIcon icon={LogoWordmarkIcon} width={73} height={29} />
          </View>

          <View style={styles.navRight}>
            <Pressable
              onPress={onSearchPress}
              accessibilityRole="button"
              accessibilityLabel="Search"
              hitSlop={theme.dimensions.hitSlop}
              style={styles.searchButton}
            >
              <DashboardIcon icon={SearchIcon} size={18} />
            </Pressable>
            <Pressable
              onPress={onProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Open users"
            >
              <Image
                source={avatarUrl ? { uri: avatarUrl } : AvatarPlaceholder}
                style={styles.avatar}
                accessibilityLabel={
                  initialsSource ? `${initialsSource}'s profile photo` : 'Profile photo'
                }
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <View style={styles.titleRow}>
              <AppText variant="h2" color="textOnBrand" numberOfLines={1} style={styles.title}>
                {`Welcome Back, ${firstName}!`}
              </AppText>
              <View
                style={[
                  styles.liveBadge,
                  { backgroundColor: theme.palette.teal50, borderColor: theme.colors.success },
                ]}
              >
                <AppText variant="caption" style={styles.liveLabel}>
                  Real Time
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color="textOnBrand" style={styles.subtitle}>
              Stay Organised with real time insight, Monitor Your Business Performance and key
              Metrics.
            </AppText>
          </View>
          <View style={styles.filterRefresh}>
            <DashboardIcon icon={FilterRefreshIcon} width={36} height={14} />
            <View style={styles.filterRefreshHits}>
              <Pressable
                onPress={onOpenFilter}
                accessibilityRole="button"
                accessibilityLabel="Open filters"
                accessibilityHint={
                  filterMode === 'categories'
                    ? 'Opens date and category filters'
                    : 'Opens date filters'
                }
                style={styles.filterHit}
              />
              <Pressable
                onPress={onRefreshPress}
                accessibilityRole="button"
                accessibilityLabel="Refresh"
                style={styles.refreshHit}
              />
            </View>
          </View>
        </View>

        {children}
      </View>

      <FilterSheet
        key={filterEpoch}
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={filterMode}
        value={filterValue}
        onApply={onApplyHeaderFilter}
      />
    </>
  );
}
