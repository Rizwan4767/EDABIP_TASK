import { StyleSheet } from 'react-native';

export const recentReportsCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: 10,
  },
  copy: { flex: 1, gap: 2 },
  subtitle: { fontSize: 11, lineHeight: 14, textTransform: 'none', letterSpacing: 0 },
});
