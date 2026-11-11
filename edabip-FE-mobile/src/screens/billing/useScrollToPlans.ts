import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

import { BILLING_PLANS_SECTION } from '@/navigation/routes';

const TOP_GUTTER = 8;

/**
 * Scrolls the billing page to the plan selector when `section=plans`.
 * `focus` is a nonce so a second tap on "Upgrade Your Plan" re-scrolls.
 */
export function useScrollToPlans(section: string | undefined, focus: string | undefined) {
  const scrollRef = useRef<ScrollView>(null);
  const headerHeightRef = useRef(0);
  const plansYInParentRef = useRef(0);
  const headerReadyRef = useRef(false);
  const plansReadyRef = useRef(false);
  const scrolledFocusRef = useRef<string | undefined>(undefined);

  const scrollIfReady = useCallback(() => {
    if (section !== BILLING_PLANS_SECTION || !focus) return;
    if (scrolledFocusRef.current === focus) return;
    if (!headerReadyRef.current || !plansReadyRef.current) return;
    scrolledFocusRef.current = focus;
    const y = headerHeightRef.current + plansYInParentRef.current;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - TOP_GUTTER), animated: true });
    });
  }, [section, focus]);

  useEffect(() => {
    scrollIfReady();
  }, [scrollIfReady]);

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      headerHeightRef.current = event.nativeEvent.layout.height;
      headerReadyRef.current = true;
      scrollIfReady();
    },
    [scrollIfReady],
  );

  const onPlansLayout = useCallback(
    (event: LayoutChangeEvent) => {
      plansYInParentRef.current = event.nativeEvent.layout.y;
      plansReadyRef.current = true;
      scrollIfReady();
    },
    [scrollIfReady],
  );

  return { scrollRef, onHeaderLayout, onPlansLayout };
}
