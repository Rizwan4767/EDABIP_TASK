import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, View } from 'react-native';

import { EdabipLogo } from '@/components/brand/EdabipLogo';
import { AppText } from '@/components/common/AppText';
import { authMobileHeroStyles as styles } from '@/screens/auth/components/authMobileHeroStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';

const roboticHand = require('@/assets/images/auth-robotic-hand.png');
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Same shared marketing carousel as Login/Signup (AuthMobileHero), just with
 * a screen-specific first slide — confirmed against the Figma prototype,
 * which cycles "Forgot Password?" -> "Meet your new business intelligence"
 * -> "From data to decisions." on this screen.
 */
const SLIDES = [
  {
    // Hard line breaks here instead of relying on auto-wrap — the app's font
    // wraps "Forgot Password?" onto one line, but Figma's design shows it
    // as two, and this guarantees the same break regardless of font metrics.
    title: 'Forgot\nPassword?',
    description:
      "No worries! Enter your email address and we'll send you a link to reset your password and get back to your account.",
    // Figma width for this screen-specific slide isn't captured here; falls
    // back to the shared layout.descriptionMaxWidth (254) below.
    descriptionWidth: null,
  },
  {
    title: 'Meet your new business intelligence',
    description:
      'Sign into continue to your EDABIP dashboard and accelerate your analytics journey',
    descriptionWidth: 254,
  },
  {
    title: 'From data to decisions.',
    description: 'Transform complex data into clear insights that help you act with confidence.',
    descriptionWidth: 219,
  },
] as const;

const ROTATE_MS = 3000;
const FADE_MS = 350;

/**
 * Forgot-password hero — Figma Component83 frame: 358 × 154.
 */
export function AuthForgotPasswordHero() {
  const layout = useAuthSignupLayout();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const timer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (!finished || !isMounted.current) return;

        setActiveIndex((current) => (current + 1) % SLIDES.length);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      });
    }, ROTATE_MS);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  const slide = SLIDES[activeIndex] ?? SLIDES[0];

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
          <Animated.View
            style={[styles.copy, { maxWidth: layout.descriptionMaxWidth, opacity: fadeAnim }]}
          >
            <View
              style={{
                minHeight: layout.carouselTitleMinHeight,
                justifyContent: 'flex-end',
                paddingBottom: 8,
              }}
            >
              <AppText
                style={[
                  styles.title,
                  {
                    fontSize: layout.titleSize,
                    lineHeight: layout.titleLineHeight,
                    maxWidth: layout.copyMaxWidth,
                  },
                ]}
              >
                {slide.title}
              </AppText>
            </View>
            <AppText
              style={[
                styles.description,
                {
                  fontSize: layout.descriptionSize,
                  lineHeight: layout.descriptionLineHeight,
                  maxWidth: slide.descriptionWidth
                    ? Math.round(slide.descriptionWidth * layout.scale)
                    : layout.descriptionMaxWidth,
                  minHeight: layout.carouselDescriptionMinHeight,
                },
              ]}
            >
              {slide.description}
            </AppText>
          </Animated.View>
        </View>

        <View
          style={[styles.dots, { height: layout.carouselDotsHeight }]}
          accessibilityRole="tablist"
        >
          {SLIDES.map((item, index) => (
            <Pressable
              key={item.title}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === activeIndex }}
              accessibilityLabel={`Slide ${index + 1}`}
              onPress={() => setActiveIndex(index)}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
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
