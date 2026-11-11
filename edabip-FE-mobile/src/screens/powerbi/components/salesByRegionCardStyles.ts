import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function mapDotPos(xPct: number, yPct: number): ViewStyle {
  return {
    position: 'absolute',
    left: `${xPct}%`,
    top: `${yPct}%`,
    marginLeft: -4.5,
    marginTop: -4.5,
  };
}

export function regionBarFill(widthPct: number): ViewStyle {
  return { width: `${widthPct}%` };
}

export const salesByRegionCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  title: { fontSize: 16, lineHeight: 20 },
  mapWrap: {
    alignSelf: 'center',
    width: '72%',
    maxWidth: 220,
    aspectRatio: 366 / 199,
  },
  map: { width: '100%', height: '100%' },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#111111',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  legend: { gap: 16, paddingHorizontal: 8 },
  legendRow: { flexDirection: 'row', gap: 20 },
  legendItem: { flex: 1, gap: 2 },
  legendText: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  city: { fontSize: 12, lineHeight: 20 },
  amount: { fontSize: 12, lineHeight: 20, fontWeight: '700' },
  track: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#D7DEE3',
    overflow: 'hidden',
  },
  fill: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#134B4A',
  },
});
