import { StyleSheet } from 'react-native';

export const razorpayCheckoutHostStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { flex: 1, marginRight: 12 },
  webWrap: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#134B4A',
  },
});
