import { Image, View } from 'react-native';

import { EdabipLogo } from '@/components/brand/EdabipLogo';
import { AppText } from '@/components/common/AppText';
import { authMobileHeroStyles as styles } from '@/screens/auth/components/authMobileHeroStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';

const roboticHand = require('@/assets/images/auth-robotic-hand.png');

/** Reset-password hero — Figma frame: 358 × 154. */
export function AuthResetPasswordHero() {
  const layout = useAuthSignupLayout();

  return (
    <View style={[styles.wrap, { paddingLeft: layout.hPad }]} accessibilityRole="header">
      <View style={styles.logoRow}>
        <EdabipLogo width={layout.logoWidth} height={layout.logoHeight} />
      </View>

      <View
        style={[
          styles.carousel,
          {
            width: layout.carouselWidth,
            height: layout.forgotCarouselHeight,
            marginTop: layout.carouselMarginTop,
          },
        ]}
      >
        <View style={[styles.copySlot, { height: layout.forgotCarouselCopyHeight }]}>
          <View style={[styles.copy, { maxWidth: layout.copyMaxWidth }]}>
            <AppText
              style={[
                styles.title,
                {
                  fontSize: layout.titleSize,
                  lineHeight: layout.titleLineHeight,
                },
              ]}
            >
              Create a New Password
            </AppText>
            <AppText
              style={[
                styles.description,
                {
                  fontSize: layout.descriptionSize,
                  lineHeight: layout.descriptionLineHeight,
                  maxWidth: layout.copyMaxWidth + 36,
                },
              ]}
            >
              Set a strong new password to secure your EDABIP account and keep your data and
              insights safe.
            </AppText>
          </View>
        </View>

        <View
          style={[styles.dots, { height: layout.carouselDotsHeight }]}
          accessibilityRole="tablist"
        >
          <View style={[styles.dot, styles.dotActive]} accessibilityLabel="Step 1" />
          <View style={styles.dot} accessibilityLabel="Step 2" />
          <View style={styles.dot} accessibilityLabel="Step 3" />
        </View>
      </View>

      <Image
        source={roboticHand}
        style={[
          styles.hand,
          {
            width: layout.handWidth,
            height: layout.handHeight,
            top: layout.logoHeight + layout.carouselMarginTop + layout.handTop,
            right: layout.handRight,
          },
        ]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}
