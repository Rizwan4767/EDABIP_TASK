import apiClient from '../../../lib/apiClient.js';

// ---------------------------------------------------------------------------
// File downloads
// ---------------------------------------------------------------------------

// Matches both `filename=x.csv` and the RFC 5987 `filename*=UTF-8''x.csv`.
const FILENAME_PATTERN = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i;

function filenameFromResponse(response) {
  const disposition = response?.headers?.['content-disposition'];
  if (typeof disposition !== 'string') return '';
  const match = disposition.match(FILENAME_PATTERN);
  return match ? decodeURIComponent(match[1].trim()) : '';
}

/**
 * A request made with `responseType: 'blob'` gets its *error* body as a Blob
 * too, so the usual `error.response.data.detail` reads undefined and the user
 * sees generic copy instead of the API's own message. This reads the blob back
 * and puts the parsed body where callers already look for it.
 */
async function parseBlobErrorBody(error) {
  const data = error?.response?.data;
  if (typeof Blob === 'undefined' || !(data instanceof Blob)) return;

  try {
    error.response.data = JSON.parse(await data.text());
  } catch {
    // Not JSON — a gateway error page, or an empty body. Leave callers to
    // their fallback copy rather than showing them markup.
    error.response.data = undefined;
  }
}

/**
 * FastAPI `detail` is a string for our billing errors, and an array of
 * `{ loc, msg }` objects for request-body 422s. Callers want one line.
 */
export function billingErrorDetail(error, fallback = '') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (typeof item === 'string' && item.trim()) return item.trim();
      if (item && typeof item.msg === 'string' && item.msg.trim()) {
        return item.msg.trim();
      }
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Real API
// ---------------------------------------------------------------------------

/** GET /api/billing/plans — the "Choose the Right Plan" section. */
export const getPlans = async () => {
  const { data } = await apiClient.get('/api/billing/plans');
  return data;
};

/**
 * POST /api/billing/plans/{plan_code}/select — the "Select Plan" button.
 *
 * Takes the plan *code* (`starter`, `professional`, …), which is what
 * `toPlans` already puts in each card's `id`.
 *
 * `confirmed` is the API's own guard rather than a formality: it answers 400
 * unless the flag is true, so this must only ever be called once the user has
 * actually said yes. Leaving `paymentMethodId` off charges the org's primary
 * card — the plan cards offer no card picker, and the server falls back to the
 * primary on its own.
 *
 * This is a real charge. Needs billing:manage (403 for a view-only role), and
 * answers 402 when there is no usable card. Both carry user-facing copy in
 * `detail`, so callers should prefer it over their own wording.
 */
/**
 * A key identifying one money-moving *intent*, so the server can tell a retry
 * from a fresh attempt.
 *
 * Exported because the lifetime belongs to the caller, not to the request: the
 * plan dialog mints one when it opens and reuses it for every retry until it
 * closes, so a retry after a dropped connection is recognised as the same
 * attempt. Minting per request would defeat that — see BillingPage.
 *
 * `crypto.randomUUID` is unavailable outside a secure context (plain-HTTP dev
 * hosts, older Safari), and this must never throw on the path to a charge —
 * so fall back to random bytes, and to Math.random only if even that is gone.
 * Uniqueness per attempt is all that is required; this is not a secret.
 */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    if (typeof crypto.getRandomValues === 'function') {
      return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');
    }
  }
  return `k-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`;
}

export const selectPlan = async (
  planCode,
  { paymentMethodId = null, idempotencyKey = newIdempotencyKey() } = {},
) => {
  const { data } = await apiClient.post(
    `/api/billing/plans/${encodeURIComponent(planCode)}/select`,
    {
      confirmed: true,
      payment_method_id: paymentMethodId,
      // Minted per call, which is per confirm-click — the dialog sends
      // exactly one. The server charges the card before it answers, so a
      // reply lost in transit is indistinguishable from a request that never
      // landed; this key lets the server recognise a retry of THIS click and
      // replay its first result instead of charging again. The 401-refresh
      // interceptor in apiClient replays the request body it was handed, so
      // its retry carries the same key too.
      idempotency_key: idempotencyKey,
    },
  );
  return data;
};

/**
 * GET /api/billing/invoices — the Invoice table.
 *
 * The table pages and searches client-side, so we ask for one big page.
 * 100 is the API's maximum; past that the table would silently miss rows and
 * this needs to move to real server-side paging (`page`, `search`).
 */
