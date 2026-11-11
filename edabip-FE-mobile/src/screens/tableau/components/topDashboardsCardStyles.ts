import { StyleSheet, type ViewStyle } from 'react-native';

import type { TableauCategoryTone } from '@/screens/tableau/tableauData';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const categoryPillFill: Record<TableauCategoryTone, ViewStyle> = {
  executive: { backgroundColor: '#EFF6FF', borderColor: '#458CEF' },
  sales: { backgroundColor: '#ECFEFF', borderColor: '#06DBE8' },
  finance: { backgroundColor: '#F0FDF4', borderColor: '#2DA20A' },
  customer: { backgroundColor: '#FDF2F8', borderColor: '#DD2D30' },
  operations: { backgroundColor: '#F0FDF4', borderColor: '#2DA20A' },
};

export const topDashboardsCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    backgroundColor: '#F5F5F5',
  },
  input: { flex: 1, fontSize: 13, paddingVertical: 6, backgroundColor: 'transparent' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CFC9C9',
    borderRadius: 4,
    padding: 10,
  },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 13, lineHeight: 17 },
  meta: { fontSize: 9, lineHeight: 12, textTransform: 'none', letterSpacing: 0 },
  pill: {
    minWidth: 72,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pillLabel: {
    fontSize: 9,
    lineHeight: 11,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#111',
  },
  filterOption: { paddingVertical: 12 },
});
