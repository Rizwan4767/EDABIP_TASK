import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { KebabIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { reportStatusDonutStyles as styles } from '@/screens/reports/components/reportStatusDonutStyles';
import type { StatusSlice } from '@/screens/reports/reportsData';

const SIZE = 161;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER_RAW = 80.5;
const R_INNER_RAW = 49.5;
const STROKE_WIDTH = 6;
const INSET = STROKE_WIDTH / 2;
const R_OUTER = R_OUTER_RAW - INSET;
const R_INNER = R_INNER_RAW + INSET;

/**
 * Angles matching Figma Image 1 with clear ~8px visual separation:
 * - Ellipse 7 (Completed #67C5C2): -20° to 164° (span 184°)
 * - Ellipse 9 (Scheduled #B4D8FF): 176° to 226° (span 50°)
 * - Ellipse 10 (Failed #FC888A): 238° to 328° (span 90°)
 * Each gap is 12° (~8px visual channel with rounded joins).
 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function getPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = degToRad(deg);
  return {
    x: Number((cx + r * Math.sin(rad)).toFixed(2)),
    y: Number((cy - r * Math.cos(rad)).toFixed(2)),
  };
}

function createAnnularSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number,
): string {
  const p0 = getPoint(cx, cy, rInner, startDeg);
  const p1 = getPoint(cx, cy, rOuter, startDeg);
  const p2 = getPoint(cx, cy, rOuter, endDeg);
  const p3 = getPoint(cx, cy, rInner, endDeg);

  let span = endDeg - startDeg;
  while (span < 0) span += 360;
  const largeArc = span > 180 ? 1 : 0;

  return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${p0.x} ${p0.y} Z`;
}

const PRECOMPUTED_PATHS: Record<string, string> = {
  Completed: createAnnularSectorPath(CX, CY, R_INNER, R_OUTER, -20, 164),
  Scheduled: createAnnularSectorPath(CX, CY, R_INNER, R_OUTER, 176, 226),
  Failed: createAnnularSectorPath(CX, CY, R_INNER, R_OUTER, 238, 328),
};

const LEGEND_BORDER_COLORS: Record<string, string> = {
  Completed: '#67C5C2',
  Scheduled: '#B4D8FF',
  Failed: '#FC888A',
};

/**
 * Donut chart representing Reports by Status, styled to match the Figma mockup exactly.
 * Rendered using annular sector paths with subtle 4px gaps and 4.34px rounded corners.
 */
export function ReportStatusDonut({ slices }: Readonly<{ slices: StatusSlice[] }>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Reports by Status
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Reports by status actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      <View style={styles.chartRow}>
        <View style={[styles.ringWrap, { width: SIZE, height: SIZE }]}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {slices.map((slice) => {
              const pathD = PRECOMPUTED_PATHS[slice.id];
              if (!pathD) return null;
              return (
                <Path
                  key={slice.id}
                  d={pathD}
                  fill={slice.color}
                  stroke={slice.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinejoin="round"
                />
              );
            })}
          </Svg>
          <View style={styles.ringCenter}>
            <AppText variant="h1" numberOfLines={1} style={styles.ringTotal}>
              100
            </AppText>
            <AppText variant="body" numberOfLines={1} style={styles.ringLabel}>
              Total
            </AppText>
          </View>
        </View>

        <View style={styles.legend}>
          {slices.map((slice) => {
            const borderColor = LEGEND_BORDER_COLORS[slice.id] ?? slice.color;
            return (
              <View key={slice.id} style={[styles.legendCard, { borderColor }]}>
                <AppText variant="bodyStrong" style={styles.legendTitle}>
                  {slice.label}
                </AppText>
                <AppText variant="caption" style={styles.legendPercent}>
                  {`${slice.value}%`}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
