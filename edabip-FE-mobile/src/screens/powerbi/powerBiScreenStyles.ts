import { StyleSheet, type ViewStyle } from 'react-native';

export function surfaceFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const powerBiScreenStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 16 },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  list: { gap: 16 },
  skeleton: { gap: 16 },
  skeletonCopy: { gap: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backLabel: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
});
