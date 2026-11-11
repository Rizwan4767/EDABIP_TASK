import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import {
  CalendarIcon,
  ClockIcon,
  FilterIcon,
  KebabDotsIcon,
  SearchIcon,
  UserIcon,
} from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import type { ActivityModule, ActivityRow } from '@/screens/dashboard/dashboardData';
import { activityLogCardStyles as styles } from '@/screens/dashboard/components/activityLogCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { StatusPill } from '@/screens/dashboard/components/StatusPill';

const MODULE_TONES: Record<ActivityModule, { background: string; color: string }> = {
  Billing: { background: '#F9E9ED', color: '#9D174D' },
  Users: { background: '#EDE9FE', color: '#5B21B6' },
  'Data Source': { background: '#FEF3C7', color: '#92400E' },
  Marketing: { background: '#FFEDD5', color: '#C2410C' },
};

const MODULES: (ActivityModule | 'All')[] = ['All', 'Billing', 'Users', 'Data Source', 'Marketing'];

export interface ActivitySearchHandle {
  focusSearch: () => void;
}

export const ActivityLogCard = forwardRef<ActivitySearchHandle, { items: ActivityRow[] }>(
  function ActivityLogCard({ items }, ref) {
    const theme = useTheme();
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [module, setModule] = useState<ActivityModule | 'All'>('All');
    const [filterOpen, setFilterOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      focusSearch: () => inputRef.current?.focus(),
    }));

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return items.filter((row) => {
        const matchesModule = module === 'All' || row.module === module;
        if (!matchesModule) return false;
        if (!q) return true;
        return [row.title, row.user, row.module, row.action, row.when, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q);
      });
    }, [items, module, query]);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.header}>
          <AppText variant="h3">Recent Activity</AppText>
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter activity"
            style={[styles.filterBtn, { borderColor: theme.colors.brand }]}
          >
            <DashboardIcon icon={FilterIcon} size={14} />
            <AppText variant="label" color="brand">
              Filter
            </AppText>
          </Pressable>
        </View>

        <View
          style={[
            styles.search,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.searchField },
          ]}
        >
          <DashboardIcon icon={SearchIcon} size={16} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search activity"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular },
            ]}
            accessibilityLabel="Search activity"
            returnKeyType="search"
            underlineColorAndroid="transparent"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <AppText variant="label" color="textMuted">
                ✕
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <AppText variant="caption" color="textMuted" align="center">
              No activity matches that search.
            </AppText>
          ) : (
            filtered.map((row) => {
              const tone = MODULE_TONES[row.module];
              return (
                <View key={row.id} style={[styles.row, { borderColor: '#CFC9C9' }]}>
                  <View style={styles.rowTop}>
                    <AppText variant="caption" style={styles.id}>
                      {row.title}
                    </AppText>
                    <Pressable
                      hitSlop={theme.dimensions.hitSlop}
                      accessibilityRole="button"
                      accessibilityLabel={`Actions for ${row.title}`}
                    >
                      <DashboardIcon icon={KebabDotsIcon} width={10} height={10} />
                    </Pressable>
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.meta}>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <DashboardIcon
                            icon={CalendarIcon}
                            size={10}
                            color={theme.colors.textMuted}
                          />
                          <AppText
                            variant="overline"
                            color="textMuted"
                            style={styles.metaText}
                            numberOfLines={1}
                          >
                            {row.when}
                          </AppText>
                        </View>
                        <View style={styles.metaItem}>
                          <DashboardIcon icon={UserIcon} size={10} color={theme.colors.textMuted} />
                          <AppText
                            variant="overline"
                            color="textMuted"
                            style={styles.metaText}
                            numberOfLines={1}
                          >
                            {row.user}
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.metaItem}>
                        <DashboardIcon icon={ClockIcon} size={10} color={theme.colors.textMuted} />
                        <AppText
                          variant="overline"
                          color="textMuted"
                          style={styles.metaText}
                          numberOfLines={1}
                        >
                          {row.action}
                        </AppText>
                      </View>
                    </View>
                    <View style={[styles.module, { backgroundColor: tone.background }]}>
                      <AppText
                        variant="overline"
                        style={[styles.moduleLabel, { color: tone.color }]}
                        numberOfLines={1}
                      >
                        {row.module}
                      </AppText>
                    </View>
                    <StatusPill status={row.status} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        <BottomSheet
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="Filter activity"
        >
          {MODULES.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setModule(option);
                setFilterOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: module === option }}
              style={styles.filterOption}
            >
              <AppText
                variant={module === option ? 'bodyStrong' : 'body'}
                color={module === option ? 'brand' : 'text'}
              >
                {option}
              </AppText>
            </Pressable>
          ))}
        </BottomSheet>
      </View>
    );
  },
);

ActivityLogCard.displayName = 'ActivityLogCard';
