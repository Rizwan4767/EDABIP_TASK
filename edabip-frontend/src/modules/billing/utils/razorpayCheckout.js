/**
 * Razorpay Checkout — backs the "+ Add New Payment Method" button.
 *
 * The card number never reaches this app or our own server. Checkout collects
 * it in Razorpay's overlay; all we get back is an order/payment/signature
 * triple, which POST /api/billing/payment-methods verifies server-side before
 * saving the resulting token.
 *
 * The charge Checkout puts through is the ₹1 verification order the backend
 * created (RAZORPAY_CARD_VERIFICATION_AMOUNT). The backend refunds it as part
 * of verify_and_save_card, so the user is not out any money for adding a card.
 */

const CHECKOUT_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * The user closed Checkout without finishing. Callers treat this as a
 * cancellation, not a failure — it earns no error toast.
 */
export class CheckoutDismissedError extends Error {
  constructor() {
    super('Razorpay Checkout was dismissed.');
    this.name = 'CheckoutDismissedError';
  }
}

/** Razorpay declined the card, or the overlay itself could not be opened. */
export class CheckoutFailedError extends Error {
  constructor(message) {
    super(message || 'Razorpay Checkout failed.');
    this.name = 'CheckoutFailedError';
  }
}

// The SDK is fetched on first use rather than in index.html: the billing page
// is one screen out of many, and nothing else in the app needs it. Cached in a
// module-level promise so opening the flow twice reuses the same <script>.
let sdkPromise = null;

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SDK_URL;
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new CheckoutFailedError('Razorpay Checkout did not load.'));
    };

    script.onerror = () => {
      // Clear the cache so a later attempt can retry rather than replaying
      // this rejection forever — a blocked script is usually transient
      // (offline, ad blocker toggled off since).
      sdkPromise = null;
      script.remove();
      reject(new CheckoutFailedError('Razorpay Checkout could not be reached.'));
    };

    document.body.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Opens Checkout against the verification order from
 * POST /api/billing/payment-methods/setup-intent.
 *
 * Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * — exactly the body AttachPaymentMethodIn expects.
 *
 * Only two things settle this promise: `handler` (the payment went through)
 * and `ondismiss` (the overlay closed). A declined card is neither — Checkout
 * keeps the overlay open so the user can try a different card, and that retry
 * fires `handler` normally. Rejects with CheckoutFailedError if a payment
 * failed and the user then gave up, CheckoutDismissedError if they closed it
 * without trying anything.
 */
export async function openCardCheckout(
  order,
  { customerName, customerEmail, customerContact } = {},
) {
  const Razorpay = await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    // Checkout fires `ondismiss` after a successful payment too, since the
    // overlay closes either way. This keeps the late dismiss from rejecting a
    // promise the handler already resolved.
    let settled = false;

    // Description of the most recent declined attempt, if any. Recorded
    // rather than acted on: it only matters once the user stops retrying.
    let lastFailure = '';

    const checkout = new Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: 'EDABIP',
      description: 'Add a payment method for billing',
      // Which Razorpay customer the token gets minted against. Setting
      // customer_id on the order alone is NOT enough — Standard Checkout
      // only tokenizes under a customer when it is handed the id here.
      // Without it the payment still succeeds, but Razorpay files the card
      // under the payer's phone number instead and the attach call finds no
      // token on the customer.
      customer_id: order.customer_id,
      // Ask Razorpay to tokenize the card. Without this the verification
      // payment still succeeds, but no reusable token is created and the
      // attach call has nothing to save.
      save: 1,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        // Razorpay keys saved cards on the contact number too, so a blank
        // one here can leave the token off the customer even with
        // customer_id set.
        contact: customerContact || '',
      },
      handler: (response) => {
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
          // The overlay closing is the only signal that the user is done.
          // If they hit a decline on the way out, say so — they saw an
          // error and a silent cancellation would look like the app lost
          // their attempt.
          reject(
            lastFailure
              ? new CheckoutFailedError(lastFailure)
              : new CheckoutDismissedError(),
          );
        },
      },
    });

    // Deliberately does NOT settle the promise. Razorpay leaves the overlay
    // open after a decline so the user can try another card, and a retry that
    // succeeds fires `handler` as usual. Rejecting here would settle while
    // Checkout is still on screen: the user would get an error toast mid-flow,
    // and the successful retry behind it would be dropped, leaving a card
    // charged for verification but never saved.
    checkout.on('payment.failed', (event) => {
      lastFailure = event?.error?.description || 'Payment was declined.';
    });

    checkout.open();
  });
}
