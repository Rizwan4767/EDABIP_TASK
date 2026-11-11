import { Pressable, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { LandingIcon } from '@/screens/landing/components/LandingIcon';
import { useLandingStyles } from '@/screens/landing/LandingStylesContext';

export function LandingWhiteCard({
  icon,
  title,
  body,
  phase,
  tag,
  meta,
  onViewMore,
}: Readonly<{
  icon: ImageSourcePropType;
  title: string;
  body: string;
  phase?: string;
  tag?: string;
  meta?: { icon: ImageSourcePropType; label: string };
  onViewMore?: () => void;
}>) {
  const { layout, styles } = useLandingStyles();
  const tile = layout.tileIcon;
  const metaSize = Math.max(12, Math.round(12 * layout.scale));

  return (
    <View style={styles.whiteCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeader}>
          <LandingIcon icon={icon} width={tile} height={tile} />
          <AppText style={styles.cardTitle}>{title}</AppText>
        </View>
        {phase ? (
          <View style={styles.phasePill}>
            <AppText style={styles.phaseLabel}>{phase}</AppText>
          </View>
        ) : null}
      </View>

      <AppText style={styles.cardBody}>{body}</AppText>

      {meta ? (
        <View style={styles.metaRow}>
          <LandingIcon icon={meta.icon} width={metaSize} height={metaSize} />
          <AppText style={styles.metaLabel}>{meta.label}</AppText>
        </View>
      ) : null}

      {tag || onViewMore ? (
        <View style={styles.pillarFooter}>
          {tag ? (
            <View style={styles.tagPill}>
              <AppText style={styles.tagLabel}>{tag}</AppText>
            </View>
          ) : (
            <View style={styles.flexSpacer} />
          )}
          {onViewMore ? (
            <Pressable
              onPress={onViewMore}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`View more about ${title}`}
              style={styles.viewMoreWrap}
            >
              <AppText style={styles.viewMore}>View more</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
