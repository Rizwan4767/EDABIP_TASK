import { useCallback, useEffect, useRef, useState } from 'react';

import {
  EMPTY_BILLING_DATA,
  type BillingData,
  type BillingPlanStatus,
} from '@/screens/billing/billingData';
import {
  toHistory,
  toKpis,
  toOverview,
  toPaymentMethods,
  toPlanChange,
  toPlans,
  toUsageItems,
  type OverviewView,
} from '@/services/api/billing/adapters';
import { ApiError } from '@/services/api/apiError';
import { billingApi, billingErrorDetail, newIdempotencyKey } from '@/services/api/billingApi';
import { CheckoutDismissedError, openCardCheckout } from '@/services/billing/razorpayCheckout';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function withPlanStatus(data: BillingData, planStatus: BillingPlanStatus): BillingData {
  return {
    ...data,
    planStatus,
    kpis: data.kpis.map((kpi) =>
      kpi.id === 'plan'
        ? {
            ...kpi,
            badge: planStatus === 'deactivated' ? 'Deactivated' : kpi.badge,
            tone: planStatus === 'deactivated' ? 'danger' : 'success',
          }
        : kpi,
    ),
  };
}

async function fetchBillingSnapshot(planStatus: BillingPlanStatus): Promise<{
  overview: OverviewView | null;
  usage: BillingData['usage'];
  history: BillingData['history'];
  paymentMethods: BillingData['paymentMethods'];
  plans: BillingData['plans'];
  currentPlanId: string;
  planStatus: BillingPlanStatus;
  hardError: string | null;
}> {
  const results = await Promise.allSettled([
    billingApi.getOverview(),
    billingApi.getUsage(),
    billingApi.getHistory({ months: 6 }),
    billingApi.getPaymentMethods(),
    billingApi.getPlans(),
  ]);

  const [overviewResult, usageResult, historyResult, methodResult, planResult] = results;

  let nextOverview: OverviewView | null = null;
  let hardError: string | null = null;

  if (overviewResult.status === 'fulfilled') {
    nextOverview = toOverview(overviewResult.value);
  } else if (!isNotFound(overviewResult.reason)) {
    hardError = 'Unable to load billing overview.';
  }

  const usage =
    usageResult.status === 'fulfilled' ? toUsageItems(usageResult.value) : EMPTY_BILLING_DATA.usage;
  if (usageResult.status === 'rejected' && !isNotFound(usageResult.reason) && !hardError) {
    hardError = 'Unable to load usage.';
  }

  const history =
    historyResult.status === 'fulfilled'
      ? toHistory(historyResult.value)
      : EMPTY_BILLING_DATA.history;
  if (historyResult.status === 'rejected' && !hardError) {
    hardError = 'Unable to load billing history.';
  }

  const paymentMethods =
    methodResult.status === 'fulfilled'
      ? toPaymentMethods(methodResult.value)
      : EMPTY_BILLING_DATA.paymentMethods;
  if (methodResult.status === 'rejected' && !hardError) {
    hardError = 'Unable to load payment methods.';
  }

  let plans = EMPTY_BILLING_DATA.plans;
  let currentPlanId = '';
  if (planResult.status === 'fulfilled') {
    const adapted = toPlans(planResult.value);
    plans = adapted.plans;
    currentPlanId = adapted.currentPlanId;
  } else if (!hardError) {
    hardError = 'Unable to load plans.';
  }

  return {
    overview: nextOverview,
    usage,
    history,
    paymentMethods,
    plans,
    currentPlanId,
    planStatus,
    hardError,
  };
}

