import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfoIcon, MastercardIcon, VisaIcon } from '@/assets/billing';
import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { TextField } from '@/components/inputs/TextField';
import { useTheme } from '@/hooks/useTheme';
import type { BillingPaymentMethod } from '@/screens/billing/billingData';
import { addPaymentMethodModalStyles as styles } from '@/screens/billing/components/addPaymentMethodModalStyles';
import {
  detectCardBrand,
  digitsOnly,
  formatCardNumber,
  formatCvc,
  formatExpiry,
  maskedCardNumber,
  validatePaymentForm,
  type PaymentFormError,
  type PaymentFormValues,
} from '@/screens/billing/paymentCard';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const EMPTY_FORM: PaymentFormValues = {
  name: '',
  number: '',
  expiry: '',
  cvc: '',
  setPrimary: false,
};

const EMPTY_ERROR: PaymentFormError = { message: '', field: '' };

export function AddPaymentMethodModal({
  visible,
  makePrimary = false,
  onClose,
  onSave,
}: Readonly<{
  visible: boolean;
  makePrimary?: boolean;
  onClose: () => void;
  onSave: (method: Omit<BillingPaymentMethod, 'id'>) => void;
}>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<PaymentFormValues>({
    ...EMPTY_FORM,
    setPrimary: makePrimary,
  });
  const [error, setError] = useState<PaymentFormError>(EMPTY_ERROR);

  const digits = digitsOnly(form.number);
  const brand = detectCardBrand(digits);

  const updateField = <K extends keyof PaymentFormValues>(
    field: K,
    value: PaymentFormValues[K],
  ) => {
    setError(EMPTY_ERROR);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    const nextError = validatePaymentForm(form);
    if (nextError.message) {
      setError(nextError);
      return;
    }

    const last4 = digits.slice(-4);
    onSave({
      brand,
      last4,
      expiry: `Expires ${form.expiry}`,
      holderName: form.name.trim(),
      isPrimary: makePrimary || form.setPrimary,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={onClose}
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
          accessibilityLabel="Add Payment Method"
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
                  Add Payment Method
                </AppText>
                <AppText variant="body" style={styles.subtitle}>
                  Add a card to pay invoices and keep your subscription current.
                </AppText>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                hitSlop={theme.dimensions.hitSlop}
                style={styles.close}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.preview} accessible={false}>
              <View pointerEvents="none" style={styles.previewShade} />
              <View style={styles.previewTop}>
                <View style={styles.chip} />
                <DashboardIcon
                  icon={brand === 'mastercard' ? MastercardIcon : VisaIcon}
                  width={46}
                  height={28}
                  color="#FFFFFF"
                />
              </View>
              <AppText variant="bodyStrong" style={styles.previewNumber}>
                {maskedCardNumber(digits)}
              </AppText>
              <View style={styles.previewMeta}>
                <AppText variant="overline" numberOfLines={1} style={styles.previewMetaText}>
                  {form.name.trim() || 'CARDHOLDER NAME'}
                </AppText>
                <AppText variant="overline" style={styles.previewExpiry}>
                  {form.expiry || 'MM/YYYY'}
                </AppText>
              </View>
            </View>

            <View style={styles.alert}>
              <DashboardIcon icon={InfoIcon} size={20} />
              <AppText variant="caption" style={styles.alertCopy}>
                Only the last four digits are saved to your account. The full card number and CVC
                are not stored.
              </AppText>
            </View>

            <TextField
              label="Name on card"
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Name as it appears on the card"
              autoComplete="name"
              textContentType="name"
              error={error.field === 'name' ? error.message : null}
            />

            <TextField
              label="Card number"
              value={form.number}
              onChangeText={(value) => updateField('number', formatCardNumber(value))}
              placeholder="ACCT-000015"
              keyboardType="number-pad"
              autoComplete="cc-number"
              textContentType="creditCardNumber"
              error={error.field === 'number' ? error.message : null}
            />

            <View style={styles.row}>
              <TextField
                label="Expiry date"
                value={form.expiry}
                onChangeText={(value) => updateField('expiry', formatExpiry(value))}
                placeholder="MM/YYYY"
                keyboardType="number-pad"
                autoComplete="cc-exp"
                containerStyle={styles.half}
                error={error.field === 'expiry' ? error.message : null}
              />
              <TextField
                label="CVC"
                value={form.cvc}
                onChangeText={(value) => updateField('cvc', formatCvc(value))}
                placeholder="123"
                keyboardType="number-pad"
                autoComplete="cc-csc"
                maxLength={4}
                containerStyle={styles.half}
                error={error.field === 'cvc' ? error.message : null}
              />
            </View>

            {makePrimary ? null : (
              <Pressable
                onPress={() => updateField('setPrimary', !form.setPrimary)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.setPrimary }}
                accessibilityLabel="Set as primary payment method"
                style={styles.check}
              >
                <Ionicons
                  name={form.setPrimary ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#134B4A"
                />
                <AppText variant="body" style={styles.checkLabel}>
                  Set as primary payment method
                </AppText>
              </Pressable>
            )}

            {error.message && !error.field ? (
              <AppText variant="caption" style={styles.error}>
                {error.message}
              </AppText>
            ) : null}

            <View style={styles.actions}>
              <Button label="Save Card" onPress={submit} />
              <Button label="Cancel" onPress={onClose} variant="outline" />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
