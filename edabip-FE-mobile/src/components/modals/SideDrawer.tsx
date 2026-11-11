import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  /** Called when a left-edge swipe opens the drawer. */
  onOpen?: () => void;
  children: ReactNode;
  /** Tapping the scrim dismisses by default. */
  dismissOnBackdropPress?: boolean;
  accessibilityLabel?: string;
}

const OPEN_MS = 240;
const WIDTH_RATIO = 0.86;
const MAX_WIDTH = 328;
const EDGE_WIDTH = 28;
const OPEN_VELOCITY = 500;
const CLOSE_VELOCITY = -500;
const SNAP_PROGRESS = 0.42;

function clampDrawerX(value: number, drawerWidth: number) {
  'worklet';
  return Math.min(0, Math.max(-drawerWidth, value));
}

/**
 * Left-edge mobile sheet. Wider than a desktop rail, with rounded trailing
 * corners so it reads as a phone menu rather than an admin sidebar.
 *
 * Swipe right from the left edge to open; swipe left (or tap the scrim / close
 * control) to close.
 */
export function SideDrawer({
  visible,
  onClose,
  onOpen,
  children,
  dismissOnBackdropPress = true,
  accessibilityLabel = 'Navigation menu',
}: Readonly<SideDrawerProps>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min(MAX_WIDTH, Math.round(windowWidth * WIDTH_RATIO));
  const translateX = useSharedValue(visible ? 0 : -drawerWidth);
  const dragStartX = useSharedValue(visible ? 0 : -drawerWidth);

  const notifyOpen = () => {
    onOpen?.();
  };
  const notifyClose = () => {
    onClose();
  };

  const openGesture = Gesture.Pan()
    .enabled(Boolean(onOpen) && !visible)
    .activeOffsetX(16)
    .failOffsetY([-24, 24])
    .onBegin(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = clampDrawerX(dragStartX.value + event.translationX, drawerWidth);
    })
    .onEnd((event) => {
      const progress = (translateX.value + drawerWidth) / Math.max(drawerWidth, 1);
      const shouldOpen =
        event.velocityX > OPEN_VELOCITY
          ? true
          : event.velocityX < CLOSE_VELOCITY
            ? false
            : progress >= SNAP_PROGRESS;
      translateX.value = withTiming(
        shouldOpen ? 0 : -drawerWidth,
        { duration: OPEN_MS },
        (finished) => {
          if (!finished) return;
          if (shouldOpen) {
            runOnJS(notifyOpen)();
          } else {
            runOnJS(notifyClose)();
          }
        },
      );
    });

  const closeGesture = Gesture.Pan()
    .enabled(visible)
    .activeOffsetX([-16, 16])
    .failOffsetY([-24, 24])
    .onBegin(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = clampDrawerX(dragStartX.value + event.translationX, drawerWidth);
    })
    .onEnd((event) => {
      const progress = (translateX.value + drawerWidth) / Math.max(drawerWidth, 1);
      const shouldOpen =
        event.velocityX > OPEN_VELOCITY
          ? true
          : event.velocityX < CLOSE_VELOCITY
            ? false
            : progress >= SNAP_PROGRESS;
      translateX.value = withTiming(
        shouldOpen ? 0 : -drawerWidth,
        { duration: OPEN_MS },
        (finished) => {
          if (!finished) return;
          if (shouldOpen) {
            runOnJS(notifyOpen)();
          } else {
            runOnJS(notifyClose)();
          }
        },
      );
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-drawerWidth, 0], [0, 1], Extrapolation.CLAMP),
  }));

  useEffect(() => {
    // Shared values are mutable; this keeps the panel in sync with the hamburger / X.
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    translateX.value = withTiming(visible ? 0 : -drawerWidth, { duration: OPEN_MS });
  }, [visible, drawerWidth, translateX]);

  useEffect(() => {
    if (!visible) return undefined;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const edgeTop = insets.top + theme.dimensions.header.height;

  return (
    <View
      style={styles.overlay}
      pointerEvents="box-none"
      accessibilityViewIsModal={visible}
      accessibilityLabel={visible ? accessibilityLabel : undefined}
    >
      {onOpen ? (
        <GestureDetector gesture={openGesture}>
          <View
            style={[styles.edge, { top: edgeTop, width: EDGE_WIDTH }]}
            accessible={false}
            importantForAccessibility="no"
          />
        </GestureDetector>
      ) : null}

      <GestureDetector gesture={closeGesture}>
        <Animated.View style={styles.sheet} pointerEvents={visible ? 'auto' : 'none'}>
          <Animated.View
            style={[styles.backdrop, { backgroundColor: theme.colors.overlay }, backdropStyle]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={dismissOnBackdropPress ? onClose : undefined}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            />
          </Animated.View>

          <Animated.View
            accessibilityElementsHidden={!visible}
            importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
            pointerEvents={visible ? 'auto' : 'none'}
            style={[
              styles.panel,
              theme.shadows.lg,
              {
                width: drawerWidth,
                paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
                backgroundColor: theme.colors.surface,
                borderTopRightRadius: theme.radii.xxl,
                borderBottomRightRadius: theme.radii.xxl,
              },
              panelStyle,
            ]}
          >
            <View
              style={[
                styles.clip,
                {
                  borderTopRightRadius: theme.radii.xxl,
                  borderBottomRightRadius: theme.radii.xxl,
                },
              ]}
            >
              {children}
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  edge: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 60,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  clip: { flex: 1, overflow: 'hidden' },
});
