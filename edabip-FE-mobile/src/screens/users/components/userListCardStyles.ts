import { StyleSheet, type ViewStyle } from 'react-native';

export function listCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const userListCardStyles = StyleSheet.create({
  card: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 16, lineHeight: 20, color: '#000' },
  addButton: {
    height: 28,
    width: 113,
    borderRadius: 4,
    backgroundColor: '#134B4A',
    paddingHorizontal: 6,
  },
  chevron: { transform: [{ rotate: '180deg' }] },
  chevronCollapsed: { transform: [{ rotate: '0deg' }] },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.19)',
    borderRadius: 6,
    paddingHorizontal: 12,
    minHeight: 34,
  },
  input: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  list: { gap: 16 },
  row: {
    borderWidth: 0.5,
    borderColor: '#CFC9C9',
    borderRadius: 2,
    padding: 12,
    gap: 12,
  },
  fields: { gap: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  field: { flex: 1, gap: 4, minWidth: 0 },
  fieldFixed: { width: 96, gap: 4 },
  fieldLabel: { fontSize: 10, lineHeight: 13, color: '#535353' },
  fieldValue: { fontSize: 12, lineHeight: 16, color: '#535353' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, height: 32, borderRadius: 4 },
  empty: { paddingVertical: 12 },
});
