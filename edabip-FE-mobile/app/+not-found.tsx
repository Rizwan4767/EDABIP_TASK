import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { HOME_ROUTE } from '@/navigation/routes';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <EmptyState
        icon="compass-outline"
        title="Page not found"
        description="That link doesn't lead anywhere in the EDABIP app."
        actionLabel="Go to dashboard"
        onAction={() => router.replace(HOME_ROUTE)}
      />
    </Screen>
  );
}
