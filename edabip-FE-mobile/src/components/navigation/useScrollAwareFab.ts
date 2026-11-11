import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const DIRECTION_THRESHOLD = 12;
const TOP_REVEAL_Y = 24;

/**
 * Hides a bottom FAB while the user scrolls down the page, and reveals it
 * again when they scroll back up. Small deltas are ignored so bounce and
 * tiny adjustments do not flicker the control.
 */
export function useScrollAwareFab() {
  const lastY = useRef(0);
  const [visible, setVisible] = useState(true);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = y - lastY.current;

    if (y <= TOP_REVEAL_Y) {
      lastY.current = y;
      setVisible(true);
      return;
    }

    if (Math.abs(delta) < DIRECTION_THRESHOLD) return;

    lastY.current = y;
    setVisible(delta < 0);
  }, []);

  return { visible, onScroll };
}
