import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { incompleteProfileSheetStyles as styles } from '@/screens/profile-completion/incompleteProfileSheetStyles';

export function IncompleteProfileSheet({
  visible,
  onDismiss,
  onCompleteProfile,
}: Readonly<{
  visible: boolean;
  onDismiss: () => void;
  onCompleteProfile: () => void;
}>) {
  const theme = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onDismiss}
      footer={
        <View style={styles.actions}>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Remind me later"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                borderColor: theme.colors.brand,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.pill,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <AppText variant="button" color="brand" style={styles.actionLabel}>
              Remind Me Later
            </AppText>
          </Pressable>
          <Pressable
            onPress={onCompleteProfile}
            accessibilityRole="button"
            accessibilityLabel="Complete profile"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                borderColor: theme.colors.brand,
                backgroundColor: theme.colors.brand,
                borderRadius: theme.radii.pill,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <AppText variant="button" color="textOnBrand" style={styles.actionLabel}>
              Complete Profile
            </AppText>
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.copy}>
          <AppText variant="h2" style={styles.title}>
            Update Your Full Profile
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            Complete your profile to get a more personalized experience.
          </AppText>
        </View>

        <View
          style={[
            styles.alert,
            {
              backgroundColor: theme.colors.surfaceSunken,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <View style={styles.alertIcon} importantForAccessibility="no">
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.text} />
          </View>
          <View style={styles.alertCopy}>
            <AppText variant="bodyStrong" style={styles.alertTitle}>
              Your profile is incomplete
            </AppText>
            <AppText variant="caption" color="textSecondary" style={styles.alertBody}>
              Add your remaining details to keep your profile up to date and get relevant insights,
              notifications, and resources.
            </AppText>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
