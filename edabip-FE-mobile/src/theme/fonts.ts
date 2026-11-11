import { Platform } from 'react-native';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/** Font map handed to `useFonts()` on native. Web uses CSS @font-face instead. */
export const appFonts = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} as const;

const WEB_FONT_STYLE_ID = 'edabip-inter-font-faces';

/**
 * On web, `expo-font` + fontfaceobserver often times out (12s) even when Inter
 * is available. Register the same Expo family names via CSS so existing
 * `fontFamily: 'Inter_400Regular'` styles keep working without the observer.
 */
export function ensureWebInterFonts(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(WEB_FONT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = WEB_FONT_STYLE_ID;
  style.textContent = `
@font-face {
  font-family: 'Inter_400Regular';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-400-normal.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter_500Medium';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-500-normal.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter_600SemiBold';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-600-normal.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter_700Bold';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-700-normal.woff2') format('woff2');
}
`.trim();
  document.head.appendChild(style);
}
