import { useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { EdabipAppTabFooter } from '@/components/navigation/EdabipAppTabFooter';
import { GoToDashboardFab } from '@/components/navigation/GoToDashboardFab';
import { useScrollAwareFab } from '@/components/navigation/useScrollAwareFab';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { readBillingParams } from '@/navigation/params';
import { ROUTES } from '@/navigation/routes';
import type { BillingPlan } from '@/screens/billing/billingData';
import { billingScreenStyles as styles, surfaceFill } from '@/screens/billing/billingScreenStyles';
import { BillingHistoryCard } from '@/screens/billing/components/BillingHistoryCard';
import { BillingKpiGrid } from '@/screens/billing/components/BillingKpiGrid';
import { DeactivatePlanModal } from '@/screens/billing/components/DeactivatePlanModal';
import { PaymentMethodCard } from '@/screens/billing/components/PaymentMethodCard';
import { PlanSelectorCard } from '@/screens/billing/components/PlanSelectorCard';
import { UsageOverviewCard } from '@/screens/billing/components/UsageOverviewCard';
import { useBillingData } from '@/screens/billing/useBillingData';
import { useScrollToPlans } from '@/screens/billing/useScrollToPlans';
import { billingErrorDetail } from '@/services/api/billingApi';
import { ApiError } from '@/services/api/apiError';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function BillingScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <BillingCanvas />
    </ThemeSchemeOverride>
  );
}

function BillingCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const billingParams = readBillingParams(useLocalSearchParams());
  const { profile, reload: reloadProfile } = useUser();
  const {
    data,
    isLoading,
    isRefreshing,
    isAddingCard,
    error,
    reload,
    refreshOverview,
    beginPlanChange,
    cancelPlanChange,
    selectPlan,
    deactivatePlan,
    reactivatePlan,
    selectPaymentMethod,
    addPaymentMethod,
    removePaymentMethod,
  } = useBillingData();
  const { scrollRef, onHeaderLayout, onPlansLayout } = useScrollToPlans(
    billingParams.section,
    billingParams.focus,
  );
  const { visible: fabVisible, onScroll: onFabScroll } = useScrollAwareFab();
  const [menuOpen, setMenuOpen] = useState(false);
  const [methodsExpanded, setMethodsExpanded] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);
  const [planChanging, setPlanChanging] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const keepPlanDialogOpenRef = useRef(false);

  const isPlanBusy =
    Boolean(pendingPlan) || planChanging || deactivateOpen || isDeactivating || isReactivating;

  const firstName = getFirstName(profile?.fullName ?? '');
  const selectedMethodId =
    data.paymentMethods.find((method) => method.isPrimary)?.id ?? data.paymentMethods[0]?.id ?? '';

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile(), refreshOverview().catch(() => undefined)]);
  };

  const onAddCard = () => {
    void (async () => {
      try {
        const result = await addPaymentMethod({
          customerName: profile?.fullName,
          customerEmail: profile?.email,
          customerContact: profile?.phone,
        });
        if (!result) return;
        setMethodsExpanded(true);
        Alert.alert('Payment Method Added', result.message);
      } catch (cause) {
        Alert.alert(
          'Unable to Add Payment Method',
          billingErrorDetail(cause, "We couldn't save that payment method right now."),
        );
      }
    })();
  };

  const onRemoveCard = (methodId: string) => {
    void (async () => {
      try {
        const message = await removePaymentMethod(methodId);
        Alert.alert('Payment Method Removed', message);
      } catch (cause) {
        Alert.alert(
          'Unable to Remove Card',
          billingErrorDetail(cause, "We couldn't remove that card right now."),
        );
      }
    })();
  };

  const onConfirmPlanChange = () => {
    if (!pendingPlan || planChanging) return;
    setPlanChanging(true);
    keepPlanDialogOpenRef.current = false;

    void (async () => {
      try {
        const result = await selectPlan(pendingPlan.id);
        Alert.alert(
          'Plan Updated Successfully',
          result.message || `You are now on the ${pendingPlan.name} plan.`,
        );
      } catch (cause) {
        const retryable =
          typeof cause === 'object' &&
          cause !== null &&
          'retryable' in cause &&
          Boolean((cause as { retryable?: boolean }).retryable);

        if (retryable || !(cause instanceof ApiError)) {
          keepPlanDialogOpenRef.current = true;
          Alert.alert(
            'Connection Lost',
            "Couldn't reach the server. Press Confirm again — you won't be charged twice.",
          );
        } else {
          Alert.alert(
            'Unable to Change Plan',
            billingErrorDetail(cause, "We couldn't change your plan right now."),
          );
        }
      } finally {
        setPlanChanging(false);
        if (!keepPlanDialogOpenRef.current) {
          cancelPlanChange();
          setPendingPlan(null);
        }
      }
    })();
  };

  return (
    <View style={[styles.root, surfaceFill(theme.colors.surface)]}>
      <StatusBar style="light" />
      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          style={[styles.flex, surfaceFill(theme.colors.surface)]}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={onFabScroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.textOnBrand}
            />
          }
        >
          <View onLayout={onHeaderLayout}>
            <EdabipAppHeader
              topInset={insets.top}
              firstName={firstName}
              avatarUrl={profile?.avatarUrl || undefined}
              initialsSource={profile?.fullName ?? ''}
              onMenuPress={() => setMenuOpen(true)}
              onProfilePress={() => router.push(ROUTES.main.profile)}
              onRefreshPress={onRefresh}
            >
              <BillingKpiGrid kpis={data.kpis} isLoading={isLoading} />
            </EdabipAppHeader>
          </View>

          <View style={styles.body}>
            {error ? <ErrorBanner message={error} /> : null}

            <UsageOverviewCard items={data.usage} />
            <BillingHistoryCard history={data.history} />
            <PaymentMethodCard
              methods={data.paymentMethods}
              selectedId={selectedMethodId}
              expanded={methodsExpanded}
              isAdding={isAddingCard}
              onToggleExpanded={() => setMethodsExpanded((value) => !value)}
              onSelect={(id) => {
                void selectPaymentMethod(id).catch((cause) => {
                  Alert.alert(
                    'Unable to Update Payment Method',
                    billingErrorDetail(
                      cause,
                      "We couldn't set that card as your primary payment method right now.",
                    ),
                  );
                });
              }}
              onAdd={onAddCard}
              onRemove={onRemoveCard}
            />
            <View nativeID="billing-plans" collapsable={false} onLayout={onPlansLayout}>
              <PlanSelectorCard
                plans={data.plans}
                currentPlanId={data.currentPlanId}
                isPlanDeactivated={data.planStatus === 'deactivated'}
                isBusy={isPlanBusy}
                isReactivating={isReactivating}
                onSelect={(planId) => {
                  if (isPlanBusy || data.planStatus === 'deactivated') return;
                  const plan = data.plans.find((item) => item.id === planId);
                  if (!plan || plan.id === data.currentPlanId) return;
                  beginPlanChange();
                  setPendingPlan(plan);
                }}
                onDeactivate={() => {
                  if (isPlanBusy || data.planStatus === 'deactivated') return;
                  setDeactivateOpen(true);
                }}
                onReactivate={() => {
                  if (isPlanBusy) return;
                  setIsReactivating(true);
                  void reactivatePlan()
                    .catch(() => {
                      Alert.alert('Unable to reactivate plan', 'Please try again in a moment.');
                    })
                    .finally(() => setIsReactivating(false));
                }}
              />
            </View>

            <EdabipLegalFooter />
          </View>
        </ScrollView>

        <GoToDashboardFab includeSafeArea={false} visible={fabVisible} />
      </View>

      <EdabipAppTabFooter />

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />

      <ConfirmDialog
        visible={Boolean(pendingPlan)}
        title="Change plan"
        message={
          pendingPlan
            ? `Switch to the ${pendingPlan.name} plan at ${pendingPlan.price}${pendingPlan.cadence}?`
            : ''
        }
        confirmLabel="Select plan"
        isPending={planChanging}
        onConfirm={() => {
          if (planChanging) return;
          onConfirmPlanChange();
        }}
        onCancel={() => {
          if (planChanging) return;
          cancelPlanChange();
          setPendingPlan(null);
        }}
      />

      <DeactivatePlanModal
        visible={deactivateOpen}
        isSubmitting={isDeactivating}
        onCancel={() => {
          if (isDeactivating) return;
          setDeactivateOpen(false);
        }}
        onConfirm={async (comment) => {
          setIsDeactivating(true);
          try {
            await deactivatePlan(comment);
            setDeactivateOpen(false);
          } finally {
            setIsDeactivating(false);
          }
        }}
      />
    </View>
  );
}