export const getInvoices = async ({ page = 1, pageSize = 100, search } = {}) => {
  const params = { page, page_size: pageSize };
  // The API matches `search` against the invoice number only, and answers 400
  // for a term under 2 characters or outside its allow-list — see
  // INVOICE_SEARCH_PATTERN on the caller, which screens those out first.
  if (search) params.search = search;

  const { data } = await apiClient.get('/api/billing/invoices', { params });
  return data;
};

/**
 * Every invoice, walked through the API's own pagination.
 *
 * The table pages and searches in the browser, so it needs the full set. One
 * call could only ever return 100 rows (`page_size` is capped there, 101 is a
 * 422), which silently hid anything past the hundredth invoice. This reads
 * page 1, learns `total_pages`, and fetches whatever is left.
 *
 * `maxPages` is a backstop, not an expectation: at one invoice a month, 100
 * rows is already eight years of billing. If an org ever exceeds it, the table
 * is the wrong shape for that data and should page against the server instead.
 */
export const getAllInvoices = async ({ pageSize = 100, maxPages = 20 } = {}) => {
  const first = await getInvoices({ page: 1, pageSize });
  const totalPages = Math.min(first.total_pages ?? 1, maxPages);
  if (totalPages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getInvoices({ page: index + 2, pageSize }),
    ),
  );

  return {
    ...first,
    items: rest.reduce((all, payload) => all.concat(payload.items ?? []), [...(first.items ?? [])]),
  };
};

/**
 * GET /api/billing/invoices/{invoice_number} — invoice detail.
 *
 * Prefer `downloadInvoicePdf` for the GST PDF. This route still exists for
 * callers that need metadata, including the optional hosted Razorpay URL
 * on older rows.
 */
export const getInvoice = async (invoiceNumber) => {
  const { data } = await apiClient.get(
    `/api/billing/invoices/${encodeURIComponent(invoiceNumber)}`,
  );
  return data;
};

/**
 * GET /api/billing/invoices/{invoice_number}/download — one GST PDF.
 */
export const downloadInvoicePdf = async (invoiceNumber) => {
  try {
    const response = await apiClient.get(
      `/api/billing/invoices/${encodeURIComponent(invoiceNumber)}/download`,
      { responseType: 'blob' },
    );
    return {
      blob: response.data,
      filename: filenameFromResponse(response) || `${invoiceNumber}.pdf`,
    };
  } catch (error) {
    await parseBlobErrorBody(error);
    throw error;
  }
};

/**
 * POST /api/billing/invoices/download — one GST PDF containing every selected invoice.
 */
export const downloadInvoicePdfs = async (invoiceNumbers) => {
  const numbers = [...new Set((invoiceNumbers || []).map((value) => String(value || '').trim()).filter(Boolean))];
  if (!numbers.length) {
    const error = new Error('Select at least one invoice.');
    error.response = { data: { detail: 'Select at least one invoice.' } };
    throw error;
  }
  if (numbers.length === 1) {
    return downloadInvoicePdf(numbers[0]);
  }
  try {
    const response = await apiClient.post(
      '/api/billing/invoices/download',
      { invoice_numbers: numbers },
      { responseType: 'blob' },
    );
    return {
      blob: response.data,
      filename: filenameFromResponse(response) || 'EDABIP-invoices.pdf',
    };
  } catch (error) {
    await parseBlobErrorBody(error);
    throw error;
  }
};

/**
 * GET /api/billing/export — the invoice table's "Download" button.
 *
 * The server writes the CSV, so it covers every invoice the org has rather
 * than the rows this page happened to load, and the figures come straight from
 * billing instead of being re-serialised from formatted display strings. Its
 * columns differ slightly from the table's: period start and end are separate,
 * and amounts are plain numbers.
 *
 * Needs billing:export, so a view-only role gets a 403 with its own copy.
 */
export const exportInvoicesCsv = async () => {
  try {
    const response = await apiClient.get('/api/billing/export', { responseType: 'blob' });
    return {
      blob: response.data,
      filename: filenameFromResponse(response) || 'billing_export.csv',
    };
  } catch (error) {
    await parseBlobErrorBody(error);
    throw error;
  }
};

/**
 * GET /api/billing/payment-history — the profile Payment History page.
 *
 * The table pages and searches in the browser, so we ask for one large page.
 * 100 is the API's maximum.
 */
export const getPaymentHistory = async ({ page = 1, pageSize = 100, status, search } = {}) => {
  const params = { page, page_size: pageSize };
  if (status) params.status = status;
  if (search) params.search = search;

  const { data } = await apiClient.get('/api/billing/payment-history', { params });
  return data;
};

