import { StyleSheet } from 'react-native';

/** Space reserved at the end of scroll content so the legal footer can pass under the FAB. */
export const GO_TO_DASHBOARD_FAB_SCROLL_PADDING = 88;

export const goToDashboardFabStyles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 10,
  },
  icon: { width: 22, height: 22 },
  label: {
    fontSize: 16,
    lineHeight: 22,
  },
});
