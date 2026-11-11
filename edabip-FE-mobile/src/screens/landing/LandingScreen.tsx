import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { ThemeSchemeOverride } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { LandingFooter } from '@/screens/landing/components/LandingFooter';
import { LandingHero } from '@/screens/landing/components/LandingHero';
import { LandingOverview } from '@/screens/landing/components/LandingOverview';
import { LandingSovereignty } from '@/screens/landing/components/LandingSovereignty';
import { LandingWhiteCard } from '@/screens/landing/components/LandingWhiteCard';
import { LandingStylesProvider, useLandingStyles } from '@/screens/landing/LandingStylesContext';
import {
  lifecycleCards,
  moduleCards,
  pillarCards,
  type LandingSectionId,
} from '@/screens/landing/landingData';

export function LandingScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <LandingStylesProvider>
        <LandingCanvas />
      </LandingStylesProvider>
    </ThemeSchemeOverride>
  );
}

function LandingCanvas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { styles } = useLandingStyles();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<LandingSectionId, number>>({
    overview: 0,
    modules: 0,
    lifecycle: 0,
    pillars: 0,
    subscribe: 0,
  });

  const goLogin = () => router.push(ROUTES.auth.login);
  const goSignup = () => router.push(ROUTES.auth.signup);

  const scrollToSection = (section: LandingSectionId) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, sectionY.current[section] - 12), animated: true });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.heroSafe, { paddingTop: insets.top }]}>
            <LandingHero onCreateAccount={goSignup} onGetStarted={goLogin} />
          </View>

          <View
            onLayout={(event) => {
              sectionY.current.overview = event.nativeEvent.layout.y;
            }}
          >
            <LandingOverview />
          </View>

          <View
            style={styles.whiteSection}
            onLayout={(event) => {
              sectionY.current.modules = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle}>Modular Ecosystem</AppText>
              <AppText style={styles.sectionSubtitle}>
                Enable your teams with powerful modules that fit your business needs.
                Precision-engineered components designed for enterprise-scale operations.
              </AppText>
            </View>
            {moduleCards.map((card) => (
              <LandingWhiteCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                body={card.body}
                meta={card.meta}
                onViewMore={card.showViewMore ? goLogin : undefined}
              />
            ))}
          </View>

          <View
            style={styles.whiteSection}
            onLayout={(event) => {
              sectionY.current.lifecycle = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle}>The EDABIP Lifecycle</AppText>
              <AppText style={styles.sectionSubtitle}>
                From raw data to actionable insights through a precision-engineered process designed
                for enterprise scale.
              </AppText>
            </View>
            {lifecycleCards.map((card) => (
              <LandingWhiteCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                body={card.body}
                phase={card.phase}
                onViewMore={goLogin}
              />
            ))}
          </View>

          <View style={styles.whiteSection}>
            <LandingSovereignty onViewMore={goLogin} />
          </View>

          <View
            style={styles.whiteSection}
            onLayout={(event) => {
              sectionY.current.pillars = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle}>The Four Pillars of Sovereignty</AppText>
              <AppText style={styles.sectionSubtitle}>
                Our zero-trust architecture ensures that your data remains yours, from the moment of
                ingestion to the final insight.
              </AppText>
            </View>
            {pillarCards.map((card) => (
              <LandingWhiteCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                body={card.body}
                tag={card.tag}
                onViewMore={goLogin}
              />
            ))}
          </View>

          <View
            onLayout={(event) => {
              sectionY.current.subscribe = event.nativeEvent.layout.y;
            }}
          >
            <LandingFooter bottomInset={insets.bottom} onNavigateSection={scrollToSection} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
