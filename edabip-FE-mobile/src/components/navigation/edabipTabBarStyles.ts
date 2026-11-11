import { StyleSheet } from 'react-native';

export const edabipTabBarStyles = StyleSheet.create({
  shell: { backgroundColor: '#FFFFFF' },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  item: { flex: 1, alignItems: 'center', gap: 4, minHeight: 46 },
  indicator: {
    width: 40,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  indicatorSlot: { width: 40, height: 2, marginBottom: 4 },
  label: { fontSize: 12, lineHeight: 16 },
});
