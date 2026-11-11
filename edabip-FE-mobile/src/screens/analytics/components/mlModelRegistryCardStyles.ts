import { StyleSheet, type ViewStyle } from 'react-native';

import type { ModelStatus } from '@/screens/analytics/analyticsData';

export function registryCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const mlModelRegistryCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllLabel: { fontSize: 10, lineHeight: 13, color: '#000' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CFC9C9',
    borderRadius: 2,
    padding: 8,
  },
  nameCol: { flex: 1.2, gap: 4 },
  name: { fontSize: 12, lineHeight: 16, color: '#535353' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  category: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#535353',
  },
  accuracyCol: { flex: 0.8, gap: 4 },
  accuracyLabel: { fontSize: 12, lineHeight: 16, color: '#535353' },
  accuracyValue: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#535353',
  },
  pill: {
    minWidth: 48,
    height: 18,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  pillTraining: { backgroundColor: 'rgba(236,181,196,0.3)', borderColor: '#DD2D30' },
  pillActive: { backgroundColor: '#F2FFF0', borderColor: '#2DA20A' },
  pillPending: { backgroundColor: 'rgba(236,181,196,0.3)', borderColor: '#DD2D30' },
  pillLabel: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },
  empty: { paddingVertical: 12 },
});

export const modelStatusPill: Record<ModelStatus, ViewStyle> = {
  Training: mlModelRegistryCardStyles.pillTraining,
  Active: mlModelRegistryCardStyles.pillActive,
  Pending: mlModelRegistryCardStyles.pillPending,
};
