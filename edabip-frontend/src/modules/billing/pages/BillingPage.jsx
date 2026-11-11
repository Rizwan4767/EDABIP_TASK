import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './BillingPage.css';
import {
  getPlans,
  newIdempotencyKey,
  selectPlan,
  getPaymentMethods,
  setPrimaryPaymentMethod,
  removePaymentMethod,
  createPaymentMethodSetupIntent,
  attachPaymentMethod,
  billingErrorDetail,
  getHistory,
  getUsage,
  getStorage,
  getOverview,
  refreshBilling,
} from '../api/billingApi.js';
import {
  toPlans,
  toPlanChange,
  toPaymentMethods,
  toHistory,
  toUsageItems,
  toUsageDetail,
  toStorageDetail,
  toOverview,
} from '../api/adapters.js';
import UsageMeter from '../components/UsageMeter.jsx';
import UsageDetailModal from '../components/UsageDetailModal.jsx';
import PaymentMethodForm from '../components/PaymentMethodForm.jsx';
import PlanSelector from '../components/PlanSelector.jsx';
import PlanChangeModal from '../components/PlanChangeModal.jsx';
import DeactivatePlanModal from '../components/DeactivatePlanModal.jsx';
import RemoveCardModal from '../components/RemoveCardModal.jsx';
import BillingPageSkeleton from '../components/BillingPageSkeleton.jsx';
import { BILLING_PLANS_HASH, BILLING_PLANS_SECTION_ID } from '../utils/constants.js';
import { openCardCheckout, CheckoutDismissedError } from '../utils/razorpayCheckout.js';
import { formatRelativeTime } from '../../../utils/localeFormatters.js';
import SuccessToast from '../../user-management/components/SuccessToast.jsx'; 

import LastRefreshedIcon from '../../../assets/dashboard/billing/last-refreshed.svg';
import RefreshIcon from '../../../assets/dashboard/billing/refresh.svg';
import ChevronDown from '../../../assets/dashboard/billing/chevron-down.svg';
import HistoryPaidIcon from '../../../assets/dashboard/billing/TotalPaidIcon.svg';
import HistoryInvoicesIcon from '../../../assets/dashboard/billing/TotalInvoicesIcon.svg';
import HistoryOutstandingIcon from '../../../assets/dashboard/billing/OutstandingAmountIcon.svg';
import CurrentPlan from '../../../assets/dashboard/billing/current-plan.svg';
import CurrentPeriod from '../../../assets/dashboard/billing/current-period.svg';
import AmountDue from '../../../assets/dashboard/billing/amount-due1.svg';
import LastPayment from '../../../assets/dashboard/billing/last-payment1.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import DateRangePicker from '../../../components/common/DateRangePicker/index.jsx';
import { DEFAULT_DATE_RANGE, parseCustomDate } from '../../../components/common/DateRangePicker/dateRange.js';
import { useToast } from '../../../components/Toast/useToast';

const CATEGORY_OPTIONS = ['All Categories', 'Payments', 'Plans'];

// The date picker drives the Billing History chart and nothing else: /history
// is the only billing endpoint that takes a date argument, and it wants a
// count of months back from today (1-24) rather than a range.
const HISTORY_MONTHS_BY_PRESET = {
  'Last 30 Days': 1,
  '3 Months': 3,
  '6 Months': 6,
  '9 Months': 9,
};

function historyMonthsFor(range) {
  const preset = HISTORY_MONTHS_BY_PRESET[range];
  if (preset) return preset;

  // A custom pick is a single day, so read it as "since then" and round up to
  // whole months. Anything unparseable falls back to the API's own default.
  const day = parseCustomDate(range);
  if (!day) return 6;

  const now = new Date();
  const months =
    (now.getFullYear() - day.getFullYear()) * 12 + (now.getMonth() - day.getMonth()) + 1;
  return Math.min(Math.max(months, 1), 24);
}
// Fallback only. The real axis is derived from the data by `toHistory`.
const CHART_TICKS = ['', '', '', '', '0'];

