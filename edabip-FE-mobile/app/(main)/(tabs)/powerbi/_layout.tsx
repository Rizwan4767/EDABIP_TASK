import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

/**
 * Power BI tab stack: the report list is the default screen; each report card
 * pushes the matching analytics page while the shared tab bar stays put.
 */
export default function PowerBiLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
