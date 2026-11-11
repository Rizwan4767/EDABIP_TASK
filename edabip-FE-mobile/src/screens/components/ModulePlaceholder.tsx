import type { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  showBack?: boolean;
}

/**
 * Temporary body for modules that exist in the navigation tree but have no
 * screen yet. Each usage is replaced as the corresponding EDABIP screen is
 * built; nothing else should depend on this component.
 */
export function ModulePlaceholder({
  title,
  description,
  icon,
  showBack = false,
}: Readonly<ModulePlaceholderProps>) {
  return (
    <Screen>
      <ScreenHeader title={title} showBack={showBack} />
      <EmptyState title="Coming soon" description={description} icon={icon} />
    </Screen>
  );
}
