import { Image, Pressable, View } from 'react-native';

import { DataSovereigntyImage } from '@/assets/landing';
import { AppText } from '@/components/common/AppText';
import { useLandingStyles } from '@/screens/landing/LandingStylesContext';

export function LandingSovereignty({ onViewMore }: Readonly<{ onViewMore: () => void }>) {
  const { styles } = useLandingStyles();

  return (
    <View style={styles.whiteCard}>
      <AppText style={styles.sovereigntyTitle}>
        Uncompromising{' '}
        <AppText style={[styles.sovereigntyTitle, styles.sovereigntyAccent]}>Data</AppText>{' '}
        Sovereignty
      </AppText>
      <View style={styles.sovereigntyRow}>
        <AppText style={[styles.cardBody, styles.sovereigntyCopy]}>
          Secure your enterprise intelligence with multi-layered architectural defense systems. We
          provide full visibility and ironclad control over your most sensitive analytical assets.
        </AppText>
        <Image
          source={DataSovereigntyImage}
          style={styles.sovereigntyImage}
          resizeMode="cover"
          accessibilityLabel="Shielded enterprise data"
        />
      </View>
      <View style={styles.pillarFooter}>
        <View style={styles.flexSpacer} />
        <Pressable
          onPress={onViewMore}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="View more about data sovereignty"
          style={styles.viewMoreWrap}
        >
          <AppText style={styles.viewMore}>View more</AppText>
        </Pressable>
      </View>
    </View>
  );
}