export function useBillingData() {
  const [data, setData] = useState<BillingData>(EMPTY_BILLING_DATA);
  const overviewRef = useRef<OverviewView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primaryPendingRef = useRef(false);
  const planIdempotencyKeyRef = useRef<string | null>(null);
  const planStatusRef = useRef<BillingPlanStatus>('active');

  const applySnapshot = useCallback(
    (parts: {
      overview?: OverviewView | null;
      usage?: BillingData['usage'];
      history?: BillingData['history'];
      paymentMethods?: BillingData['paymentMethods'];
      plans?: BillingData['plans'];
      currentPlanId?: string;
      planStatus?: BillingPlanStatus;
    }) => {
      if (parts.overview !== undefined) {
        overviewRef.current = parts.overview;
      }

      setData((current) => {
        const nextOverview = parts.overview !== undefined ? parts.overview : overviewRef.current;
        const planStatus = parts.planStatus ?? planStatusRef.current;
        planStatusRef.current = planStatus;

        return {
          kpis: toKpis(nextOverview, planStatus),
          usage: parts.usage ?? current.usage,
          invoices: current.invoices,
          history: parts.history ?? current.history,
          paymentMethods: parts.paymentMethods ?? current.paymentMethods,
          plans: parts.plans ?? current.plans,
          currentPlanId:
            parts.currentPlanId !== undefined ? parts.currentPlanId : current.currentPlanId,
          planStatus,
        };
      });
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const snapshot = await fetchBillingSnapshot(planStatusRef.current);
      if (cancelled) return;
      applySnapshot(snapshot);
      setError(snapshot.hardError);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const snapshot = await fetchBillingSnapshot(planStatusRef.current);
      applySnapshot(snapshot);
      setError(snapshot.hardError);
    } finally {
      setIsRefreshing(false);
    }
  }, [applySnapshot]);

  const refreshOverview = useCallback(async () => {
    try {
      const next = toOverview(await billingApi.refresh());
      applySnapshot({ overview: next });
    } catch (error) {
      if (isNotFound(error)) return;
      throw error;
    }
  }, [applySnapshot]);

  const beginPlanChange = useCallback(() => {
    planIdempotencyKeyRef.current = newIdempotencyKey();
  }, []);

  const cancelPlanChange = useCallback(() => {
    planIdempotencyKeyRef.current = null;
  }, []);

  const selectPlan = useCallback(
    async (planId: string): Promise<{ message: string; retryable: boolean }> => {
      const key = planIdempotencyKeyRef.current ?? newIdempotencyKey();
      planIdempotencyKeyRef.current = key;

      try {
        const result = toPlanChange(await billingApi.selectPlan(planId, { idempotencyKey: key }));
        planStatusRef.current = 'active';
        if (result.planId) {
          applySnapshot({ currentPlanId: result.planId, planStatus: 'active' });
        }

        const [overviewResult, usageResult, historyResult, planResult] = await Promise.allSettled([
          billingApi.getOverview(),
          billingApi.getUsage(),
          billingApi.getHistory({ months: 6 }),
          billingApi.getPlans(),
        ]);

        applySnapshot({
          overview:
            overviewResult.status === 'fulfilled' ? toOverview(overviewResult.value) : undefined,
          usage: usageResult.status === 'fulfilled' ? toUsageItems(usageResult.value) : undefined,
          history:
            historyResult.status === 'fulfilled' ? toHistory(historyResult.value) : undefined,
          plans: planResult.status === 'fulfilled' ? toPlans(planResult.value).plans : undefined,
          currentPlanId:
            planResult.status === 'fulfilled'
              ? toPlans(planResult.value).currentPlanId
              : result.planId || undefined,
          planStatus: 'active',
        });

        planIdempotencyKeyRef.current = null;
        return { message: result.message, retryable: false };
      } catch (error) {
        const retryable = !(error instanceof ApiError);
        if (!retryable) planIdempotencyKeyRef.current = null;
        throw Object.assign(error instanceof Error ? error : new Error(String(error)), {
          retryable,
          detail: billingErrorDetail(error, "We couldn't change your plan right now."),
        });
      }
    },
    [applySnapshot],
  );

  const deactivatePlan = useCallback(async (_comment: string) => {
    void _comment;
    planStatusRef.current = 'deactivated';
    setData((current) => withPlanStatus(current, 'deactivated'));
  }, []);

  const reactivatePlan = useCallback(async () => {
    planStatusRef.current = 'active';
    setData((current) => {
      const next = withPlanStatus(current, 'active');
      return {
        ...next,
        kpis: toKpis(overviewRef.current, 'active'),
      };
    });
  }, []);

  const selectPaymentMethod = useCallback(async (methodId: string) => {
    if (primaryPendingRef.current) return;
    let previous = EMPTY_BILLING_DATA.paymentMethods;

    setData((current) => {
      previous = current.paymentMethods;
      if (previous.find((method) => method.id === methodId)?.isPrimary) return current;
      return {
        ...current,
        paymentMethods: current.paymentMethods.map((method) => ({
          ...method,
          isPrimary: method.id === methodId,
        })),
      };
    });

    if (previous.find((method) => method.id === methodId)?.isPrimary) return;

    primaryPendingRef.current = true;
    try {
      const result = await billingApi.setPrimaryPaymentMethod(methodId);
      const rows = toPaymentMethods(
        (result as { payment_methods?: unknown }).payment_methods ?? result,
      );
      if (rows.length) {
        setData((current) => ({ ...current, paymentMethods: rows }));
      }
    } catch (error) {
      setData((current) => ({ ...current, paymentMethods: previous }));
      throw error;
    } finally {
      primaryPendingRef.current = false;
    }
  }, []);

  const addPaymentMethod = useCallback(
    async (customer: {
      customerName?: string;
      customerEmail?: string;
      customerContact?: string;
    }) => {
      if (isAddingCard) return;
      setIsAddingCard(true);

      try {
        const order = await billingApi.createPaymentMethodSetupIntent();
        const checkoutResult = await openCardCheckout(order, customer);
        const makePrimary = data.paymentMethods.length === 0;
        const saved = await billingApi.attachPaymentMethod({
          razorpayOrderId: checkoutResult.razorpay_order_id,
          razorpayPaymentId: checkoutResult.razorpay_payment_id,
          razorpaySignature: checkoutResult.razorpay_signature,
          setPrimary: makePrimary,
        });
        const rows = toPaymentMethods(
          (saved as { payment_methods?: unknown }).payment_methods ?? [],
        );
        setData((current) => ({ ...current, paymentMethods: rows }));
        return {
          message:
            String((saved as { message?: string }).message || '') ||
            (rows.some((method) => method.isChargeable === false)
              ? 'Card saved. You can now select a plan.'
              : 'The card details added successfully'),
        };
      } catch (error) {
        if (error instanceof CheckoutDismissedError) return null;
        try {
          const rows = toPaymentMethods(await billingApi.getPaymentMethods());
          setData((current) => ({ ...current, paymentMethods: rows }));
        } catch {
          // Keep the list we already have.
        }
        throw error;
      } finally {
        setIsAddingCard(false);
      }
    },
    [data.paymentMethods.length, isAddingCard],
  );

  const removePaymentMethod = useCallback(async (methodId: string) => {
    const result = await billingApi.removePaymentMethod(methodId);
    const rows = toPaymentMethods((result as { payment_methods?: unknown }).payment_methods ?? []);
    setData((current) => ({ ...current, paymentMethods: rows }));
    return String((result as { message?: string }).message || 'Card removed.');
  }, []);

  return {
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
  };
}
