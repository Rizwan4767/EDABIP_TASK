import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CalendarIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { filterSheetStyles as styles } from '@/components/modals/filterSheetStyles';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { addMonths, daysInMonth, formatDayMonthYear, isSameDay, startOfDay } from '@/utils/date';

export const FILTER_CATEGORY_IDS = ['sales', 'financial', 'customer', 'hr', 'operations'] as const;

export type FilterCategoryId = (typeof FILTER_CATEGORY_IDS)[number];
export type FilterDatePreset = 3 | 6 | 9 | 12;

export interface AppFilterValue {
  from: Date;
  to: Date;
  preset: FilterDatePreset | null;
  categories: FilterCategoryId[];
}

export type FilterSheetMode = 'date' | 'categories';

const FILTER_CATEGORIES: { id: FilterCategoryId; label: string }[] = [
  { id: 'sales', label: 'Sales Analytics' },
  { id: 'financial', label: 'Financial Analytics' },
  { id: 'customer', label: 'Customer Analytics' },
  { id: 'hr', label: 'HR Analytics' },
  { id: 'operations', label: 'Operations Analytics' },
];

const DATE_PRESETS: { months: FilterDatePreset; label: string }[] = [
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 9, label: '9 Months' },
  { months: 12, label: '12 Months' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function createDefaultFilter(): AppFilterValue {
  const today = startOfDay(new Date());
  return { from: today, to: today, preset: null, categories: [] };
}

export function cloneFilter(value: AppFilterValue): AppFilterValue {
  return {
    from: startOfDay(value.from),
    to: startOfDay(value.to),
    preset: value.preset,
    categories: [...value.categories],
  };
}

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  mode?: FilterSheetMode;
  value: AppFilterValue;
  onApply: (value: AppFilterValue) => void;
}

/**
 * Slide-up filter sheet used from the shared app header.
 *
 * Power BI listing (`mode="categories"`) adds report-type checkboxes; every
 * other screen uses the date-only variant.
 */
