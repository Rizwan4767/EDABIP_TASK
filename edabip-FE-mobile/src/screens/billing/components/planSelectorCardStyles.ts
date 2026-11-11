import { StyleSheet, type ViewStyle } from 'react-native';

export function plansWrapFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const planSelectorCardStyles = StyleSheet.create({
  wrap: { borderRadius: 8, borderWidth: 1, borderColor: '#CFC9C9', padding: 12, gap: 16 },
  titleBar: {
    backgroundColor: '#134B4A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  list: { gap: 16 },
  card: {
    borderRadius: 12,
    padding: 12,
    gap: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardActive: { backgroundColor: '#134B4A' },
  cardIdle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFC9C9',
  },
  glow: {
    position: 'absolute',
    top: -32,
    right: 12,
    width: 144,
    height: 137,
  },
  name: { fontSize: 20, lineHeight: 28 },
  description: { fontSize: 14, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 36, lineHeight: 43 },
  cadence: { fontSize: 16, lineHeight: 22 },
  features: { gap: 14 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureLabel: { flex: 1, fontSize: 16, lineHeight: 22 },
  actions: { gap: 10 },
  cta: {
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaActive: { backgroundColor: '#3E9593' },
  ctaIdle: { backgroundColor: '#134B4A' },
  ctaOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  ctaLabel: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
});
