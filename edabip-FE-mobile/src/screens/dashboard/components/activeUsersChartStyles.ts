import { StyleSheet } from 'react-native';

export const activeUsersChartStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },

  // ── Chart Area Layout ───────────────────────────────────────────────────────
  chartRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // Vertical "Active User Count" label
  yTitleWrapper: {
    width: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    marginRight: 2,
  },
  yTitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    transform: [{ rotate: '-90deg' }],
    width: 140,
    textAlign: 'center',
  },

  // Y-axis ticks column
  yAxisCol: {
    width: 42,
    position: 'relative',
  },
  tickRow: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 16,
    width: '100%',
  },
  tickText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    marginRight: 4,
    textAlign: 'right',
  },
  tickMark: {
    width: 4,
    height: 1,
    backgroundColor: '#9CA3AF',
  },
  verticalAxisLine: {
    position: 'absolute',
    right: 0,
    width: 1,
    backgroundColor: '#9CA3AF',
  },

  // ── Plot Area ───────────────────────────────────────────────────────────────
  plot: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },

  // Dashed horizontal grid line
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderStyle: 'dashed',
  },

  // Baseline at value 0
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#9CA3AF',
  },

  // 7 columns container
  columnsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },

  // Single day column
  col: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    position: 'relative',
  },

  // Value text floating cleanly above the amber tip circle
  valueLabel: {
    position: 'absolute',
    width: 58,
    left: '50%',
    marginLeft: -29,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 13,
    zIndex: 10,
  },

  // Spray stem wrapper
  stemWrapper: {
    position: 'absolute',
    left: '50%',
    marginLeft: -9,
    width: 18,
    alignItems: 'center',
    zIndex: 2,
  },

  // Amber circle at top of bar
  tipCircle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DB9648',
    shadowColor: '#DB9648',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.65,
    shadowRadius: 5,
    elevation: 4,
    // @ts-ignore
    boxShadow: '0px 2px 8px rgba(219, 150, 72, 0.65)',
    zIndex: 4,
  },

  // Small open circle at baseline
  baseCircle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#134B4A',
    zIndex: 3,
  },

  // Day label container below baseline
  dayLabelWrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -20,
    width: 40,
    alignItems: 'center',
  },

  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // "Days" centered under the day names
  xTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Bottom Stats ────────────────────────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#D1D5DB',
    marginTop: 14,
    paddingTop: 12,
    paddingHorizontal: 0,
  },

  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 1,
    minWidth: 0,
  },

  statTextCol: {
    flex: 1,
    marginLeft: 3,
    justifyContent: 'center',
    minWidth: 0,
  },

  statLabel: {
    fontSize: 7.5,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 10,
    marginBottom: 1,
  },

  statValue: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 11,
  },

  statValueGreen: {
    color: '#16A34A',
  },

  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
});
