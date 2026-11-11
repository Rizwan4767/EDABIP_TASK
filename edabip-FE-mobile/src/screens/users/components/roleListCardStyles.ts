import { StyleSheet, type ViewStyle } from 'react-native';

export function listCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const roleListCardStyles = StyleSheet.create({
  card: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 16, lineHeight: 20, color: '#000' },
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
  status: {
    height: 16,
    minWidth: 57,
    borderRadius: 13,
    borderWidth: 0.23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  statusActive: { backgroundColor: '#E7FEB7', borderColor: '#2DA20A' },
  statusInactive: { backgroundColor: '#F9E9ED', borderColor: '#DD2D30' },
  statusLabel: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, height: 32, borderRadius: 4 },
  empty: { paddingVertical: 12 },
});
