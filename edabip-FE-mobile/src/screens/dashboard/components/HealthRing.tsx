import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { healthRingStyles as styles } from '@/screens/dashboard/components/healthRingStyles';

export function HealthRing({
  percent,
  tone = 'success',
}: Readonly<{
  percent: number;
  tone?: 'success' | 'danger';
}>) {
  const theme = useTheme();

  const size = 70;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clamped = Math.max(0, Math.min(100, percent));

  // Subtract extra pixels so the rounded caps don't visually close the gap.
  // At 95 % the mathematical gap is ~16 px; we widen it by 2× strokeWidth
  // to match the clearly visible gap shown in the Figma design.
  const filled = Math.max(0, circumference * (clamped / 100) - strokeWidth * 2);
  const gap = circumference - filled;

  const color = tone === 'danger' ? theme.colors.danger : theme.colors.brand;
  const trackColor = theme.colors.border;

  // Rotate the progress arc so it starts at the 12-o'clock position.
  // Using an SVG transform string avoids the "transform-origin" DOM warning
  // that occurs when using originX / originY on web (react-native-web).
  const rotateTransform = `rotate(-90, ${size / 2}, ${size / 2})`;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityLabel={`${clamped} percent`}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
          transform={rotateTransform}
        />
      </Svg>

      <AppText
        variant="overline"
        style={[
          styles.label,
          { color: tone === 'danger' ? theme.colors.danger : theme.colors.text },
        ]}
      >
        {`${clamped}%`}
      </AppText>
    </View>
  );
}
