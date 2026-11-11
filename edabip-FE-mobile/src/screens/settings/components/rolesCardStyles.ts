import { StyleSheet } from 'react-native';

export const rolesCardStyles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingBottom: 10,
    marginBottom: -1,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#134B4A' },
  tabLabel: { fontSize: 14, lineHeight: 20, color: '#6B7280', fontWeight: '600' },
  tabLabelActive: { color: '#134B4A' },
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECEC',
    padding: 16,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { flex: 1, fontSize: 18, lineHeight: 24, color: '#111111' },
  kebab: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: 13, lineHeight: 18, color: '#6B7280' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D7FED9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: { fontSize: 12, lineHeight: 16, color: '#111111' },
  menuItem: { paddingVertical: 12 },
});
