import { StyleSheet } from 'react-native';

export const powerBiAnalyticsTabsStyles = StyleSheet.create({
  row: { marginHorizontal: -16, paddingHorizontal: 16 },
  content: { gap: 12, paddingRight: 16 },
  tab: {
    height: 26,
    borderRadius: 100,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  tabActive: {
    backgroundColor: '#3E9593',
    borderColor: '#3E9593',
  },
  label: { fontSize: 12, lineHeight: 14, color: '#FFFFFF' },
});
