import { Pressable, View } from 'react-native';

import {
  ChevronDownIcon,
  DotActiveIcon,
  DotPendingIcon,
  DotTrainingIcon,
} from '@/assets/analytics';
import { AppText } from '@/components/common/AppText';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import type { MlModel } from '@/screens/analytics/analyticsData';
import {
  mlModelRegistryCardStyles as styles,
  modelStatusPill,
  registryCardFill,
} from '@/screens/analytics/components/mlModelRegistryCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const STATUS_DOT = {
  Training: DotTrainingIcon,
  Active: DotActiveIcon,
  Pending: DotPendingIcon,
} as const;

const SKELETON_ROW_IDS = ['ml-skel-1', 'ml-skel-2', 'ml-skel-3', 'ml-skel-4'] as const;

function ModelRegistryBody({
  models,
  isLoading,
}: Readonly<{ models: MlModel[]; isLoading: boolean }>) {
  if (isLoading) {
    return (
      <View style={styles.list}>
        {SKELETON_ROW_IDS.map((id) => (
          <Skeleton key={id} height={45} radius={2} />
        ))}
      </View>
    );
  }

  if (models.length === 0) {
    return (
      <View style={styles.empty}>
        <EmptyState title="No models yet" description="Registered models will appear here." />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {models.map((model) => (
        <View key={model.id} style={styles.row}>
          <View style={styles.nameCol}>
            <AppText variant="caption" numberOfLines={1} style={styles.name}>
              {model.name}
            </AppText>
            <View style={styles.categoryRow}>
              <DashboardIcon icon={STATUS_DOT[model.status]} size={5} />
              <AppText variant="overline" numberOfLines={1} style={styles.category}>
                {model.category}
              </AppText>
            </View>
          </View>
          <View style={styles.accuracyCol}>
            <AppText variant="caption" style={styles.accuracyLabel}>
              Accuracy
            </AppText>
            <AppText variant="overline" style={styles.accuracyValue}>
              {model.accuracy}
            </AppText>
          </View>
          <View style={[styles.pill, modelStatusPill[model.status]]}>
            <AppText variant="overline" style={styles.pillLabel}>
              {model.status}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

export function MlModelRegistryCard({
  models,
  isLoading,
  onViewAll,
}: Readonly<{
  models: MlModel[];
  isLoading: boolean;
  onViewAll?: () => void;
}>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, registryCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          ML Model registry
        </AppText>
        <Pressable
          onPress={onViewAll}
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="View all models"
          style={styles.viewAll}
        >
          <AppText variant="caption" style={styles.viewAllLabel}>
            View All
          </AppText>
          <DashboardIcon icon={ChevronDownIcon} size={8} />
        </Pressable>
      </View>

      <ModelRegistryBody models={models} isLoading={isLoading} />
    </View>
  );
}
