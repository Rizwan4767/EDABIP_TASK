import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { TextField } from '@/components/inputs/TextField';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import type { ManagedRole, UserRoleStatus } from '@/screens/users/usersData';
import { userFormModalStyles as styles } from '@/screens/users/components/userFormModalStyles';

const STATUSES: UserRoleStatus[] = ['Active', 'Inactive'];

export function EditRoleModal({
  visible,
  role,
  onClose,
  onSave,
}: {
  visible: boolean;
  role: ManagedRole | null;
  onClose: () => void;
  onSave: (patch: { name: string; status: UserRoleStatus; permission: string }) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [statusOverride, setStatusOverride] = useState<UserRoleStatus | null>(null);
  const [permissionOverride, setPermissionOverride] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [error, setError] = useState('');
  const name = nameOverride ?? role?.name ?? '';
  const status = statusOverride ?? role?.status ?? 'Active';
  const permission = permissionOverride ?? role?.permission ?? '';

  const close = () => {
    setNameOverride(null);
    setStatusOverride(null);
    setPermissionOverride(null);
    setError('');
    setStatusOpen(false);
    onClose();
  };

  const submit = () => {
    const nextName = name.trim();
    const nextPermission = permission.trim();
    if (!nextName || !nextPermission) {
      setError('Please fill in all fields.');
      return;
    }
    onSave({ name: nextName, status, permission: nextPermission });
    setNameOverride(null);
    setStatusOverride(null);
    setPermissionOverride(null);
    setError('');
    setStatusOpen(false);
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
            accessibilityLabel="Edit Role"
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
                    Edit Role
                  </AppText>
                  <AppText variant="body" style={styles.subtitle}>
                    Update the role name, status, and module permissions.
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

              <TextField
                label="Role Name"
                value={name}
                onChangeText={(value) => {
                  setError('');
                  setNameOverride(value);
                }}
                placeholder="Enter role name"
              />

              <View>
                <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>
                  Status
                </AppText>
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select status"
                  style={styles.picker}
                >
                  <AppText variant="body">{status}</AppText>
                </Pressable>
              </View>

              <TextField
                label="Permission"
                value={permission}
                onChangeText={(value) => {
                  setError('');
                  setPermissionOverride(value);
                }}
                placeholder="Enter permissions"
              />

              {error ? (
                <AppText variant="caption" style={styles.error}>
                  {error}
                </AppText>
              ) : null}

              <View style={styles.actions}>
                <Button label="Save Role" onPress={submit} />
                <Button label="Cancel" onPress={close} variant="outline" />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomSheet visible={statusOpen} onClose={() => setStatusOpen(false)} title="Select status">
        {STATUSES.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              setStatusOverride(option);
              setStatusOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: status === option }}
            style={styles.option}
          >
            <AppText
              variant={status === option ? 'bodyStrong' : 'body'}
              color={status === option ? 'brand' : 'text'}
            >
              {option}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}
