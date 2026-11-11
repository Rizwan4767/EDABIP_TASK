import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm action as destructive. */
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centred confirmation dialog for destructive or irreversible actions. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isPending = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={isPending ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />

      <View style={styles.centered} pointerEvents="box-none">
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl },
            theme.shadows.lg,
          ]}
        >
          <AppText variant="h3">{title}</AppText>
          <AppText variant="body" color="textSecondary">
            {message}
          </AppText>

          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              onPress={onCancel}
              variant="outline"
              disabled={isPending}
              style={styles.action}
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              loading={isPending}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 400, padding: 20, gap: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  action: { flex: 1 },
});
