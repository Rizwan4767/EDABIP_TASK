import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { getPasswordRules } from '@/utils/validation';

export interface PasswordRulesProps {
  password: string;
  visible?: boolean;
}

/** Live checklist mirroring the backend password policy. */
export function PasswordRules({ password, visible = true }: Readonly<PasswordRulesProps>) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container} accessibilityLabel="Password requirements">
      {getPasswordRules(password).map((rule) => (
        <View key={rule.id} style={styles.row}>
          <Ionicons
            name={rule.passed ? 'checkmark-circle' : 'ellipse-outline'}
            size={theme.dimensions.icon.sm}
            color={rule.passed ? theme.colors.success : theme.colors.textMuted}
          />
          <AppText variant="caption" color={rule.passed ? 'success' : 'textMuted'}>
            {rule.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginTop: -4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
