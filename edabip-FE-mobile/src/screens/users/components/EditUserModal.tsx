import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfoIcon } from '@/assets/users';
import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { TextField } from '@/components/inputs/TextField';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { ASSIGNABLE_ROLES, type ManagedUser } from '@/screens/users/usersData';
import { userFormModalStyles as styles } from '@/screens/users/components/userFormModalStyles';

export function EditUserModal({
  visible,
  user,
  onClose,
  onSave,
}: {
  visible: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSave: (role: string) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [roleOverride, setRoleOverride] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const nextRole = roleOverride ?? user?.role ?? 'User';

  const close = () => {
    setRoleOverride(null);
    setError('');
    setPickerOpen(false);
    onClose();
  };

  const submit = () => {
    if (!nextRole) {
      setError('Select a role to assign.');
      return;
    }
    if (nextRole === user?.role) {
      setError('Choose a different role to update.');
      return;
    }
    onSave(nextRole);
    setRoleOverride(null);
    setError('');
    setPickerOpen(false);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <KeyboardAvoidingView
          style={styles.centered}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <View
            accessibilityViewIsModal
            accessibilityLabel="Update User Role"
            style={[styles.card, theme.shadows.lg, { marginBottom: Math.max(insets.bottom, 8) }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
            >
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <AppText variant="h2" style={styles.title}>
                    Update User Role
                  </AppText>
                  <AppText variant="body" style={styles.subtitle}>
                    Change the role assigned to this user.
                  </AppText>
                </View>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                  hitSlop={theme.dimensions.hitSlop}
                  style={styles.close}
                >
                  <Ionicons name="close" size={22} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.alert}>
                <DashboardIcon icon={InfoIcon} size={20} />
                <AppText variant="caption" style={styles.alertCopy}>
                  Updating the role will modify the user&apos;s access permissions and features
                  availability.
                </AppText>
              </View>

              <TextField label="Current User Role" value={user?.role ?? ''} editable={false} />

              <View>
                <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>
                  Update User Role *
                </AppText>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select a role"
                  style={styles.picker}
                >
                  <AppText variant="body">{nextRole}</AppText>
                </Pressable>
              </View>

              {error ? (
                <AppText variant="caption" style={styles.error}>
                  {error}
                </AppText>
              ) : null}

              <View style={styles.actions}>
                <Button label="Update Role" onPress={submit} />
                <Button label="Cancel" onPress={close} variant="outline" />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Select role">
        {ASSIGNABLE_ROLES.map((role) => (
          <Pressable
            key={role}
            onPress={() => {
              setRoleOverride(role);
              setError('');
              setPickerOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: nextRole === role }}
            style={styles.option}
          >
            <AppText
              variant={nextRole === role ? 'bodyStrong' : 'body'}
              color={nextRole === role ? 'brand' : 'text'}
            >
              {role}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}
