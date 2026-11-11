import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { deactivatePlanModalStyles as styles } from '@/screens/billing/components/deactivatePlanModalStyles';

export const DEACTIVATE_COMMENT_MIN_WORDS = 50;
/** Headroom for ~200 words plus extra explanation. */
export const DEACTIVATE_COMMENT_MAX_LENGTH = 4000;

const COPY =
  'Are you sure you want to deactivate your plan? Your plan will be temporarily deactivated, and you can reactivate it anytime.';

export function countCommentWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function DeactivatePlanModal({
  visible,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Readonly<{
  visible: boolean;
  isSubmitting?: boolean;
  onConfirm: (comment: string) => Promise<void> | void;
  onCancel: () => void;
}>) {
  const theme = useTheme();
  const [comment, setComment] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = countCommentWords(comment);
  const hasMinWords = wordCount >= DEACTIVATE_COMMENT_MIN_WORDS;
  const canSubmit = hasMinWords && !isSubmitting;

  const clearForm = () => {
    setComment('');
    setFocused(false);
    setError(null);
  };

  const close = () => {
    if (isSubmitting) return;
    clearForm();
    onCancel();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await onConfirm(comment.trim());
      clearForm();
    } catch {
      setError('Unable to deactivate your plan right now. Try again.');
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      dismissOnBackdropPress={!isSubmitting}
      footer={
        <View style={styles.actions}>
          <Pressable
            onPress={close}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            accessibilityState={{ disabled: isSubmitting }}
            style={({ pressed }) => [
              styles.action,
              styles.cancel,
              { opacity: isSubmitting ? 0.6 : pressed ? 0.88 : 1 },
            ]}
          >
            <AppText variant="button" style={[styles.actionLabel, styles.cancelLabel]}>
              Cancel
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => {
              void submit();
            }}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Deactivate"
            accessibilityHint={
              hasMinWords
                ? 'Temporarily deactivates your current plan'
                : `Enter at least ${DEACTIVATE_COMMENT_MIN_WORDS} words to enable`
            }
            accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
            style={({ pressed }) => [
              styles.action,
              canSubmit ? styles.confirm : styles.confirmDisabled,
              { opacity: canSubmit && pressed ? 0.9 : 1 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AppText
                variant="button"
                style={[
                  styles.actionLabel,
                  canSubmit ? styles.confirmLabel : styles.confirmDisabledLabel,
                ]}
              >
                Deactivate
              </AppText>
            )}
          </Pressable>
        </View>
      }
    >
      <View style={styles.copy}>
        <AppText variant="h2" style={styles.title}>
          Deactivate Plan
        </AppText>
        {focused ? null : (
          <AppText variant="body" style={styles.message}>
            {COPY}
          </AppText>
        )}
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Add comments"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        textAlignVertical="top"
        scrollEnabled
        maxLength={DEACTIVATE_COMMENT_MAX_LENGTH}
        editable={!isSubmitting}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Comments"
        accessibilityHint={`Required. Enter at least ${DEACTIVATE_COMMENT_MIN_WORDS} words.`}
        style={[
          theme.typography.textVariants.body,
          styles.comments,
          focused ? styles.commentsFocused : null,
        ]}
      />
      <AppText
        variant="caption"
        color={hasMinWords ? 'success' : 'textMuted'}
        style={styles.counter}
        accessibilityLiveRegion="polite"
      >
        {wordCount} / {DEACTIVATE_COMMENT_MIN_WORDS} words
      </AppText>
      {error ? (
        <AppText variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </BottomSheet>
  );
}
