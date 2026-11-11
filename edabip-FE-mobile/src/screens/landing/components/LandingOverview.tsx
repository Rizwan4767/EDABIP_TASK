import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { LandingIcon } from '@/screens/landing/components/LandingIcon';
import { useLandingStyles } from '@/screens/landing/LandingStylesContext';
import { overviewSteps } from '@/screens/landing/landingData';

export function LandingOverview() {
  const { layout, styles } = useLandingStyles();

  return (
    <View style={styles.overview}>
      <View style={styles.overviewHeader}>
        <AppText style={styles.overviewTitle}>Platform Overview</AppText>
        <AppText style={styles.overviewSubtitle}>
          Everything you need to your business smarter and faster
        </AppText>
      </View>

      {overviewSteps.map((step) => (
        <View key={step.step} style={styles.overviewCard}>
          <View style={styles.overviewHeading}>
            <View style={styles.stepBadge}>
              <AppText style={styles.stepBadgeLabel}>{step.step}</AppText>
            </View>
            <AppText style={styles.overviewCardTitle}>{step.title}</AppText>
          </View>
          <AppText style={styles.overviewBody}>{step.body}</AppText>
          <View style={styles.featureCard}>
            <View style={styles.featureTitleRow}>
              <LandingIcon
                icon={step.featureIcon}
                width={Math.max(14, Math.round(step.featureIconWidth * layout.scale))}
                height={Math.max(14, Math.round(step.featureIconHeight * layout.scale))}
              />
              <AppText style={styles.featureTitle}>{step.featureTitle}</AppText>
            </View>
            <View style={styles.bulletGrid}>
              {step.bullets.map((bullet) => (
                <View key={bullet} style={styles.bulletItem}>
                  <AppText style={styles.bulletDot}>•</AppText>
                  <AppText
                    style={styles.bulletText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {bullet}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
