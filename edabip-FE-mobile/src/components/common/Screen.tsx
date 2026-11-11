import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export interface ScreenProps {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for screens that own their own list. */
  scrollable?: boolean;
  /** Lifts content above the keyboard. On by default for form screens. */
  keyboardAvoiding?: boolean;
  /** Applies the standard horizontal gutter. */
  padded?: boolean;
  edges?: readonly Edge[];
  /** Pinned below the scroll area — for primary actions on form screens. */
  footer?: ReactNode;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The layout primitive every screen sits inside: safe-area insets, themed
 * background, status-bar style, optional scrolling, and keyboard avoidance.
 */
export function Screen({
  children,
  scrollable = false,
  keyboardAvoiding = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  footer,
  refreshControl,
  contentContainerStyle,
  style,
  testID,
}: Readonly<ScreenProps>) {
  const theme = useTheme();

  const paddingStyle: ViewStyle | null = padded
    ? { paddingHorizontal: theme.dimensions.screenGutter }
    : null;

  const body = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, paddingStyle, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, paddingStyle, contentContainerStyle]}>{children}</View>
  );

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView
      edges={edges}
      testID={testID}
      style={[styles.flex, { backgroundColor: theme.colors.background }, style]}
    >
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      {content}
      {footer ? (
        <View style={[styles.footer, paddingStyle, { borderTopColor: theme.colors.border }]}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  footer: { paddingTop: 12, paddingBottom: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
