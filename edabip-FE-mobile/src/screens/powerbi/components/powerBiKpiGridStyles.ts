import { StyleSheet, type ViewStyle } from 'react-native';

export function kpiCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const kpiBadgeFill = {
  up: { backgroundColor: '#D7FED9' },
  info: { backgroundColor: '#DBE8FF' },
  down: { backgroundColor: '#FFDCDB' },
} as const;

export const powerBiKpiGridStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 82,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFC9C9',
    padding: 12,
    gap: 12,
  },
  // Figma: 12dp between the icon tile and the metric title.
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  // `flex: 1` (not `width: '100%'`) so the title measures against the space left
  // over after the icon instead of the full row, which is what pushed long
  // titles past the card edge. Figma: Lato SemiBold 16 / 19.
  title: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 19 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  value: { fontSize: 12, lineHeight: 16, minWidth: 35 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexShrink: 1,
    minWidth: 0,
  },
  change: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 8,
    lineHeight: 12,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },
  skeleton: { gap: 8 },
});
