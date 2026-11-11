import { StyleSheet } from 'react-native';

export const incompleteProfileSheetStyles = StyleSheet.create({
  body: { gap: 16, paddingTop: 4 },
  copy: { gap: 6, paddingRight: 8 },
  title: { fontSize: 22, lineHeight: 28 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  alertIcon: { marginTop: 1 },
  alertCopy: { flex: 1, gap: 4 },
  alertTitle: { fontSize: 14, lineHeight: 20 },
  alertBody: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  actionLabel: { fontSize: 15, lineHeight: 20 },
});
