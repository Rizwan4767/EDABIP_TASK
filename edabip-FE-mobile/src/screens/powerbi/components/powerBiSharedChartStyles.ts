import { StyleSheet, type ViewStyle } from 'react-native';

import { fontFamily } from '@/theme/typography';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

/** Usable width inside the donut ring; centre text must never spill past it. */
export const DONUT_HOLE = 104;

export const powerBiSharedChartStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, lineHeight: 22, fontWeight: '600', color: '#111827', flex: 1 },
  donutBody: { alignItems: 'center', gap: 16 },
  donutSplit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  donut: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  donutCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma properties panel (checked directly on the "240" / "45%" layers):
  // Lato Bold, size 16, line-height 12, letter-spacing -0.26, #000000,
  // centred inside the donut hole (103dp). Line-height is intentionally
  // tighter than the font size in the source file.
  // The family must be named explicitly: RN cannot synthesise a weight for a
  // custom font, so `fontWeight` alone left this rendering at the variant's
  // SemiBold (or worse, Regular on Android) and looked too thin.
  // `fontWeight` is deliberately NOT set alongside the named family: on Android
  // the pair makes RN look for a weighted variant of "Inter_700Bold", misses,
  // and silently falls back to the system regular face — which is why the
  // centre text looked lighter on device than in Figma.
  donutValue: {
    width: DONUT_HOLE,
    alignSelf: 'center',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: -0.26,
    color: '#000000',
    textAlign: 'center',
    flexShrink: 0,
  },
  // Figma: 8-9 / 12, letter spacing -0.26, #000000. Named family for the same
  // reason as above (`variant="caption"` is Regular). Rendered at SemiBold so
  // the caption under the value reads as solid as the Figma frame does.
  donutLabel: {
    width: DONUT_HOLE,
    alignSelf: 'center',
    fontFamily: fontFamily.semibold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: -0.26,
    color: '#000000',
    textAlign: 'center',
    flexShrink: 0,
  },
  legend: { width: '100%', gap: 10 },
  legendTiles: { flex: 1, gap: 10, maxWidth: 130 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  legendName: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, lineHeight: 16, color: '#6B7280' },
  legendValue: { fontSize: 14, lineHeight: 18 },
  legendTile: {
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#FAFBFB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 2,
  },
  legendTileLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  legendTileValue: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 10,
    paddingHorizontal: 4,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barValue: { fontSize: 10, lineHeight: 12, color: '#6B7280' },
  barTrack: {
    width: '70%',
    height: 110,
    justifyContent: 'flex-end',
    backgroundColor: '#F5F7F7',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, lineHeight: 14, color: '#6B7280' },
  healthFilter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthFilterLabel: { fontSize: 12, lineHeight: 14, color: '#6B7280' },
  healthFilterOption: { paddingVertical: 12 },
  healthList: { gap: 8 },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  healthCopy: { flex: 1, gap: 2 },
  healthName: { fontSize: 13, lineHeight: 18 },
  healthMeta: { fontSize: 11, lineHeight: 14 },
  healthBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  healthBadgeHealthy: { backgroundColor: '#E7FEB7' },
  healthBadgeCritical: { backgroundColor: '#FFDCDB' },
  healthBadgeLabel: { fontSize: 11, lineHeight: 14 },
  healthEmpty: { paddingVertical: 16, alignItems: 'center' },
});
