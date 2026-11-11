import { StyleSheet } from 'react-native';

export const usersHeaderStyles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, lineHeight: 18 },
  metrics: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  metricBlock: { flex: 1, gap: 4 },
  metricLabel: { fontSize: 8, lineHeight: 10 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  skeleton: { gap: 8 },
});