export function FilterSheet({
  visible,
  onClose,
  mode = 'date',
  value,
  onApply,
}: Readonly<FilterSheetProps>) {
  const theme = useTheme();
  const [draft, setDraft] = useState(() => cloneFilter(value));
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);

  const showCategories = mode === 'categories';

  const onSelectPreset = (months: FilterDatePreset) => {
    const to = startOfDay(new Date());
    setDraft((current) => ({
      ...current,
      preset: months,
      to,
      from: addMonths(to, -months),
    }));
  };

  const onSelectDate = (next: Date) => {
    const day = startOfDay(next);
    setDraft((current) => {
      if (picking === 'from') {
        const to = day.getTime() > current.to.getTime() ? day : current.to;
        return { ...current, from: day, to, preset: null };
      }
      const from = day.getTime() < current.from.getTime() ? day : current.from;
      return { ...current, from, to: day, preset: null };
    });
    setPicking(null);
  };

  const onToggleCategory = (id: FilterCategoryId) => {
    setDraft((current) => {
      const selected = current.categories.includes(id)
        ? current.categories.filter((item) => item !== id)
        : [...current.categories, id];
      return { ...current, categories: selected };
    });
  };

  const onReset = () => {
    setPicking(null);
    setDraft(createDefaultFilter());
  };

  const onApplyPress = () => {
    onApply(cloneFilter(draft));
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      footer={
        picking ? null : (
          <View style={styles.actions}>
            <Pressable
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  borderColor: theme.colors.brand,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.pill,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <AppText variant="button" color="brand" style={styles.actionLabel}>
                Reset All
              </AppText>
            </Pressable>
            <Pressable
              onPress={onApplyPress}
              accessibilityRole="button"
              accessibilityLabel="Apply filter"
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  borderColor: theme.colors.brand,
                  backgroundColor: theme.colors.brand,
                  borderRadius: theme.radii.pill,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <AppText variant="button" color="textOnBrand" style={styles.actionLabel}>
                Apply Filter
              </AppText>
            </Pressable>
          </View>
        )
      }
    >
      {picking ? (
        <MonthCalendar
          selected={picking === 'from' ? draft.from : draft.to}
          onSelect={onSelectDate}
          onCancel={() => setPicking(null)}
        />
      ) : (
        <View style={styles.body}>
          <AppText variant="caption" color="textMuted" style={styles.eyebrow}>
            Filter by :
          </AppText>

          <View style={styles.section}>
            <AppText variant="h3" style={styles.heading}>
              Custom Date :
            </AppText>

            <View style={styles.dateRow}>
              <DateField label="From" value={draft.from} onPress={() => setPicking('from')} />
              <DateField label="To" value={draft.to} onPress={() => setPicking('to')} />
            </View>

            <View style={styles.presetRow}>
              {DATE_PRESETS.map((preset) => {
                const selected = draft.preset === preset.months;
                return (
                  <Pressable
                    key={preset.months}
                    onPress={() => onSelectPreset(preset.months)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={preset.label}
                    style={({ pressed }) => [
                      styles.presetChip,
                      {
                        borderColor: selected ? theme.colors.brand : theme.colors.border,
                        backgroundColor: selected
                          ? theme.colors.brandSurface
                          : theme.colors.surface,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <AppText
                      variant="label"
                      color={selected ? 'brand' : 'textMuted'}
                      style={styles.presetLabel}
                    >
                      {preset.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {showCategories ? (
            <View style={styles.section}>
              <AppText variant="h3" style={styles.heading}>
                Category :
              </AppText>
              <View style={styles.categoryList}>
                {FILTER_CATEGORIES.map((category) => {
                  const selected = draft.categories.includes(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => onToggleCategory(category.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={category.label}
                      style={({ pressed }) => [
                        styles.categoryRow,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radii.lg,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selected ? theme.colors.brand : theme.colors.textMuted,
                            backgroundColor: selected ? theme.colors.brand : 'transparent',
                          },
                        ]}
                      >
                        {selected ? (
                          <Ionicons name="checkmark" size={12} color={theme.colors.textOnBrand} />
                        ) : null}
                      </View>
                      <AppText variant="body" color="textSecondary" style={styles.categoryLabel}>
                        {category.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
}

function DateField({
  label,
  value,
  onPress,
}: Readonly<{
  label: string;
  value: Date;
  onPress: () => void;
}>) {
  const theme = useTheme();

  return (
    <View style={styles.dateColumn}>
      <AppText variant="caption" color="textMuted" style={styles.dateLabel}>
        {label}
      </AppText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} date, ${formatDayMonthYear(value)}`}
        accessibilityHint="Opens the calendar"
        style={({ pressed }) => [
          styles.dateField,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.xl,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <AppText variant="body" color="textMuted" style={styles.dateValue}>
          {formatDayMonthYear(value)}
        </AppText>
        <View style={[styles.calendarBtn, { backgroundColor: theme.colors.searchField }]}>
          <DashboardIcon icon={CalendarIcon} size={12} />
        </View>
      </Pressable>
    </View>
  );
}

function MonthCalendar({
  selected,
  onSelect,
  onCancel,
}: Readonly<{
  selected: Date;
  onSelect: (date: Date) => void;
  onCancel: () => void;
}>) {
  const theme = useTheme();
  const [cursor, setCursor] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const leading = new Date(year, month, 1).getDay();
    const total = daysInMonth(year, month);
    const blanks = Array.from({ length: leading }, () => null);
    const days = Array.from({ length: total }, (_, index) => new Date(year, month, index + 1));
    return [...blanks, ...days];
  }, [cursor]);

  const title = cursor.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.calendar} accessibilityLabel="Choose a date">
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Back to filters"
        hitSlop={theme.dimensions.hitSlop}
        style={styles.calendarBack}
      >
        <Ionicons name="chevron-back" size={18} color={theme.colors.brand} />
        <AppText variant="label" color="brand">
          Back
        </AppText>
      </Pressable>
      <View style={styles.calendarHeader}>
        <Pressable
          onPress={() => setCursor((current) => addMonths(current, -1))}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={theme.dimensions.hitSlop}
          style={styles.calendarNav}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <AppText variant="bodyStrong" style={styles.calendarTitle}>
          {title}
        </AppText>
        <Pressable
          onPress={() => setCursor((current) => addMonths(current, 1))}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={theme.dimensions.hitSlop}
          style={styles.calendarNav}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, index) => (
          <AppText
            key={`${day}-${index}`}
            variant="caption"
            color="textMuted"
            style={styles.weekLabel}
          >
            {day}
          </AppText>
        ))}
      </View>

      <View style={styles.dayGrid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          const isSelected = isSameDay(day, selected);
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelect(day)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={formatDayMonthYear(day)}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayInner,
                  isSelected ? { backgroundColor: theme.colors.brand } : null,
                ]}
              >
                <AppText
                  variant="body"
                  color={isSelected ? 'textOnBrand' : 'text'}
                  style={styles.dayLabel}
                >
                  {String(day.getDate())}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
