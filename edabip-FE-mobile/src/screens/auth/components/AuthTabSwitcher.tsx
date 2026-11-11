import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { authTabSwitcherStyles as styles } from '@/screens/auth/components/authTabSwitcherStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';

export type AuthTab = 'signup' | 'login';

export interface AuthTabSwitcherProps {
  active: AuthTab;
  onSignupPress?: () => void;
  onLoginPress: () => void;
}

/** Pill Sign up / Log in switcher from the Figma mobile auth design. */
export function AuthTabSwitcher({
  active,
  onSignupPress,
  onLoginPress,
}: Readonly<AuthTabSwitcherProps>) {
  const { tabHeight, fontSize, isSmall } = useAuthSignupLayout();

  return (
    <View style={[styles.container, { height: tabHeight }]} accessibilityRole="tablist">
      {active === 'signup' ? (
        <View style={[styles.activePill, styles.activePillSignup]} accessibilityElementsHidden />
      ) : (
        <View style={[styles.activePill, styles.activePillLogin]} accessibilityElementsHidden />
      )}

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'signup' }}
        onPress={onSignupPress}
        disabled={active === 'signup' || !onSignupPress}
        style={styles.tab}
      >
        <AppText
          style={[
            styles.tabText,
            { fontSize },
            active === 'signup' ? styles.tabTextActive : styles.tabTextLogin,
          ]}
        >
          Sign up
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'login' }}
        onPress={onLoginPress}
        disabled={active === 'login'}
        style={styles.tab}
      >
        <AppText
          style={[
            styles.tabText,
            { fontSize: isSmall ? 13 : 14 },
            active === 'login' ? styles.tabTextActive : styles.tabTextLogin,
          ]}
        >
          Log in
        </AppText>
      </Pressable>
    </View>
  );
}
