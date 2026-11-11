import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useTheme } from '@/hooks/useTheme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Pinned actions below the scrollable body. */
  footer?: ReactNode;
  /** Tapping the scrim dismisses by default. */
  dismissOnBackdropPress?: boolean;
}

/**
 * Bottom sheet built on the platform `Modal`.
 *
 * A gesture-driven library (`@gorhom/bottom-sheet`) is deliberately not a
 * dependency yet — nothing in the app needs snap points or drag-to-dismiss.
 * Swap the internals here if that changes; the public props can stay the same.
 *
 * Keyboard: Android dialogs do not resize with IME, so the sheet is padded by
 * the live keyboard height and capped to the remaining viewport. The footer
 * stays pinned above the keys; the body scrolls if it no longer fits.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  dismissOnBackdropPress = true,
}: Readonly<BottomSheetProps>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  const keyboardOpen = keyboardHeight > 0;
  const sheetMaxHeight = keyboardOpen
    ? Math.max(windowHeight - keyboardHeight - 12, 240)
    : windowHeight * 0.85;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={dismissOnBackdropPress ? onClose : undefined}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />

      <View style={[styles.frame, { paddingBottom: keyboardHeight }]} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radii.xxl,
              borderTopRightRadius: theme.radii.xxl,
              maxHeight: sheetMaxHeight,
              paddingBottom: keyboardOpen
                ? theme.spacing.base
                : Math.max(insets.bottom, theme.spacing.base),
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />

          {title ? (
            <View style={styles.header}>
              <AppText variant="h3" style={styles.headerTitle}>
                {title}
              </AppText>
              <Pressable
                onPress={onClose}
                hitSlop={theme.dimensions.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons
                  name="close"
                  size={theme.dimensions.icon.lg}
                  color={theme.colors.textMuted}
                />
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  frame: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerTitle: { flex: 1 },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { paddingBottom: 8, flexGrow: 0 },
  footer: { paddingTop: 12, gap: 8 },
});