export const getAllPayments = async ({ pageSize = 100, maxPages = 20 } = {}) => {
  const first = await getPaymentHistory({ page: 1, pageSize });
  const totalPages = Math.min(first.total_pages ?? 1, maxPages);
  if (totalPages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getPaymentHistory({ page: index + 2, pageSize }),
    ),
  );

  return {
    ...first,
    items: rest.reduce((all, payload) => all.concat(payload.items ?? []), [...(first.items ?? [])]),
  };
};

/** GET /api/billing/payment-methods — the saved cards list. */
export const getPaymentMethods = async () => {
  const { data } = await apiClient.get('/api/billing/payment-methods');
  return data;
};

/**
 * POST /api/billing/payment-methods/setup-intent — step 1 of "Add New
 * Payment Method".
 *
 * Returns { order_id, key_id, amount, currency, customer_id }: a small
 * verification order for Razorpay Checkout to open against, plus the Razorpay
 * customer the saved-card token must be minted under. Nothing is saved yet.
 * Needs the billing:manage permission, so a view-only role gets a 403 here.
 */
export const createPaymentMethodSetupIntent = async () => {
  const { data } = await apiClient.post('/api/billing/payment-methods/setup-intent');
  return data;
};

/**
 * POST /api/billing/payment-methods — step 2 of "Add New Payment Method".
 *
 * Takes what Checkout's handler gave back. The server re-verifies the
 * signature with Razorpay before saving anything, so a forged or replayed
 * payment id is rejected (422) rather than trusted.
 *
 * Returns the whole list back ({ payment_methods, message }), same as
 * setPrimaryPaymentMethod. The first card an org adds is made primary by the
 * server whatever `setPrimary` says.
 */
export const attachPaymentMethod = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  setPrimary = false,
}) => {
  const { data } = await apiClient.post('/api/billing/payment-methods', {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
    set_primary: setPrimary,
  });
  return data;
};

/**
 * PATCH /api/billing/payment-methods/{id}/primary — the "Set as Primary" button.
 *
 * Returns the whole list back ({ payment_methods, message }), already
 * re-ordered with the new primary first, so callers can replace their copy
 * rather than patching it.
 */
export const setPrimaryPaymentMethod = async (paymentMethodId) => {
  const { data } = await apiClient.patch(
    `/api/billing/payment-methods/${paymentMethodId}/primary`,
  );
  return data;
};

/**
 * DELETE /api/billing/payment-methods/{id} — the row's "Remove Card" action.
 *
 * Detaches the card at Razorpay first, so a 502 means the card is still on
 * file rather than half-removed. Removing the primary card promotes the
 * next-oldest one server-side; removing the last one leaves the org with none,
 * and future renewals will fail until another card is added.
 *
 * Returns the whole list back ({ payment_methods, message }), same as the
 * other two write calls — including an empty list, which callers must render
 * rather than mistake for a failed read. Needs billing:manage, so a view-only
 * role gets a 403.
 */
export const removePaymentMethod = async (paymentMethodId) => {
  const { data } = await apiClient.delete(
    `/api/billing/payment-methods/${paymentMethodId}`,
  );
  return data;
};

/** GET /api/billing/history — the Billing History card and bar chart. */
export const getHistory = async ({ months = 6 } = {}) => {
  const { data } = await apiClient.get('/api/billing/history', { params: { months } });
  return data;
};

/**
 * GET /api/billing/usage — the Usage Overview meters.
 *
 * Answers 404 until the org has a subscription. That is "not subscribed
 * yet", not a failure, so callers should treat it as an empty state.
 */
export const getUsage = async () => {
  const { data } = await apiClient.get('/api/billing/usage');
  return data;
};

/**
 * GET /api/billing/storage — the storage breakdown behind "View All".
 *
 * A superset of the "Storage Usage" meter: it adds what is left, and the two
 * thresholds the server judges a warning and a critical state against, along
 * with which of those the org is currently in. Those thresholds are storage's
 * own — nothing in the API applies them to the other metrics.
 *
 * 404s until the org has a subscription, same as /usage.
 */
export const getStorage = async () => {
  const { data } = await apiClient.get('/api/billing/storage');
  return data;
};

/**
 * GET /api/billing/overview — the four KPI cards.
 *
 * Answers 404 until the org has a subscription, same as /usage.
 */
export const getOverview = async () => {
  const { data } = await apiClient.get('/api/billing/overview');
  return data;
};

/**
 * POST /api/billing/refresh — the Refresh button.
 *
 * Re-syncs subscription state from Razorpay, then returns the same shape as
 * /overview. 404s when there is no subscription, same as /overview.
 */
