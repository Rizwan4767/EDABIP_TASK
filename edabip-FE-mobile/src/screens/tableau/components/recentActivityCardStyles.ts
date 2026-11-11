import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const recentActivityCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CFC9C9',
    borderRadius: 4,
    padding: 8,
  },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 13, lineHeight: 17, color: '#535353' },
  sub: { fontSize: 10, lineHeight: 13, color: '#535353' },
  time: { fontSize: 11, lineHeight: 14, color: '#535353' },
});
