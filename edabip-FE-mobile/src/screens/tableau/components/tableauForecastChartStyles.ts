import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const forecastChartLayout = {
  max: 100000,
  yTicks: [100000, 75000, 50000, 25000, 0] as number[],
  plotHeight: 220,
  xLabelHeight: 18,
  pad: { top: 18, right: 8, bottom: 6, left: 4 },
  axisColor: '#9CA3AF',
  gridColor: '#E5E7EB',
  thisMonthColor: '#04BFDA',
  lastMonthColor: '#FFA84A',
  barWidth: 6,
  pairGap: 4,
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function forecastCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function forecastYLabelOffset(y: number): TextStyle {
  return { top: y - 5 };
}

export function forecastValueOffset(centerX: number, y: number): TextStyle {
  return { left: centerX - 12, top: y - 13 };
}

export function forecastXLabelOffset(centerX: number): TextStyle {
  return { left: centerX - 14 };
}

export const tableauForecastChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  heading: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yLabelCol: {
    width: 34,
    height: forecastChartLayout.plotHeight,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    right: 4,
    width: 30,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'right',
  },
  plot: { flex: 1 },
  canvas: {
    position: 'relative',
    height: forecastChartLayout.plotHeight + forecastChartLayout.xLabelHeight,
    overflow: 'visible',
  },
  value: {
    position: 'absolute',
    width: 24,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    textTransform: 'none',
    letterSpacing: 0,
    color: '#111827',
    textAlign: 'center',
  },
  xLabel: {
    position: 'absolute',
    top: forecastChartLayout.plotHeight,
    width: 28,
    fontSize: 9,
    lineHeight: 12,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  legendLabel: { fontSize: 12, lineHeight: 16, color: '#6B7280' },
});
