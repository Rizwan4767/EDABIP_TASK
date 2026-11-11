import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/common/AppText';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBanner } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/loaders/Skeleton';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Filters, legends, or a period selector. */
  headerAccessory?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: number;
  children?: ReactNode;
}

/**
 * Chart chrome — title, loading, error, and empty states — kept separate from
 * the chart itself.
 *
 * No chart library is installed yet on purpose. The web app uses Recharts,
 * which is DOM-based and cannot run in React Native. When charts are needed,
 * evaluate `react-native-gifted-charts` or a `victory-native` + Skia setup and
 * render the result inside this container so every chart shares the same
 * async-state behaviour.
 */
function chartCardBody({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  height,
  children,
}: Readonly<{
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  height: number;
  children?: ReactNode;
}>) {
  if (isLoading) {
    return (
      <View style={styles.skeletonGroup}>
        <Skeleton height={height - 40} radius={12} />
        <Skeleton height={12} width="60%" />
      </View>
    );
  }
  if (error) {
    return <ErrorBanner message={error} />;
  }
  if (isEmpty) {
    return (
      <EmptyState
        title="Nothing to chart yet"
        description={emptyMessage}
        icon="bar-chart-outline"
      />
    );
  }
  return (
    children ?? (
      <View style={styles.placeholder}>
        <AppText variant="caption" color="textMuted" align="center">
          Chart rendering is not wired up yet.
        </AppText>
      </View>
    )
  );
}

export function ChartCard({
  title,
  subtitle,
  headerAccessory,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data for the selected period.',
  height = 200,
  children,
}: Readonly<ChartCardProps>) {
  return (
    <Card title={title} subtitle={subtitle} headerAccessory={headerAccessory}>
      <View style={[styles.body, { height }]}>
        {chartCardBody({ isLoading, error, isEmpty, emptyMessage, height, children })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { justifyContent: 'center' },
  skeletonGroup: { gap: 12 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
