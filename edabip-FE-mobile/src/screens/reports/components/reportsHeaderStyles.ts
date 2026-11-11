import { StyleSheet, type ViewStyle } from 'react-native';

export function kpiCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const reportsHeaderStyles = StyleSheet.create({
  kpiGrid: { gap: 16 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  card: {
    height: 85,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFC9C9',
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    shadowColor: '#6434FB',
    shadowOffset: { width: 1.5, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 9,
    elevation: 2,
  },
  totalReportsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  totalReportsLeft: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  totalReportsMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalReportsGlyph: {
    width: 145,
    maxWidth: '45%',
    height: 42,
    alignSelf: 'center',
  },
  halfCard: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#000000',
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  valueCol: {
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 28,
  },
  value: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0,
    color: '#000000',
    flexShrink: 0,
    minWidth: 22,
  },
  cardSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6E7179',
    marginTop: 1,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexShrink: 1,
  },
  trendFillSuccess: { backgroundColor: '#D7FED9' },
  trendFillDanger: { backgroundColor: '#FFDCDB' },
  trendFillInfo: { backgroundColor: '#DBE8FF' },
  trendDown: { transform: [{ rotate: '90deg' }] },
  trendLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000000',
  },
  skeleton: { gap: 6 },
  glyphSkeleton: {
    width: 155,
    maxWidth: '48%',
    height: 42,
    borderRadius: 4,
  },
});

export const kpiTrendFill = {
  success: reportsHeaderStyles.trendFillSuccess,
  danger: reportsHeaderStyles.trendFillDanger,
  info: reportsHeaderStyles.trendFillInfo,
};
