import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { MastercardIcon, RadioIdleIcon, RadioSelectedIcon, VisaIcon } from '@/assets/billing';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { BillingPaymentMethod } from '@/screens/billing/billingData';
import {
  chartCardFill,
  paymentMethodCardStyles as styles,
} from '@/screens/billing/components/paymentMethodCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const PREVIEW_COUNT = 2;

function brandLabel(method: BillingPaymentMethod): string {
  if (method.label) return method.label;
  return method.brand === 'visa'
    ? `VISA ending in ${method.last4}`
    : `Mastercard ending in ${method.last4}`;
}

export function PaymentMethodCard({
  methods,
  selectedId,
  expanded,
  isAdding = false,
  onToggleExpanded,
  onSelect,
  onAdd,
  onRemove,
}: Readonly<{
  methods: BillingPaymentMethod[];
  selectedId: string;
  expanded: boolean;
  isAdding?: boolean;
  onToggleExpanded: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove?: (id: string) => void;
}>) {
  const theme = useTheme();

  const visible = expanded ? methods : methods.slice(0, PREVIEW_COUNT);
  const canExpand = methods.length > PREVIEW_COUNT;

  const confirmRemove = (method: BillingPaymentMethod) => {
    if (!onRemove) return;
    Alert.alert('Remove card', `Remove ${brandLabel(method)} from this account?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onRemove(method.id),
      },
    ]);
  };

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, '#CFC9C9')]}
      accessibilityLabel="Payment method"
    >
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Payment Method
        </AppText>
        {canExpand ? (
          <Pressable
            onPress={onToggleExpanded}
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? 'Show fewer payment methods' : 'View all payment methods'
            }
          >
            <AppText variant="caption" style={styles.viewAll}>
              {expanded ? 'Show less' : 'View all'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {visible.length === 0 ? (
          <AppText variant="caption" style={styles.expiry}>
            No payment methods yet. Add a card to subscribe.
          </AppText>
        ) : null}
        {visible.map((method) => {
          const selected = method.id === selectedId;
          return (
            <Pressable
              key={method.id}
              onPress={() => onSelect(method.id)}
              onLongPress={() => confirmRemove(method)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={brandLabel(method)}
              style={styles.row}
            >
              <DashboardIcon icon={selected ? RadioSelectedIcon : RadioIdleIcon} size={16} />
              <View style={styles.copy}>
                <View style={styles.labelRow}>
                  <DashboardIcon
                    icon={method.brand === 'visa' ? VisaIcon : MastercardIcon}
                    width={32}
                    height={17}
                  />
                  <AppText variant="bodyStrong" style={styles.label} numberOfLines={1}>
                    {brandLabel(method)}
                  </AppText>
                </View>
                <AppText variant="caption" style={styles.expiry}>
                  {method.isChargeable === false
                    ? `${method.expiry} · Not chargeable`
                    : method.expiry}
                </AppText>
              </View>
              {method.isPrimary ? (
                <View style={styles.primary}>
                  <AppText variant="overline" style={styles.primaryLabel}>
                    Primary
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onAdd}
        disabled={isAdding}
        accessibilityRole="button"
        accessibilityLabel="Add new payment method"
        accessibilityState={{ busy: isAdding, disabled: isAdding }}
        style={styles.addButton}
      >
        {isAdding ? (
          <ActivityIndicator color={theme.colors.brand} />
        ) : (
          <AppText variant="button" style={styles.addLabel}>
            + Add New Payment Method
          </AppText>
        )}
      </Pressable>
    </View>
  );
}
