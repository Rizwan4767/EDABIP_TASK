import { StyleSheet } from 'react-native';

export const productInsightsCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    padding: 8,
  },
  copy: { flex: 1, gap: 2 },
  when: { fontSize: 8, lineHeight: 10, textTransform: 'none', letterSpacing: 0 },
});
