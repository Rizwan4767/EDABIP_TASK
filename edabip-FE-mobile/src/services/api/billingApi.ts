import { Platform, Share } from 'react-native';
import {
  EncodingType,
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ApiError, getErrorMessage } from '@/services/api/apiError';
import { apiClient } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';

export type BillingJson = Record<string, unknown>;

export interface PaymentVerificationOrder {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  customer_id: string;
}

export interface AttachPaymentMethodPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  setPrimary?: boolean;
}

/** FastAPI `detail` may be a string or a 422 list — callers want one line. */
export function billingErrorDetail(error: unknown, fallback = ''): string {
  if (error instanceof ApiError && error.message.trim()) return error.message.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

/**
 * Key identifying one money-moving intent so the server can tell a retry from
 * a fresh attempt. Minted when the plan dialog opens and reused until it closes.
 */
export function newIdempotencyKey(): string {
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(binary);

  // Hermes / older RN without btoa — fall back via Buffer when available.
  const BufferCtor = (
    globalThis as {
      Buffer?: { from: (data: string, enc: string) => { toString: (enc: string) => string } };
    }
  ).Buffer;
  if (BufferCtor) return BufferCtor.from(binary, 'binary').toString('base64');

  throw new Error('Unable to encode invoice PDF for sharing.');
}

async function shareInvoicePdf(file: {
  bytes: ArrayBuffer;
  filename: string;
  contentType: string;
}): Promise<void> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([file.bytes], { type: file.contentType || 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const directory = cacheDirectory ?? documentDirectory;
  if (!directory) {
    await Share.share({
      title: file.filename,
      message: `EDABIP tax invoice ${file.filename}`,
    });
    return;
  }

  const path = `${directory}${file.filename}`;
  await writeAsStringAsync(path, arrayBufferToBase64(file.bytes), {
    encoding: EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: file.contentType || 'application/pdf',
      dialogTitle: file.filename,
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  await Share.share({
    title: file.filename,
    url: path,
    message: `EDABIP tax invoice ${file.filename}`,
  });
}

async function getAllPages<T extends { items?: unknown[]; total_pages?: number }>(
  fetchPage: (page: number) => Promise<T>,
  { maxPages = 20 }: { maxPages?: number } = {},
): Promise<T> {
  const first = await fetchPage(1);
  const totalPages = Math.min(first.total_pages ?? 1, maxPages);
  if (totalPages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2)),
  );

  return {
    ...first,
    items: rest.reduce<unknown[]>(
      (all, payload) => all.concat(payload.items ?? []),
      [...(first.items ?? [])],
    ),
  };
}

export const billingApi = {
  getOverview: () => apiClient.get<BillingJson>(ENDPOINTS.billing.overview),
  refresh: () => apiClient.post<BillingJson>(ENDPOINTS.billing.refresh),
  getUsage: () => apiClient.get<BillingJson>(ENDPOINTS.billing.usage),
  getStorage: () => apiClient.get<BillingJson>(ENDPOINTS.billing.storage),
  getHistory: ({ months = 6 }: { months?: number } = {}) =>
    apiClient.get<BillingJson>(ENDPOINTS.billing.history, { query: { months } }),
  getPlans: () => apiClient.get<BillingJson>(ENDPOINTS.billing.plans),
  selectPlan: (
    planCode: string,
    {
      paymentMethodId = null,
      idempotencyKey = newIdempotencyKey(),
    }: { paymentMethodId?: string | null; idempotencyKey?: string } = {},
  ) =>
    apiClient.post<BillingJson>(ENDPOINTS.billing.selectPlan(planCode), {
      confirmed: true,
      payment_method_id: paymentMethodId,
      idempotency_key: idempotencyKey,
    }),
  getInvoices: ({
    page = 1,
    pageSize = 100,
    search,
  }: { page?: number; pageSize?: number; search?: string } = {}) =>
    apiClient.get<BillingJson>(ENDPOINTS.billing.invoices, {
      query: { page, page_size: pageSize, search },
    }),
  getAllInvoices: async () =>
    getAllPages((page) => billingApi.getInvoices({ page, pageSize: 100 })),
  getPaymentMethods: () => apiClient.get<unknown>(ENDPOINTS.billing.paymentMethods),
  createPaymentMethodSetupIntent: () =>
    apiClient.post<PaymentVerificationOrder>(ENDPOINTS.billing.paymentMethodSetupIntent),
  attachPaymentMethod: ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    setPrimary = false,
  }: AttachPaymentMethodPayload) =>
    apiClient.post<BillingJson>(ENDPOINTS.billing.paymentMethods, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      set_primary: setPrimary,
    }),
  setPrimaryPaymentMethod: (paymentMethodId: string) =>
    apiClient.patch<BillingJson>(ENDPOINTS.billing.paymentMethodPrimary(paymentMethodId)),
  removePaymentMethod: (paymentMethodId: string) =>
    apiClient.delete<BillingJson>(ENDPOINTS.billing.paymentMethod(paymentMethodId)),
  getPaymentHistory: ({
    page = 1,
    pageSize = 100,
    status,
    search,
  }: { page?: number; pageSize?: number; status?: string; search?: string } = {}) =>
    apiClient.get<BillingJson>(ENDPOINTS.billing.paymentHistory, {
      query: { page, page_size: pageSize, status, search },
    }),
  getAllPayments: async () =>
    getAllPages((page) => billingApi.getPaymentHistory({ page, pageSize: 100 })),
  getProfile: () => apiClient.get(ENDPOINTS.billing.profile),
  updateProfile: (payload: Record<string, unknown>) =>
    apiClient.put(ENDPOINTS.billing.profile, payload),
  downloadInvoicePdf: async (invoiceNumber: string) => {
    const file = await apiClient.getBinary(ENDPOINTS.billing.invoiceDownload(invoiceNumber));
    await shareInvoicePdf(file);
    return file;
  },
  errorMessage: getErrorMessage,
  billingErrorDetail,
};
