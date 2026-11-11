import { Image, Pressable, View } from 'react-native';

import { PlanCheckActiveIcon, PlanCheckIcon, PlanGlowIcon } from '@/assets/billing';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { BillingPlan } from '@/screens/billing/billingData';
import {
  planSelectorCardStyles as styles,
  plansWrapFill,
} from '@/screens/billing/components/planSelectorCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

export function PlanSelectorCard({
  plans,
  currentPlanId,
  isPlanDeactivated = false,
  isBusy = false,
  isReactivating = false,
  onSelect,
  onDeactivate,
  onReactivate,
}: Readonly<{
  plans: BillingPlan[];
  currentPlanId: string;
  isPlanDeactivated?: boolean;
  isBusy?: boolean;
  isReactivating?: boolean;
  onSelect: (planId: string) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.wrap, plansWrapFill(theme.colors.surface, '#CFC9C9')]}
      accessibilityLabel="Choose a plan"
    >
      <View style={styles.titleBar}>
        <AppText variant="h3" color="textOnBrand" style={styles.title}>
          Choose the Right Plan for Your Business
        </AppText>
      </View>
      <View style={styles.list}>
        {plans.map((plan) => {
          const active = plan.id === currentPlanId;
          return (
            <View key={plan.id} style={[styles.card, active ? styles.cardActive : styles.cardIdle]}>
              {active ? (
                <Image source={PlanGlowIcon} resizeMode="contain" style={styles.glow} />
              ) : null}
              <View>
                <AppText
                  variant="h2"
                  color={active ? 'textOnBrand' : 'text'}
                  style={[styles.name, active ? { color: '#FFFFFF' } : { color: '#134B4A' }]}
                >
                  {plan.name}
                </AppText>
                <AppText
                  variant="body"
                  style={[styles.description, active ? { color: '#DCE4E8' } : { color: '#535353' }]}
                >
                  {plan.description}
                </AppText>
              </View>
              <View style={styles.priceRow}>
                <AppText
                  variant="display"
                  style={[styles.price, active ? { color: '#FFFFFF' } : { color: '#134B4A' }]}
                >
                  {plan.price}
                </AppText>
                <AppText
                  variant="body"
                  style={[styles.cadence, active ? { color: '#EDF1F3' } : { color: '#535353' }]}
                >
                  {plan.cadence}
                </AppText>
              </View>
              <View style={styles.features}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.feature}>
                    <DashboardIcon icon={active ? PlanCheckActiveIcon : PlanCheckIcon} size={20} />
                    <AppText
                      variant="bodyStrong"
                      style={[
                        styles.featureLabel,
                        active ? { color: '#FFFFFF' } : { color: '#134B4A' },
                      ]}
                    >
                      {feature}
                    </AppText>
                  </View>
                ))}
              </View>
              <PlanActions
                planName={plan.name}
                active={active}
                deactivated={active && isPlanDeactivated}
                isBusy={isBusy}
                isReactivating={isReactivating}
                onSelect={() => onSelect(plan.id)}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PlanActions({
  planName,
  active,
  deactivated,
  isBusy,
  isReactivating,
  onSelect,
  onDeactivate,
  onReactivate,
}: Readonly<{
  planName: string;
  active: boolean;
  deactivated: boolean;
  isBusy: boolean;
  isReactivating: boolean;
  onSelect: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}>) {
  if (!active) {
    return (
      <Pressable
        onPress={onSelect}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityState={{ disabled: isBusy }}
        accessibilityLabel={`Select ${planName}`}
        style={({ pressed }) => [
          styles.cta,
          styles.ctaIdle,
          { opacity: isBusy ? 0.6 : pressed ? 0.88 : 1 },
        ]}
      >
        <AppText variant="button" style={styles.ctaLabel}>
          Select Plan
        </AppText>
      </Pressable>
    );
  }

  if (deactivated) {
    return (
      <View style={styles.actions}>
        <View
          accessibilityRole="text"
          accessibilityLabel={`${planName} deactivated`}
          style={[styles.cta, styles.ctaOutline]}
        >
          <AppText variant="button" style={styles.ctaLabel}>
            Deactivated
          </AppText>
        </View>
        <Pressable
          onPress={onReactivate}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy, busy: isBusy }}
          accessibilityLabel={`Reactivate ${planName}`}
          accessibilityHint="Turns your current plan back on immediately"
          style={({ pressed }) => [
            styles.cta,
            styles.ctaActive,
            { opacity: isBusy ? 0.6 : pressed ? 0.88 : 1 },
          ]}
        >
          <AppText variant="button" style={styles.ctaLabel}>
            {isReactivating ? 'Reactivating…' : 'Reactivate plan'}
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      <View
        accessibilityRole="text"
        accessibilityLabel={`${planName} active plan`}
        style={[styles.cta, styles.ctaActive]}
      >
        <AppText variant="button" style={styles.ctaLabel}>
          Active plan
        </AppText>
      </View>
      <Pressable
        onPress={onDeactivate}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityState={{ disabled: isBusy }}
        accessibilityLabel={`Deactivate ${planName}`}
        accessibilityHint="Opens a confirmation to temporarily deactivate this plan"
        style={({ pressed }) => [
          styles.cta,
          styles.ctaOutline,
          { opacity: isBusy ? 0.6 : pressed ? 0.88 : 1 },
        ]}
      >
        <AppText variant="button" style={styles.ctaLabel}>
          Deactivate plan
        </AppText>
      </Pressable>
    </View>
  );
}