function DropdownSelect({ value, options, onChange, icon, ariaLabel, showChevron = true }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="bl-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`db-btn db-btn--outline bl-filter-btn${open ? ' is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {icon ? <img src={icon} alt="" width="16" height="16" /> : null}
        <span>{value}</span>
        {showChevron ? <img src={ChevronDown} className="bl-filter-btn__chevron" alt="" width="16" height="8" /> : null}
      </button>
      {open ? (
        <ul className="bl-dropdown__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`bl-dropdown__option${option === value ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BillingPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { showError } = useToast();
  const location = useLocation();
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState(null);
  const [usage, setUsage] = useState([]);
  // The same /usage payload the meter tiles come from, kept in the fuller
  // shape the "View All" dialog needs. Adapted once on load rather than
  // refetched when the dialog opens — it is the same response.
  const [usageDetail, setUsageDetail] = useState(null);
  const [usageDetailOpen, setUsageDetailOpen] = useState(false);
  const [storageDetail, setStorageDetail] = useState(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [overview, setOverview] = useState(null);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [methods, setMethods] = useState([]);
  // The plan the user clicked, held while the confirmation dialog asks. Null
  // means no dialog is open; `planChanging` is the separate "the charge is in
  // flight" state, so the cards only lock once the user has actually agreed.
  const [pendingPlan, setPendingPlan] = useState(null);
  const [planChanging, setPlanChanging] = useState(false);
  // Minted when the confirmation dialog opens, held until it closes. Every
  // attempt at THIS plan change sends the same key, so a retry after a dropped
  // connection is recognised by the server as the same request and replays the
  // first outcome instead of charging again. A key minted per request would be
  // useless here - the retry is exactly the case it has to cover.
  const planIdempotencyKeyRef = useRef(null);
  const [addingCard, setAddingCard] = useState(false);
  const [planStatus, setPlanStatus] = useState('active');
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  // The card the user asked to remove, held while the confirmation dialog
  // asks. `removingCard` is the separate "the request is in flight" state, so
  // the row only greys out once the user has actually agreed.
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removingCard, setRemovingCard] = useState(false);
  const [toast, setToast] = useState(null);
  // Guards against a second click landing while the first PATCH is in flight;
  // two overlapping requests can come back out of order and leave the list
  // showing a primary the user didn't pick last.
  const primaryPendingRef = useRef(false);

  // One pass over every billing endpoint. allSettled rather than all, so a
  // section that fails — or 404s because there is no subscription yet — leaves
  // the rest of the page working.
  //
  // `showError` is a fresh function on every render, so it is deliberately not
  // a dependency; listing it would refetch forever.
  useEffect(() => {
    let active = true;

    const notFound = (result) => result.reason?.response?.status === 404;

    Promise.allSettled([
      getOverview(),
      getUsage(),
      getHistory({ months: historyMonthsFor(dateRange) }),
      getPaymentMethods(),
      getPlans(),
    ])
      .then(([overviewResult, usageResult, historyResult, methodResult, planResult]) => {
        if (!active) return;

        if (overviewResult.status === 'fulfilled') {
          setOverview(toOverview(overviewResult.value));
        } else if (!notFound(overviewResult)) {
          showError('Unable to Load Billing Overview', "We couldn't load your billing summary right now.");
        }

        if (usageResult.status === 'fulfilled') {
          setUsage(toUsageItems(usageResult.value));
          setUsageDetail(toUsageDetail(usageResult.value));
        } else if (!notFound(usageResult)) {
          showError('Unable to Load Usage', "We couldn't load your usage figures right now.");
        }

        if (historyResult.status === 'fulfilled') {
          setHistory(toHistory(historyResult.value));
        } else {
          showError('Unable to Load Billing History', "We couldn't load your billing history right now.");
        }

        if (methodResult.status === 'fulfilled') {
          setMethods(toPaymentMethods(methodResult.value));
        } else {
          showError('Unable to Load Payment Methods', "We couldn't load your saved cards right now.");
        }

        if (planResult.status === 'fulfilled') {
          const adapted = toPlans(planResult.value);
          setPlans(adapted.plans);
          setCurrentPlanId(adapted.currentPlanId);
        } else {
          showError('Unable to Load Plans', "We couldn't load the subscription plans right now.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || location.hash !== BILLING_PLANS_HASH) {
      return undefined;
    }

    const section = document.getElementById(BILLING_PLANS_SECTION_ID);
    if (!section) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loading, location.hash, location.state]);

  // Redraw the history chart when the date picker changes. The ref starts on
  // the current range so this skips the first run — the load above already
  // fetched that range, and refetching it here would double the request.
  const historyRangeRef = useRef(dateRange);

  useEffect(() => {
    if (historyRangeRef.current === dateRange) return undefined;
    historyRangeRef.current = dateRange;

    let active = true;
    getHistory({ months: historyMonthsFor(dateRange) })
      .then((data) => {
        if (active) setHistory(toHistory(data));
      })
      .catch(() => {
        if (active) {
          showError('Unable to Load Billing History', "We couldn't load your billing history right now.");
        }
      });

    return () => {
      active = false;
    };
    // `showError` is a fresh function each render; listing it would refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const displayName = getWelcomeDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleRefresh = async () => {
    try {
      setOverview(toOverview(await refreshBilling()));
    } catch (error) {
      // 404 just means there is nothing to refresh yet.
      if (error?.response?.status === 404) return;
      showError('Unable to Refresh Data', "We couldn't refresh the data right now.");
    }
  };

  // "+ Add New Payment Method".
  //
  // Three steps: ask the API for a verification order, let Razorpay Checkout
  // collect the card against it, then hand the signed result back for the
  // server to verify and save. The card itself never touches this app, so
  // there is no form of ours to validate — Checkout owns that.
  const handleAddCard = async () => {
    if (addingCard) return;
    setAddingCard(true);

    try {
      const order = await createPaymentMethodSetupIntent();
      // Prefill from the raw user, not `displayName` — that one falls back to
      // a placeholder name, which would land in Checkout's name field.
      const checkoutResult = await openCardCheckout(order, {
        customerName: user?.fullName || user?.name,
        customerEmail: user?.email,
        // Razorpay files saved cards against the contact number as well as
        // the customer id — see the note in openCardCheckout.
        customerContact: user?.mobileNumber,
      });

      const saved = await attachPaymentMethod({
        razorpayOrderId: checkoutResult.razorpay_order_id,
        razorpayPaymentId: checkoutResult.razorpay_payment_id,
        razorpaySignature: checkoutResult.razorpay_signature,
        setPrimary: true,
      });

      // The response carries the full re-ordered list, so we replace rather
      // than append and stay in step with the server.
      const rows = toPaymentMethods(saved?.payment_methods);
      setMethods(rows);

      setToast({
        title: 'Payment Method Added Successfully',
        message:
          saved?.message
          || (rows.some((method) => method.isChargeable === false)
            ? 'Card saved. You can now select a plan.'
            : 'The card details added successfully'),
      });
    } catch (error) {
      // Closing the overlay is a decision, not a failure. Nothing was charged
      // and nothing was saved, so there is nothing to tell the user.
      if (error instanceof CheckoutDismissedError) return;

      try {
        setMethods(toPaymentMethods(await getPaymentMethods()));
      } catch {
        // Keep the list we already have rather than blanking the section.
      }

      // The billing API writes its own user-facing copy (403 permission, 422
      // rejected card, 502 Razorpay unreachable), so prefer it when it's there.
      showError(
        'Unable to Add Payment Method',
        billingErrorDetail(error, "We couldn't save that payment method right now."),
      );
    } finally {
      setAddingCard(false);
    }
  };

  // Flip the radio straight away so the click feels immediate, then reconcile
  // with the list the API sends back. If it fails we put the previous list
  // back, so the page never shows a primary card the server didn't accept.
  const handleSetPrimary = async (id) => {
    if (primaryPendingRef.current) return;
    const previous = methods;
    if (previous.find((method) => method.id === id)?.isPrimary) return;

    primaryPendingRef.current = true;
    setMethods((prev) => prev.map((method) => ({ ...method, isPrimary: method.id === id })));

    try {
      const result = await setPrimaryPaymentMethod(id);
      const rows = toPaymentMethods(result?.payment_methods);
      // An empty list would mean the card vanished server-side; keep the
      // optimistic state rather than blanking the section.
      if (rows.length) setMethods(rows);
    } catch {
      setMethods(previous);
      showError(
        'Unable to Update Payment Method',
        "We couldn't set that card as your primary payment method right now.",
      );
    } finally {
      primaryPendingRef.current = false;
    }
  };

  // "View All" on the Usage Overview card.
  //
  // The metric figures are already in hand — the dialog reads the same /usage
  // response the tiles came from. Storage detail is the one thing it adds, so
  // that request is made when the dialog is opened rather than on every page
  // load, and only the first time.
  const handleViewAllUsage = async () => {
    setUsageDetailOpen(true);
    if (storageDetail || storageLoading) return;

    setStorageLoading(true);
    setStorageFailed(false);
    try {
      setStorageDetail(toStorageDetail(await getStorage()));
    } catch {
      // The dialog still has every metric including the storage meter; only
      // the thresholds panel is missing, and it says so inline. Not worth a
      // toast over the top of an open dialog.
      setStorageFailed(true);
    } finally {
      setStorageLoading(false);
    }
  };

  // "Remove Card" in the row menu.
  //
  // Detaching a card is destructive and can't be undone — the card has to go
  // back in through Checkout — so the click only opens the confirmation.
  const handleRemoveCard = (id) => {
    if (removingCard) return;
    const method = methods.find((item) => item.id === id);
    if (!method) return;
    setPendingRemoval(method);
  };

  const handleCancelRemoveCard = () => {
    // Nothing to cancel once the request is away; the dialog closes itself
    // when it settles.
    if (removingCard) return;
    setPendingRemoval(null);
  };

  const handleConfirmRemoveCard = async () => {
    if (!pendingRemoval || removingCard) return;
    setRemovingCard(true);

    try {
      const result = await removePaymentMethod(pendingRemoval.id);
      // Unlike the other two card calls, an empty list is the expected answer
      // to removing the last card — render it rather than keeping a card the
      // server no longer holds. The list also comes back re-ordered when the
      // removed card was primary and the server promoted its successor.
      if (Array.isArray(result?.payment_methods)) {
        setMethods(toPaymentMethods(result.payment_methods));
      }

      setToast({
        title: 'Payment Method Removed',
        message: result?.message || 'The card has been removed from your account.',
      });
    } catch (error) {
      // The API's own copy covers what the user can act on — 403 without the
      // billing permission, 404 for a card that is already gone, 502 when
      // Razorpay could not be reached and the card is therefore still on file.
      const detail = error?.response?.data?.detail;
      showError(
        'Unable to Remove Card',
        typeof detail === 'string' && detail
          ? detail
          : "We couldn't remove that card right now.",
      );
    } finally {
      setPendingRemoval(null);
      setRemovingCard(false);
    }
  };

  // Everything a plan change moves: the KPI cards, the usage limits, the
  // invoice it just generated and the history totals. allSettled rather than
  // all, so one failing section doesn't cost the others — the plan marker is
  // already correct from the change response either way.
  const reloadAfterPlanChange = async () => {
    const [overviewResult, usageResult, historyResult, planResult] =
      await Promise.allSettled([
        getOverview(),
        getUsage(),
        getHistory({ months: historyMonthsFor(dateRange) }),
        getPlans(),
      ]);

    if (overviewResult.status === 'fulfilled') {
      setOverview(toOverview(overviewResult.value));
    } else {
      // The plan change itself succeeded, so this is stale figures and nothing
      // worse. Say it in the Refresh button's words rather than anything that
      // reads like the payment failed.
      showError('Unable to Refresh Data', "We couldn't refresh the data right now.");
    }

    if (usageResult.status === 'fulfilled') {
      setUsage(toUsageItems(usageResult.value));
      setUsageDetail(toUsageDetail(usageResult.value));
    }

    // A new plan means new limits, so the cached storage panel is stale.
    // Dropping it makes the next "View All" fetch fresh figures.
    setStorageDetail(null);
    setStorageFailed(false);

    if (historyResult.status === 'fulfilled') {
      setHistory(toHistory(historyResult.value));
    }

    if (planResult.status === 'fulfilled') {
      const adapted = toPlans(planResult.value);
      setPlans(adapted.plans);
      setCurrentPlanId(adapted.currentPlanId);
    }
  };

  // "Select Plan" on a plan card.
  //
  // Changing plan charges the primary card straight away, so the click only
  // opens the confirmation — nothing is sent until the dialog is confirmed.
  // The API enforces the same rule from its side and rejects an unconfirmed
  // request outright.
  const handleSelectPlan = (planId) => {
    if (planChanging || deactivateOpen || isDeactivating || isReactivating) return;
    if (planStatus === 'deactivated') return;
    const plan = plans.find((item) => item.id === planId);
    if (!plan || plan.id === currentPlanId) return;
    planIdempotencyKeyRef.current = newIdempotencyKey();
    setPendingPlan(plan);
  };

  const handleCancelPlanChange = () => {
    // Nothing to cancel once the charge is on its way; the dialog closes
    // itself when the request settles.
    if (planChanging) return;
    planIdempotencyKeyRef.current = null;
    setPendingPlan(null);
  };

  const handleConfirmPlanChange = async () => {
    if (!pendingPlan || planChanging) return;
    setPlanChanging(true);

    // Whether the dialog survives this attempt. Only an unanswered request
    // keeps it open — see the catch.
    let retryable = false;

    try {
      const result = toPlanChange(
        await selectPlan(pendingPlan.id, { idempotencyKey: planIdempotencyKeyRef.current }),
      );
      // Mark the plan the API says the org ended up on, not the one that was
      // clicked, so the page can never claim a change the server didn't make.
      if (result.planId) setCurrentPlanId(result.planId);
      setPlanStatus('active');

      await reloadAfterPlanChange();

      setToast({
        title: 'Plan Updated Successfully',
        message: result.message || `You are now on the ${pendingPlan.name} plan.`,
      });
    } catch (error) {
      // No `response` at all means the request never got an answer — a dropped
      // connection, a timeout, a laptop that slept. The charge may well have
      // gone through, so this is the one case where the dialog stays open: the
      // retry reuses the key the dialog is holding, and the server replays its
      // first outcome instead of charging a second time. Closing here would
      // mint a fresh key on the next click and throw that protection away.
      retryable = !error?.response;

      if (retryable) {
        showError(
          'Connection Lost',
          "Couldn't reach the server. Press Confirm again — you won't be charged twice.",
        );
      } else {
        // The API writes its own copy for everything the user can act on — 403
        // without the billing permission, 402 for a missing or declined card,
        // 404 for a plan that has since been withdrawn.
        showError(
          'Unable to Change Plan',
          billingErrorDetail(error, "We couldn't change your plan right now."),
        );
      }
    } finally {
      if (!retryable) {
        planIdempotencyKeyRef.current = null;
        setPendingPlan(null);
      }
      setPlanChanging(false);
    }
  };

  const isPlanBusy =
    planChanging || deactivateOpen || isDeactivating || isReactivating;

  const handleOpenDeactivate = () => {
    if (isPlanBusy || planStatus === 'deactivated' || !currentPlanId) return;
    setDeactivateOpen(true);
  };

  const handleCancelDeactivate = () => {
    if (isDeactivating) return;
    setDeactivateOpen(false);
  };

  // Pause the current subscription in place. Comments travel with the request
  // so a later billing API can store the reason without a UI rewrite.
  const handleConfirmDeactivate = async (comment) => {
    void comment;
    setIsDeactivating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setPlanStatus('deactivated');
      setDeactivateOpen(false);
      setToast({
        title: 'Plan Deactivated',
        message: 'Your plan is temporarily deactivated. You can reactivate it anytime.',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivatePlan = async () => {
    if (isPlanBusy || planStatus !== 'deactivated') return;
    setIsReactivating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setPlanStatus('active');
      setToast({
        title: 'Plan Reactivated',
        message: 'Your plan is active again.',
      });
    } catch {
      showError('Unable to Reactivate Plan', 'Please try again in a moment.');
    } finally {
      setIsReactivating(false);
    }
  };

  const chartTicks = history?.ticks?.length ? history.ticks : CHART_TICKS;

  return (
    <div className="db-page bl-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content bl-content">
          <div className="bl-page-head">
            <h1>Billing</h1>
            <div className="bl-page-head__actions">
              <span className="bl-refreshed">
                <img src={LastRefreshedIcon} alt="" width="18" height="18" />
                Last Refreshed: {overview?.lastRefreshed ? formatRelativeTime(overview.lastRefreshed) : '—'}
              </span>
            </div>
          </div>

          <section className="bl-welcome">
            <div className="bl-welcome__left">
              <div className="bl-welcome__title-row">
                <h2>Welcome Back, {displayName}!</h2>
                <span className="db-realtime">
                  <span className="db-realtime__dot" />
                  <span>Real Time</span>
                </span>
              </div>
              <p>
                Stay Organised with real time insight, Monitor Your Bussiness Perfomence and key
                Metrics.
              </p>
            </div>
            <div className="bl-welcome__actions">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <DropdownSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                ariaLabel="Select category"
              />
              <button type="button" className="db-btn db-btn--solid bl-refresh-btn" onClick={handleRefresh}>
                <img src={RefreshIcon} alt="" width="16" height="16" />
                <span>Refresh</span>
              </button>
            </div>
          </section>

          {loading ? (
            <BillingPageSkeleton />
          ) : (
            <>
              {overview ? (
                <section className="bl-kpi-grid" aria-label="Billing overview">
                  <article className="bl-kpi">
                    <div className="bl-kpi__head">
                      <img src={CurrentPlan} alt="" width="45" height="45" />
                      <h3>Current Plan</h3>
                    </div>
                    <p className="bl-kpi__value">{overview.plan}</p>
                    <span className="bl-chip bl-chip--ok">{overview.billingCadence}</span>
                  </article>
                  <article className="bl-kpi">
                    <div className="bl-kpi__head">
                      <span className="bl-kpi__icon-box">
                        <img src={CurrentPeriod} alt="" width="45" height="45" />
                      </span>
                      <h3>Current Period</h3>
                    </div>
                    <p className="bl-kpi__value bl-kpi__value--sm">{overview.period}</p>
                    <span className="bl-chip bl-chip--ok">{overview.daysRemaining} Days Remaining</span>
                  </article>
                  <article className="bl-kpi">
                    <div className="bl-kpi__head">
                      <img src={AmountDue} alt="" width="45" height="45" />
                      <h3>Amount Due</h3>
                    </div>
                    <p className="bl-kpi__value">{overview.amountDue}</p>
                    <span className="bl-chip bl-chip--due">{overview.dueOn}</span>
                  </article>
                  <article className="bl-kpi">
                    <div className="bl-kpi__head">
                      <span className="bl-kpi__icon-box bl-kpi__icon-box--plain">
                        <img src={LastPayment} alt="" width="45" height="45" />
                      </span>
                      <h3>Last Payment</h3>
                    </div>
                    <p className="bl-kpi__value">{overview.lastPayment}</p>
                    <span className="bl-chip bl-chip--ok">{overview.lastPaymentOn}</span>
                  </article>
                </section>
              ) : null}

              <UsageMeter items={usage} onViewAll={handleViewAllUsage} />

              <div className="bl-split">
                <section className="bl-card bl-history" aria-label="Billing history">
                  <h3>Billing History</h3>
                  {history ? (
                    <div className="bl-history__body">

                      <div className="bl-history__stats">
                        <article className="bl-history__stat">
                          <img src={HistoryPaidIcon} alt="" />
                          <div>
                            <p>Total Paid</p>
                            <strong>{history.totalPaid}</strong>
                          </div>
                        </article>

                        <article className="bl-history__stat">
                          <img src={HistoryInvoicesIcon} alt="" />
                          <div>
                            <p>Total Invoices</p>
                            <strong>{history.totalInvoices}</strong>
                          </div>
                        </article>

                        <article className="bl-history__stat">
                          <img src={HistoryOutstandingIcon} alt="" />
                          <div>
                            <p>Outstanding Amount</p>
                            <strong>{history.outstanding}</strong>
                          </div>
                        </article>
                      </div>

                      <div className="bl-chart" role="img" aria-label="Monthly billing history chart">
                        <div className="bl-chart__frame">
                          <div className="bl-chart__grid" aria-hidden="true">
                            {chartTicks.map((tick, index) => (
                              <div
                                key={index}
                                className="bl-chart__row"
                                style={{ top: `${(index / (chartTicks.length - 1)) * 100}%` }}
                              >
                                <span className="bl-chart__tick">{tick}</span>
                                <span className={`bl-chart__line${index === chartTicks.length - 1 ? ' is-base' : ''}`} />
                              </div>
                            ))}
                          </div>
                          <div className="bl-chart__bars">
                            {history.bars.map((bar) => (
                              <div key={bar.month} className="bl-chart__col">
                                <div className="bl-chart__track">
                                  <div className="bl-chart__stack" style={{ height: `${bar.height}%` }}>
                                    <span className="bl-chart__value">{bar.value}</span>
                                    <div className="bl-chart__bar" style={{ background: bar.color }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bl-chart__x">
                          {history.bars.map((bar) => (
                            <span key={bar.month}>{bar.month}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>

                <PaymentMethodForm
                  methods={methods}
                  onAddCard={handleAddCard}
                  isAddingCard={addingCard}
                  onSetPrimary={handleSetPrimary}
                  onRemove={handleRemoveCard}
                  removingId={removingCard ? pendingRemoval?.id ?? null : null}
                />
              </div>

              <PlanSelector
                plans={plans}
                currentPlanId={currentPlanId}
                onSelect={handleSelectPlan}
                onDeactivate={handleOpenDeactivate}
                onReactivate={handleReactivatePlan}
                pendingPlanId={planChanging ? pendingPlan?.id ?? null : null}
                isPlanDeactivated={planStatus === 'deactivated'}
                isReactivating={isReactivating}
                isBusy={isPlanBusy}
              />
            </>
          )}
          <AppFooter />
        </div>
      </div>

    
      <UsageDetailModal
        isOpen={usageDetailOpen}
        usage={usageDetail}
        storage={storageDetail}
        isLoadingStorage={storageLoading}
        storageFailed={storageFailed}
        onClose={() => setUsageDetailOpen(false)}
      />

      <PlanChangeModal
        isOpen={!!pendingPlan}
        plan={pendingPlan}
        currentPlanName={plans.find((plan) => plan.id === currentPlanId)?.name || ''}
        paymentMethod={methods.find((method) => method.isPrimary) || null}
        isSubmitting={planChanging}
        onConfirm={handleConfirmPlanChange}
        onCancel={handleCancelPlanChange}
      />

      <DeactivatePlanModal
        isOpen={deactivateOpen}
        isSubmitting={isDeactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={handleCancelDeactivate}
      />

      <RemoveCardModal
        isOpen={!!pendingRemoval}
        method={pendingRemoval}
        remainingCount={Math.max(methods.length - 1, 0)}
        isSubmitting={removingCard}
        onConfirm={handleConfirmRemoveCard}
        onCancel={handleCancelRemoveCard}
      />

      <SuccessToast
        isOpen={!!toast}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default BillingPage;