import { StyleSheet, type ViewStyle } from 'react-native';

export function surfaceFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const analyticsScreenStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 24 },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
});
