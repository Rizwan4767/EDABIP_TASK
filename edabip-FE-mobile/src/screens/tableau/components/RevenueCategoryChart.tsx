import { Pressable, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { KebabIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  categoryDonutLayout,
  chartCardFill,
  revenueCategoryChartStyles as styles,
} from '@/screens/tableau/components/revenueCategoryChartStyles';
import type { TableauCategorySlice } from '@/screens/tableau/tableauData';

// Exact slice colors from Figma
const FIGMA_COLORS: Record<string, string> = {
  sales: '#134B4A',
  services: '#3E9593',
  products: '#30D7D3',
  subscriptions: '#D8DA39',
};

function formatMillions(value: number, withDollar = false): string {
  const text = value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
  return withDollar ? `$${text}M` : `${text}M`;
}

// Exact vector paths exported directly from Figma for the donut segments.
// Each segment represents an annular sector with radial cuts and 8px rounded corners.
const FIGMA_DONUT_PATHS: Record<string, string> = {
  sales:
    'M169.406 287.119C170.069 291.488 174.153 294.514 178.479 293.616C197.107 289.753 214.844 282.338 230.708 271.749C248.794 259.679 264.006 243.78 275.266 225.178C286.526 206.577 293.56 185.728 295.869 164.106C298.177 142.485 295.705 120.621 288.627 100.061C281.549 79.5014 270.038 60.7489 254.909 45.1313C239.779 29.5136 221.402 17.4126 201.077 9.68494C180.753 1.95727 158.978 -1.20814 137.294 0.412805C118.274 1.83468 99.7313 6.909 82.6733 15.3315C78.7116 17.2876 77.3555 22.1864 79.5222 26.0369L97.8673 58.637C100.034 62.4875 104.9 63.8188 108.92 61.9837C119.11 57.3312 130.063 54.5097 141.276 53.6715C155.153 52.6341 169.089 54.66 182.097 59.6057C195.105 64.5514 206.866 72.296 216.549 82.2913C226.231 92.2866 233.599 104.288 238.129 117.446C242.659 130.605 244.241 144.598 242.763 158.435C241.286 172.273 236.784 185.617 229.578 197.521C222.371 209.426 212.636 219.602 201.061 227.327C191.708 233.569 181.34 238.088 170.445 240.694C166.148 241.722 163.132 245.767 163.795 250.135L169.406 287.119Z',
  subscriptions:
    'M67.4 33.6991C64.8516 30.0899 59.8444 29.2132 56.3777 31.9524C36.0251 48.0338 20.2423 69.1751 10.6095 93.2593C8.96876 97.3616 11.2326 101.913 15.4174 103.33L50.8478 115.33C55.0326 116.747 59.5429 114.487 61.3073 110.436C67.1585 97.0032 76.0414 85.1045 87.2567 75.6764C90.6388 72.8333 91.5243 67.8664 88.9759 64.2571L67.4 33.6991Z',
  products:
    'M13.531 109.341C9.28684 108.113 4.8283 110.554 3.83071 114.858C-1.57069 138.163 -1.26447 162.471 4.77769 185.7C10.8198 208.929 22.3968 230.305 38.4692 248.024C41.4376 251.297 46.5207 251.256 49.6286 248.116L75.9409 221.527C79.0488 218.387 78.9932 213.342 76.1254 209.981C66.8254 199.081 60.0894 186.189 56.465 172.255C52.8407 158.322 52.4411 143.781 55.2514 129.732C56.118 125.399 53.7083 120.967 49.4642 119.739L13.531 109.341Z',
  services:
    'M54.8998 253.07C51.9579 256.366 52.2323 261.442 55.6825 264.202C69.1612 274.984 84.435 283.345 100.825 288.888C117.214 294.431 134.427 297.057 151.683 296.67C156.1 296.571 159.399 292.704 159.062 288.298L156.208 251C155.871 246.594 152.023 243.332 147.605 243.297C137.529 243.218 127.512 241.534 117.935 238.295C108.358 235.056 99.3758 230.314 91.3201 224.261C87.7877 221.607 82.7492 221.864 79.8073 225.161L54.8998 253.07Z',
};

export function RevenueCategoryChart({ slices }: Readonly<{ slices: TableauCategorySlice[] }>) {
  const theme = useTheme();
  const { size, viewBox } = categoryDonutLayout;

  const svgSlices = slices.map((slice) => ({
    id: slice.id,
    path: FIGMA_DONUT_PATHS[slice.id] ?? '',
    color: FIGMA_COLORS[slice.id] ?? slice.color,
  }));

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Revenue Category
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Revenue category actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Exact Figma donut matching geometry, radial gaps, and 8px rounded corners */}
        <View style={styles.chart} accessibilityLabel="125.8M total revenue">
          <Svg width={size} height={size} viewBox={viewBox}>
            {svgSlices.map((slice) =>
              slice.path ? <Path key={slice.id} d={slice.path} fill={slice.color} /> : null,
            )}
            <SvgText
              x={148.35}
              y={142}
              textAnchor="middle"
              fontSize={28}
              fontFamily={theme.typography.fontFamily.bold}
              fontWeight="700"
              fill={theme.colors.text}
            >
              125.8M
            </SvgText>
            <SvgText
              x={148.35}
              y={172}
              textAnchor="middle"
              fontSize={17}
              fontFamily={theme.typography.fontFamily.regular}
              fontWeight="400"
              fill={theme.colors.textMuted}
            >
              Total
            </SvgText>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {slices.map((slice) => {
            const sliceColor = FIGMA_COLORS[slice.id] ?? slice.color;
            return (
              <View key={slice.id} style={styles.item}>
                <View style={styles.labelRow}>
                  <View style={[styles.dot, { backgroundColor: sliceColor }]} />
                  <AppText variant="caption" style={styles.name}>
                    {slice.name}
                  </AppText>
                </View>
                <AppText variant="bodyStrong" style={styles.value}>
                  {formatMillions(slice.amount, true)}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