export const refreshBilling = async () => {
  const { data } = await apiClient.post('/api/billing/refresh');
  return data;
};

// ---------------------------------------------------------------------------
// Mock data — still used by every section that isn't wired up yet:
// overview, usage, invoices, history and payment methods.
// ---------------------------------------------------------------------------

const PERIODS = [
  { date: 'Apr 30,2025', period: 'Apr 1 - Apr 30,2025' },
  { date: 'Mar 31,2025', period: 'Mar 1 - Mar 31,2025' },
  { date: 'Feb 28,2025', period: 'Feb 1 - Feb 28,2025' },
  { date: 'Jan 31,2025', period: 'Jan 1 - Jan 31,2025' },
  { date: 'Dec 31,2024', period: 'Dec 1 - Dec 30,2024' },
];

const INVOICES = Array.from({ length: 50 }, (_, index) => {
  const slot = PERIODS[index % PERIODS.length];
  const number = String(12 - (index % 12) || 12).padStart(5, '0');
  return {
    id: `inv-${index + 1}`,
    invoiceNumber: `INV-2025-${number}`,
    date: slot.date,
    period: slot.period,
    amount: '₹2,32,432.00',
    status: 'Paid',
  };
});

const BILLING_DATA = {
  overview: {
    plan: 'Enterprise',
    billingCadence: 'Billed Monthly',
    period: 'May 1 – May 31, 2025',
    daysRemaining: 21,
    amountDue: '₹2,32,432.00',
    dueOn: 'Due on May 31, 2025',
    lastPayment: '₹2,32,432.00',
    lastPaymentOn: 'paid on Apr 30, 2025',
  },
  usage: [
    { id: 'users', label: 'Active Users', percent: 43, value: '86 / 200', limit: 'Limit: 200 Users' },
    { id: 'storage', label: 'Storage Usage', percent: 60, value: '1.2 TB / 2 TB', limit: 'Limit: 2 TB' },
    { id: 'reports', label: 'Reports Generated', percent: 25, value: '1,245 / 5,000', limit: 'Limit: 5,000 Reports' },
    { id: 'dashboards', label: 'Active Dashboards', percent: 48, value: '48 / 100', limit: 'Limit: 100 Dashboards' },
    { id: 'processing', label: 'Data Processing', percent: 50, value: '2.5 TB / 5 TB', limit: 'Limit: 5 TB' },
  ],
  invoices: INVOICES,
  history: {
    totalPaid: '₹27,89,178.00',
    totalInvoices: '16',
    outstanding: '₹0.00',
    bars: [
      { month: 'Jan', value: '35,000', height: 35, color: '#D8BFF2' },
      { month: 'Feb', value: '60,000', height: 60, color: '#C8D8F9' },
      { month: 'Mar', value: '85,000', height: 85, color: '#446665' },
      { month: 'Apr', value: '49,000', height: 49, color: 'rgba(19, 75, 74, 0.5)' },
      { month: 'May', value: '45,000', height: 45, color: 'rgba(112, 169, 168, 0.7)' },
      { month: 'Jun', value: '55,000', height: 55, color: '#EFB2B3' },
    ],
  },
  paymentMethods: [
    { id: 'card-1', brand: 'visa', label: 'Visa ending in 4242', expiry: 'Expires 12/2027', isPrimary: true },
    { id: 'card-2', brand: 'mastercard', label: 'Visa ending in 4346', expiry: 'Expires 12/2027', isPrimary: false },
    { id: 'card-3', brand: 'mastercard', label: 'Visa ending in 5673', expiry: 'Expires 12/2027', isPrimary: false }
  ],
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹3,000',
      cadence: '/monthly',
      description:
        'Ideal for startups and small teams who want to explore cloud solutions with essential tools.',
      features: ['Up to 5 Users', '10 GB Storage', '100 Reports / Month', '24/7 Support'],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '₹8,000',
      cadence: '/monthly',
      description: 'For growing teams needing more power, storage, and smarter collaboration.',
      features: ['Up to 20 Users', '100 GB Storage', '1,000 Reports / Month', '24/7 Support'],
      featured: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹20,000',
      cadence: '/monthly',
      description:
        'For large organizations that need top security, high performance, and dedicated support.',
      features: ['Up to 200 Users', '2 TB Storage', '5,000 Reports / Month', '24/7 Support'],
    },
  ],
  currentPlanId: 'professional',
};

export const getBillingData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return BILLING_DATA;
};
