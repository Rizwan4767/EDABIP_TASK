import { useRootNavigationState } from 'expo-router';

/** True once the root navigator has mounted — safe to call `Redirect` / `router.replace`. */
export function useNavigationReady(): boolean {
  return Boolean(useRootNavigationState()?.key);
}
