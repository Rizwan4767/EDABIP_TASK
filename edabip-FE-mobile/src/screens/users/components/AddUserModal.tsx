import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfoIcon } from '@/assets/users';
import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { TextField } from '@/components/inputs/TextField';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { userFormModalStyles as styles } from '@/screens/users/components/userFormModalStyles';
import { isValidEmail } from '@/utils/validation';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'User',
};

export function AddUserModal({
  visible,
  emailTaken,
  onClose,
  onSave,
}: {
  visible: boolean;
  emailTaken: (email: string) => boolean;
  onClose: () => void;
  onSave: (input: { firstName: string; lastName: string; email: string; role: string }) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const close = () => {
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  };

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName || !lastName || !email) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (emailTaken(email)) {
      setError('A user with this email already exists.');
      return;
    }
    onSave({ firstName, lastName, email, role: form.role });
    setForm(EMPTY_FORM);
    setError('');
  };

  return (
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
          accessibilityLabel="Add User"
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
                  Add User
                </AppText>
                <AppText variant="body" style={styles.subtitle}>
                  Create a new user and assign access permissions.
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
                Fill in the details below to create a new user. You can configure permissions after
                creation.
              </AppText>
            </View>

            <TextField
              label="First Name"
              value={form.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              placeholder="Enter first name"
              autoComplete="given-name"
              textContentType="givenName"
            />
            <TextField
              label="Last Name"
              value={form.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              placeholder="Enter last name"
              autoComplete="family-name"
              textContentType="familyName"
            />
            <TextField
              label="Email Address"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="Enter email address"
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />

            <View>
              <AppText variant="label" color="textSecondary" style={{ marginBottom: 6 }}>
                Role
              </AppText>
              <View style={styles.locked} accessibilityLabel="Assigned role">
                <AppText variant="body">{form.role}</AppText>
              </View>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                This role is assigned automatically. You can update it after the user is created.
              </AppText>
            </View>

            {error ? (
              <AppText variant="caption" style={styles.error}>
                {error}
              </AppText>
            ) : null}

            <View style={styles.actions}>
              <Button label="Add User" onPress={submit} />
              <Button label="Cancel" onPress={close} variant="outline" />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
