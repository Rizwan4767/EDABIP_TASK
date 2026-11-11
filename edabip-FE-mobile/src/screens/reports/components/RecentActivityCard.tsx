import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { CalendarIcon, ClockIcon, KebabDotsIcon, SearchIcon, UserIcon } from '@/assets/dashboard';
import { FilterSlidersIcon } from '@/assets/reports';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { recentActivityCardStyles as styles } from '@/screens/reports/components/recentActivityCardStyles';
import { ReportStatusPill } from '@/screens/reports/components/ReportStatusPill';
import type { ActivityRow, ReportCategory } from '@/screens/reports/reportsData';

const CATEGORY_TONES: Record<ReportCategory, { background: string; color: string }> = {
  Sales: { background: '#E5ECFB', color: '#2952A3' },
  Financial: { background: '#F9E9ED', color: '#9D174D' },
  Executive: { background: '#FFF6DA', color: '#92610E' },
  Customer: { background: '#E8FBF6', color: '#0F766E' },
  Inventory: { background: '#F3E8FF', color: '#6B21A8' },
  Marketing: { background: '#FFEDD5', color: '#C2410C' },
};

const CATEGORIES: (ReportCategory | 'All')[] = [
  'All',
  'Sales',
  'Financial',
  'Executive',
  'Customer',
  'Inventory',
  'Marketing',
];

export interface ActivitySearchHandle {
  focusSearch: () => void;
}

export interface RecentActivityCardProps {
  items: ActivityRow[];
  onOpenActions?: (row: ActivityRow) => void;
}

export const RecentActivityCard = forwardRef<ActivitySearchHandle, RecentActivityCardProps>(
  function RecentActivityCard({ items, onOpenActions }, ref) {
    const theme = useTheme();
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<ReportCategory | 'All'>('All');
    const [filterOpen, setFilterOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      focusSearch: () => inputRef.current?.focus(),
    }));

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return items.filter((row) => {
        const matchesCategory = category === 'All' || row.category === category;
        if (!matchesCategory) return false;
        if (!q) return true;
        return [row.title, row.author, row.category, row.trigger, row.when, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q);
      });
    }, [items, category, query]);

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
            <DashboardIcon icon={FilterSlidersIcon} size={14} />
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
              const tone = CATEGORY_TONES[row.category];
              return (
                <View key={row.id} style={[styles.row, { borderColor: '#CFC9C9' }]}>
                  <View style={styles.rowTop}>
                    <AppText variant="caption" style={styles.id} numberOfLines={1}>
                      {row.title}
                    </AppText>
                    <Pressable
                      onPress={() => onOpenActions?.(row)}
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
                            {row.author}
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
                          {row.trigger}
                        </AppText>
                      </View>
                    </View>
                    <View style={[styles.category, { backgroundColor: tone.background }]}>
                      <AppText
                        variant="overline"
                        style={[styles.categoryLabel, { color: tone.color }]}
                        numberOfLines={1}
                      >
                        {row.category}
                      </AppText>
                    </View>
                    <ReportStatusPill status={row.status} />
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
          {CATEGORIES.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setCategory(option);
                setFilterOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: category === option }}
              style={styles.filterOption}
            >
              <AppText
                variant={category === option ? 'bodyStrong' : 'body'}
                color={category === option ? 'brand' : 'text'}
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

RecentActivityCard.displayName = 'RecentActivityCard';
