import { StyleSheet, type ViewStyle } from 'react-native';

export function sectionCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const settingsSectionCardStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECEC',
    padding: 16,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { flex: 1, gap: 2 },
  title: { fontSize: 16, lineHeight: 20, color: '#111111' },
  description: { fontSize: 13, lineHeight: 18, color: '#6B7280' },
  chevronOpen: { transform: [{ rotate: '180deg' }], marginTop: 4 },
  chevronClosed: { transform: [{ rotate: '0deg' }], marginTop: 4 },
  body: { gap: 16 },
});
