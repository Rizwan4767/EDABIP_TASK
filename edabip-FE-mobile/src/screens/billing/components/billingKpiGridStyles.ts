import { StyleSheet, type ViewStyle } from 'react-native';

export function kpiCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const billingKpiGridStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 85,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFC9C9',
    padding: 12,
    gap: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 14, lineHeight: 18 },
  values: { gap: 6 },
  value: { fontSize: 12, lineHeight: 16 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  badgeSuccess: { backgroundColor: '#D7FED9' },
  badgeDanger: { backgroundColor: '#FFDCDB' },
  badgeLabel: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },
  skeleton: { gap: 8 },
});
