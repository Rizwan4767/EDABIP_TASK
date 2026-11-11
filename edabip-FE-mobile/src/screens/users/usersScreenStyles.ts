import { StyleSheet, type ViewStyle } from 'react-native';

import { GO_TO_DASHBOARD_FAB_SCROLL_PADDING } from '@/components/navigation/goToDashboardFabStyles';

export function surfaceFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const usersScreenStyles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: GO_TO_DASHBOARD_FAB_SCROLL_PADDING },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
});
