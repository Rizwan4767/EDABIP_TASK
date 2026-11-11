import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { EmailIcon, LogoMarkIcon, SocialIcons } from '@/assets/landing';
import { AppText } from '@/components/common/AppText';
import { LandingIcon } from '@/screens/landing/components/LandingIcon';
import { useLandingStyles } from '@/screens/landing/LandingStylesContext';
import { footerColumns, type LandingSectionId } from '@/screens/landing/landingData';
import { isValidEmail } from '@/utils/validation';

export function LandingFooter({
  bottomInset,
  onNavigateSection,
}: Readonly<{
  bottomInset: number;
  onNavigateSection: (section: LandingSectionId) => void;
}>) {
  const { layout, styles } = useLandingStyles();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');

  const onSubscribe = () => {
    if (!isValidEmail(email)) {
      setStatus('error');
      return;
    }
    setStatus('success');
  };

  return (
    <View style={[styles.footer, { paddingBottom: 16 + bottomInset }]}>
      <View style={styles.newsletter}>
        <View style={styles.newsletterCopy}>
          <AppText style={styles.newsletterTitle}>Insights for decision makers</AppText>
          <AppText style={styles.newsletterBody}>
            Join 25,000+ BI professionals receiving our weekly enterprise data brief.
          </AppText>
        </View>

        <View style={styles.newsletterForm}>
          <View style={styles.emailField}>
            <LandingIcon
              icon={EmailIcon}
              width={Math.round(12 * layout.scale)}
              height={Math.round(10 * layout.scale)}
            />
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (status !== 'idle') setStatus('idle');
              }}
              placeholder="Enter your business email"
              placeholderTextColor="#134B4A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              accessibilityLabel="Business email"
              style={styles.emailInput}
              returnKeyType="done"
              onSubmitEditing={onSubscribe}
            />
          </View>
          <Pressable
            onPress={onSubscribe}
            style={styles.subscribeButton}
            accessibilityRole="button"
            accessibilityLabel="Subscribe Now"
          >
            <AppText style={styles.subscribeLabel}>Subscribe Now</AppText>
          </Pressable>
          {status === 'error' ? (
            <AppText style={[styles.subscribeMessage, styles.subscribeError]}>
              Enter a valid business email address.
            </AppText>
          ) : null}
          {status === 'success' ? (
            <AppText style={styles.subscribeMessage}>
              Thanks — you are on the list for the next briefing.
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.footerDivider} />

      <View>
        <View style={styles.brandRow}>
          <LandingIcon
            icon={LogoMarkIcon}
            width={layout.logoWidth}
            height={layout.logoHeight}
            accessibilityLabel="EDABIP mark"
          />
          <AppText style={styles.brandName}>EDABIP</AppText>
        </View>
        <AppText style={styles.copyright}>
          © 2026 EDABIP. Enterprise Data Analytics & Business Intelligence Platform.
        </AppText>
      </View>

      <View style={styles.footerColumns}>
        {footerColumns.map((column) => (
          <View key={column.title} style={styles.footerColumn}>
            <AppText style={styles.footerColumnTitle}>{column.title}</AppText>
            {column.links.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => onNavigateSection(link.section)}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
              >
                <AppText style={styles.footerLink}>{link.label}</AppText>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.connectColumn}>
          <AppText style={styles.footerColumnTitle}>Connect Us</AppText>
          <LandingIcon
            icon={SocialIcons}
            width={layout.socialWidth}
            height={layout.socialHeight}
            accessibilityLabel="Website and email"
          />
        </View>
      </View>
    </View>
  );
}
