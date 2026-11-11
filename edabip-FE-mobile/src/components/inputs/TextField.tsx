import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Validation message. Its presence puts the field in the error state. */
  error?: string | null;
  helperText?: string;
  /** Renders a show/hide toggle and starts masked. */
  isPassword?: boolean;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, Readonly<TextFieldProps>>(function TextField(
  { label, error, helperText, isPassword = false, required = false, containerStyle, ...rest },
  ref,
) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isMasked, setIsMasked] = useState(isPassword);

  const hasError = Boolean(error);
  let borderColor = theme.colors.border;
  if (hasError) {
    borderColor = theme.colors.danger;
  } else if (isFocused) {
    borderColor = theme.colors.focusRing;
  }

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
          {required ? (
            <AppText variant="label" color="danger">
              {' *'}
            </AppText>
          ) : null}
        </AppText>
      ) : null}

      <View
        style={[
          styles.field,
          {
            height: theme.dimensions.control.heightLg,
            borderRadius: theme.radii.md,
            borderColor,
            backgroundColor: theme.colors.surface,
            borderWidth: isFocused || hasError ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={isMasked}
          onFocus={(event) => {
            setIsFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            rest.onBlur?.(event);
          }}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, theme.typography.textVariants.body, { color: theme.colors.text }]}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setIsMasked((masked) => !masked)}
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={isMasked ? 'Show password' : 'Hide password'}
            style={styles.adornment}
          >
            <Ionicons
              name={isMasked ? 'eye-outline' : 'eye-off-outline'}
              size={theme.dimensions.icon.md}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" color="danger" style={styles.message}>
          {error}
        </AppText>
      ) : null}
      {!error && helperText ? (
        <AppText variant="caption" color="textMuted" style={styles.message}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 0 },
  adornment: { paddingLeft: 8 },
  message: { marginTop: 6 },
});
