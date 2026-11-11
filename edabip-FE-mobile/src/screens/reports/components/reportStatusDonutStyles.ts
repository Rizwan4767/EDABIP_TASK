import { StyleSheet } from 'react-native';

export const reportStatusDonutStyles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    flex: 1,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTotal: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    minWidth: 80,
  },
  ringLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  legend: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  legendCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  legendTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#111827',
  },
  legendPercent: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#111827',
  },
});
