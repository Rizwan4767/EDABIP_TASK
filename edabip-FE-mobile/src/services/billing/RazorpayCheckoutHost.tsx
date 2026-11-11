import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import {
  buildNativeCheckoutHtml,
  CheckoutDismissedError,
  CheckoutFailedError,
  clearNativeCheckoutRequest,
  getNativeCheckoutRequest,
  subscribeNativeCheckout,
  type CheckoutResult,
  type NativeCheckoutRequest,
} from '@/services/billing/razorpayCheckout';
import { razorpayCheckoutHostStyles as styles } from '@/services/billing/razorpayCheckoutHostStyles';

/**
 * Mount once near the app root. When billing asks to add a card on native,
 * this opens Razorpay Standard Checkout inside a WebView — same contract as
 * the web app, without the broken react-native-razorpay native module.
 */
export function RazorpayCheckoutHost() {
  const theme = useTheme();
  const [request, setRequest] = useState<NativeCheckoutRequest | null>(null);

  useEffect(() => {
    const sync = () => setRequest(getNativeCheckoutRequest());
    sync();
    return subscribeNativeCheckout(sync);
  }, []);

  if (!request) return null;

  const html = buildNativeCheckoutHtml(request.order, request.customer);

  const finish = (error?: Error, result?: CheckoutResult) => {
    const active = request;
    clearNativeCheckoutRequest();
    setRequest(null);
    if (result) active.resolve(result);
    else active.reject(error ?? new CheckoutFailedError());
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        description?: string;
        response?: CheckoutResult;
      };

      if (message.type === 'success' && message.response) {
        finish(undefined, {
          razorpay_order_id: message.response.razorpay_order_id || request.order.order_id,
          razorpay_payment_id: message.response.razorpay_payment_id,
          razorpay_signature: message.response.razorpay_signature,
        });
        return;
      }

      if (message.type === 'dismiss') {
        finish(new CheckoutDismissedError());
        return;
      }

      finish(new CheckoutFailedError(message.description || 'Payment was declined.'));
    } catch {
      finish(new CheckoutFailedError('Checkout returned an invalid response.'));
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => finish(new CheckoutDismissedError())}
    >
      <View style={[styles.root, { backgroundColor: theme.colors.brand }]}>
        <View style={styles.header}>
          <AppText variant="h3" color="textOnBrand" style={styles.title}>
            Add payment method
          </AppText>
          <Pressable
            onPress={() => finish(new CheckoutDismissedError())}
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Cancel checkout"
          >
            <AppText variant="button" color="textOnBrand">
              Cancel
            </AppText>
          </Pressable>
        </View>

        <View style={styles.webWrap}>
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://api.razorpay.com' }}
            onMessage={onMessage}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.colors.textOnBrand} />
              </View>
            )}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            style={styles.webview}
          />
        </View>
      </View>
    </Modal>
  );
}
