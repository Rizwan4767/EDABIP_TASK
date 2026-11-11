import { Pressable, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { KebabIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  chartCardFill,
  powerBiSharedChartStyles as styles,
} from '@/screens/powerbi/components/powerBiSharedChartStyles';
import type { PowerBiDonutSlice } from '@/screens/powerbi/powerBiData';

/**
 * Figma donut geometry
 *
 * Figma selected ellipse:
 *   Width  = 161.04
 *   Height = 161.04
 *   Radius = 4.34
 *
 * The visible ring is 30px thick.
 */
const SIZE = 161.04;
const CENTER = SIZE / 2;

const RING_THICKNESS = 30;
const OUTER_RADIUS = SIZE / 2;
const INNER_RADIUS = OUTER_RADIUS - RING_THICKNESS;

/**
 * Figma's arc objects have a 4.34px rounded corner.
 *
 * We reproduce that by drawing the annular shape slightly inset and
 * using a stroke whose half-width is exactly 4.34px.
 */
const CORNER_RADIUS = 4.34;
const ARC_STROKE = CORNER_RADIUS * 2;

const PATH_OUTER_RADIUS = OUTER_RADIUS - CORNER_RADIUS;
const PATH_INNER_RADIUS = INNER_RADIUS + CORNER_RADIUS;

const FIGMA_ARCS = [
  { start: -20, end: 164 },
  { start: 176, end: 226 },
  { start: 238, end: 328 },
] as const;

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function pointOnCircle(cx: number, cy: number, radius: number, degrees: number) {
  const radians = degreesToRadians(degrees);

  return {
    x: cx + radius * Math.sin(radians),
    y: cy - radius * Math.cos(radians),
  };
}

function createAnnularArcPath(startAngle: number, endAngle: number): string {
  const outerStart = pointOnCircle(CENTER, CENTER, PATH_OUTER_RADIUS, startAngle);

  const outerEnd = pointOnCircle(CENTER, CENTER, PATH_OUTER_RADIUS, endAngle);

  const innerEnd = pointOnCircle(CENTER, CENTER, PATH_INNER_RADIUS, endAngle);

  const innerStart = pointOnCircle(CENTER, CENTER, PATH_INNER_RADIUS, startAngle);

  let sweep = endAngle - startAngle;

  while (sweep < 0) {
    sweep += 360;
  }

  const largeArcFlag = sweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,

    `A ${PATH_OUTER_RADIUS.toFixed(3)} ${PATH_OUTER_RADIUS.toFixed(3)}`,
    `0 ${largeArcFlag} 1`,
    `${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,

    `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,

    `A ${PATH_INNER_RADIUS.toFixed(3)} ${PATH_INNER_RADIUS.toFixed(3)}`,
    `0 ${largeArcFlag} 0`,
    `${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,

    'Z',
  ].join(' ');
}

const FIGMA_ARC_PATHS = FIGMA_ARCS.map((arc) => createAnnularArcPath(arc.start, arc.end));

export function PowerBiDonutCard({
  title,
  slices,
  centerValue,
  centerLabel,
  layout = 'stack',
  legendVariant = 'dots',
  showMenu = false,
  tileBorderColor,
  valueFormat = 'compact',
  legendSlices,
}: Readonly<{
  title: string;
  slices: PowerBiDonutSlice[];
  centerValue: string;
  centerLabel: string;
  layout?: 'stack' | 'split';
  legendVariant?: 'dots' | 'tiles';
  showMenu?: boolean;
  tileBorderColor?: string;
  valueFormat?: 'compact' | 'spaced';
  legendSlices?: PowerBiDonutSlice[];
}>) {
  const theme = useTheme();

  const displayLegendSlices = legendSlices ?? slices;

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={`${title}, ${slices
        .map((slice) => `${slice.name} ${slice.percent} percent`)
        .join(', ')}`}
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>

        {showMenu ? (
          <Pressable
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`${title} actions`}
          >
            <DashboardIcon icon={KebabIcon} width={3} height={13} />
          </Pressable>
        ) : null}
      </View>

      <View style={layout === 'split' ? styles.donutSplit : styles.donutBody}>
        <View
          style={[
            styles.donut,
            {
              width: SIZE,
              height: SIZE,
            },
          ]}
        >
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <G>
              {FIGMA_ARC_PATHS.map((path, index) => {
                const slice = slices[index];

                if (!slice) {
                  return null;
                }

                return (
                  <Path
                    key={slice.id}
                    d={path}
                    fill={slice.color}
                    stroke={slice.color}
                    strokeWidth={ARC_STROKE}
                    strokeLinejoin="round"
                    strokeLinecap="butt"
                  />
                );
              })}
            </G>
          </Svg>

          <View
            style={[
              styles.donutCenter,
              {
                width: SIZE,
                height: SIZE,
              },
            ]}
            pointerEvents="none"
          >
            <AppText variant="bodyStrong" style={styles.donutValue} numberOfLines={1}>
              {centerValue}
            </AppText>

            <AppText variant="caption" style={styles.donutLabel} numberOfLines={1}>
              {centerLabel}
            </AppText>
          </View>
        </View>

        <View style={legendVariant === 'tiles' ? styles.legendTiles : styles.legend}>
          {displayLegendSlices.map((slice) =>
            legendVariant === 'tiles' ? (
              <View
                key={slice.id}
                style={[
                  styles.legendTile,
                  {
                    borderColor: tileBorderColor ?? slice.color,
                  },
                ]}
              >
                <AppText variant="caption" style={styles.legendTileLabel}>
                  {slice.name}
                </AppText>

                <AppText variant="bodyStrong" style={styles.legendTileValue}>
                  {valueFormat === 'compact' ? `${slice.percent}%` : `${slice.percent} %`}
                </AppText>
              </View>
            ) : (
              <View key={slice.id} style={styles.legendItem}>
                <View style={styles.legendName}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor: slice.color,
                      },
                    ]}
                  />

                  <AppText variant="caption" style={styles.legendLabel}>
                    {slice.name}
                  </AppText>
                </View>

                <AppText variant="bodyStrong" style={styles.legendValue}>
                  {`${slice.percent} %`}
                </AppText>
              </View>
            ),
          )}
        </View>
      </View>
    </View>
  );
}
