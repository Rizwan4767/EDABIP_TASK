import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { edabipLegalFooterStyles as styles } from '@/components/layout/edabipLegalFooterStyles';

/** Copyright strip used at the bottom of Dashboard-style screens. */
export function EdabipLegalFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.row}>
        <AppText variant="overline" style={styles.text}>
          © 2026 EDABIP. All rights reserved. Enterprise Data Analytics & Business Intelligence
          Platform
        </AppText>
        <AppText variant="overline" style={styles.text}>
          Privacy Policy · Terms · Help & Support · v2.1.0
        </AppText>
      </View>
    </View>
  );
}
