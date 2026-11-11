import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { FilterIcon, SearchIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import type { TableauCategoryTone, TableauDashboardRow } from '@/screens/tableau/tableauData';
import {
  categoryPillFill,
  chartCardFill,
  topDashboardsCardStyles as styles,
} from '@/screens/tableau/components/topDashboardsCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const CATEGORIES: (TableauCategoryTone | 'All')[] = [
  'All',
  'executive',
  'sales',
  'finance',
  'customer',
  'operations',
];

const CATEGORY_LABEL: Record<TableauCategoryTone | 'All', string> = {
  All: 'All',
  executive: 'Executive',
  sales: 'Sales',
  finance: 'Finance',
  customer: 'Customer',
  operations: 'Operations',
};

export interface DashboardSearchHandle {
  focusSearch: () => void;
}

export const TopDashboardsCard = forwardRef<
  DashboardSearchHandle,
  { items: TableauDashboardRow[] }
>(function TopDashboardsCard({ items }, ref) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TableauCategoryTone | 'All'>('All');
  const [filterOpen, setFilterOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    focusSearch: () => inputRef.current?.focus(),
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      const matchesCategory = category === 'All' || row.tone === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      return [row.name, row.category, row.updated, row.views].join(' ').toLowerCase().includes(q);
    });
  }, [items, category, query]);

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Top Performing Dashboard
        </AppText>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter dashboards"
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
          placeholder="Search"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular },
          ]}
          accessibilityLabel="Search dashboards"
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
            No dashboards match that search.
          </AppText>
        ) : (
          filtered.map((row) => (
            <View key={row.id} style={styles.row}>
              <View style={styles.copy}>
                <AppText variant="bodyStrong" numberOfLines={1} style={styles.name}>
                  {row.name}
                </AppText>
                <AppText variant="overline" color="textMuted" style={styles.meta}>
                  {row.updated} · {row.views}
                </AppText>
              </View>
              <View style={[styles.pill, categoryPillFill[row.tone]]}>
                <AppText variant="overline" style={styles.pillLabel}>
                  {row.category}
                </AppText>
              </View>
            </View>
          ))
        )}
      </View>

      <BottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter dashboards"
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
              {CATEGORY_LABEL[option]}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
});

TopDashboardsCard.displayName = 'TopDashboardsCard';
