import { StyleSheet, type ViewStyle } from 'react-native';

import type { KpiTrendTone } from '@/screens/analytics/analyticsData';

export function kpiCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const analyticsHeaderStyles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 82,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFC9C9',
    padding: 12,
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, lineHeight: 18 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 12, lineHeight: 16, minWidth: 36 },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 2,
    padding: 3,
    flex: 1,
    maxWidth: 108,
  },
  trendFillSuccess: { backgroundColor: '#D7FED9' },
  trendFillDanger: { backgroundColor: '#FFDCDB' },
  trendFillInfo: { backgroundColor: '#DBE8FF' },
  trendDown: { transform: [{ rotate: '90deg' }] },
  trendLabel: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
    flexShrink: 1,
  },
  skeleton: { gap: 8 },
});

export const kpiTrendFill: Record<KpiTrendTone, ViewStyle> = {
  success: analyticsHeaderStyles.trendFillSuccess,
  danger: analyticsHeaderStyles.trendFillDanger,
  info: analyticsHeaderStyles.trendFillInfo,
};
