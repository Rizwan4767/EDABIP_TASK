import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { LandingHeroArt } from '@/screens/landing/components/LandingHeroArt';
import { LandingIcon } from '@/screens/landing/components/LandingIcon';
import { useLandingStyles } from '@/screens/landing/LandingStylesContext';
import { landingChips, landingHighlights } from '@/screens/landing/landingData';

export function LandingHero({
  onCreateAccount,
  onGetStarted,
}: Readonly<{
  onCreateAccount: () => void;
  onGetStarted: () => void;
}>) {
  const { layout, styles } = useLandingStyles();

  return (
    <View style={styles.heroWrap}>
      <View style={styles.heroArt} pointerEvents="none">
        <LandingHeroArt size={layout.artSize} />
      </View>

      <View style={styles.heroContent}>
        <View style={styles.chips}>
          {landingChips.map((chip) => (
            <View key={chip.label} style={[styles.chip, { backgroundColor: chip.backgroundColor }]}>
              <AppText style={styles.chipLabel}>{chip.label}</AppText>
            </View>
          ))}
        </View>

        <AppText style={styles.title}>
          {`Transform\nEnterprise Data into\n`}
          <AppText style={styles.titleAccent}>Intelligent</AppText>
          {' Decision'}
        </AppText>

        <AppText style={styles.subtitle}>
          Unify your enterprise data, analytics, and AI to make faster, smarter business decisions
          with a single intelligent platform.
        </AppText>

        <View style={styles.ctaRow}>
          <Pressable
            onPress={onCreateAccount}
            style={styles.ctaOutline}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <AppText style={styles.ctaOutlineLabel}>Create Account</AppText>
          </Pressable>
          <Pressable
            onPress={onGetStarted}
            style={styles.ctaSolid}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <AppText style={styles.ctaSolidLabel}>Get Started</AppText>
          </Pressable>
        </View>

        <View style={styles.highlightRow}>
          {landingHighlights.map((item) => (
            <View key={item.label} style={styles.highlight}>
              <LandingIcon
                icon={item.icon}
                width={Math.round(item.width * layout.scale)}
                height={Math.round(item.height * layout.scale)}
              />
              <AppText style={styles.highlightLabel}>{item.label}</AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
