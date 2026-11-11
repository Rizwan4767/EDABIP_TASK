/**
 * Razorpay Checkout — backs "+ Add New Payment Method".
 *
 * The card number never reaches this app or our server. Checkout collects it
 * in Razorpay's overlay; we only get an order/payment/signature triple, which
 * POST /api/billing/payment-methods verifies before saving the token.
 *
 * Web uses checkout.js in the browser. Native uses the same checkout.js inside
 * a WebView (react-native-razorpay crashes under Expo's New Architecture).
 */
import { Platform } from 'react-native';

import type { PaymentVerificationOrder } from '@/services/api/billingApi';

const CHECKOUT_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export class CheckoutDismissedError extends Error {
  constructor() {
    super('Razorpay Checkout was dismissed.');
    this.name = 'CheckoutDismissedError';
  }
}

export class CheckoutFailedError extends Error {
  constructor(message?: string) {
    super(message || 'Razorpay Checkout failed.');
    this.name = 'CheckoutFailedError';
  }
}

export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CheckoutCustomer {
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
}

export interface NativeCheckoutRequest {
  order: PaymentVerificationOrder;
  customer: CheckoutCustomer;
  resolve: (result: CheckoutResult) => void;
  reject: (error: Error) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (event: { error?: { description?: string } }) => void) => void;
};

declare global {
  var Razorpay: RazorpayConstructor | undefined;
}

let sdkPromise: Promise<RazorpayConstructor> | null = null;
let nativeRequest: NativeCheckoutRequest | null = null;
const nativeListeners = new Set<() => void>();

export function subscribeNativeCheckout(listener: () => void): () => void {
  nativeListeners.add(listener);
  return () => {
    nativeListeners.delete(listener);
  };
}

export function getNativeCheckoutRequest(): NativeCheckoutRequest | null {
  return nativeRequest;
}

export function clearNativeCheckoutRequest(): void {
  nativeRequest = null;
  nativeListeners.forEach((listener) => listener());
}

function notifyNativeListeners(): void {
  nativeListeners.forEach((listener) => listener());
}

function loadWebCheckout(): Promise<RazorpayConstructor> {
  if (typeof document === 'undefined') {
    return Promise.reject(new CheckoutFailedError('Razorpay Checkout requires a browser.'));
  }
  if (globalThis.Razorpay) return Promise.resolve(globalThis.Razorpay);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (globalThis.Razorpay) resolve(globalThis.Razorpay);
      else reject(new CheckoutFailedError('Razorpay Checkout did not load.'));
    };
    script.onerror = () => {
      sdkPromise = null;
      script.remove();
      reject(new CheckoutFailedError('Razorpay Checkout could not be reached.'));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}

function openWebCheckout(
  order: PaymentVerificationOrder,
  customer: CheckoutCustomer,
): Promise<CheckoutResult> {
  return loadWebCheckout().then(
    (Razorpay) =>
      new Promise((resolve, reject) => {
        let settled = false;
        let lastFailure = '';

        const checkout = new Razorpay({
          key: order.key_id,
          order_id: order.order_id,
          amount: order.amount,
          currency: order.currency,
          name: 'EDABIP',
          description: 'Add a payment method for billing',
          customer_id: order.customer_id,
          save: 1,
          prefill: {
            name: customer.customerName || '',
            email: customer.customerEmail || '',
            contact: customer.customerContact || '',
          },
          handler: (response: CheckoutResult) => {
            settled = true;
            resolve({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              if (settled) return;
              settled = true;
              reject(
                lastFailure ? new CheckoutFailedError(lastFailure) : new CheckoutDismissedError(),
              );
            },
          },
        });

        checkout.on('payment.failed', (event) => {
          lastFailure = event?.error?.description || 'Payment was declined.';
        });

        checkout.open();
      }),
  );
}

function openNativeCheckout(
  order: PaymentVerificationOrder,
  customer: CheckoutCustomer,
): Promise<CheckoutResult> {
  if (nativeRequest) {
    return Promise.reject(new CheckoutFailedError('A checkout session is already open.'));
  }

  return new Promise((resolve, reject) => {
    nativeRequest = { order, customer, resolve, reject };
    notifyNativeListeners();
  });
}

/** HTML document that boots Standard Checkout inside a native WebView. */
export function buildNativeCheckoutHtml(
  order: PaymentVerificationOrder,
  customer: CheckoutCustomer,
): string {
  const payload = JSON.stringify({
    key: order.key_id,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency,
    customer_id: order.customer_id,
    name: customer.customerName || '',
    email: customer.customerEmail || '',
    contact: customer.customerContact || '',
  });

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>EDABIP Checkout</title>
    <style>
      html, body { margin: 0; background: #134B4A; height: 100%; }
      .status {
        color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px; text-align: center; padding: 24px 16px;
      }
    </style>
  </head>
  <body>
    <p class="status">Opening secure card checkout…</p>
    <script src="${CHECKOUT_SDK_URL}"></script>
    <script>
      (function () {
        var payload = ${payload};
        var settled = false;
        var lastFailure = '';

        function post(message) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        }

        if (typeof Razorpay !== 'function') {
          post({ type: 'failed', description: 'Razorpay Checkout did not load.' });
          return;
        }

        var checkout = new Razorpay({
          key: payload.key,
          order_id: payload.order_id,
          amount: payload.amount,
          currency: payload.currency,
          name: 'EDABIP',
          description: 'Add a payment method for billing',
          customer_id: payload.customer_id,
          save: 1,
          prefill: {
            name: payload.name,
            email: payload.email,
            contact: payload.contact
          },
          handler: function (response) {
            settled = true;
            post({ type: 'success', response: response });
          },
          modal: {
            ondismiss: function () {
              if (settled) return;
              settled = true;
              if (lastFailure) {
                post({ type: 'failed', description: lastFailure });
              } else {
                post({ type: 'dismiss' });
              }
            }
          }
        });

        checkout.on('payment.failed', function (event) {
          lastFailure = (event && event.error && event.error.description) || 'Payment was declined.';
        });

        checkout.open();
      })();
    </script>
  </body>
</html>`;
}

export async function openCardCheckout(
  order: PaymentVerificationOrder,
  customer: CheckoutCustomer = {},
): Promise<CheckoutResult> {
  if (Platform.OS === 'web') {
    return openWebCheckout(order, customer);
  }
  return openNativeCheckout(order, customer);
}
