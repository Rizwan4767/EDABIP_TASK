import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/common/AppText';
import { ListItem } from '@/components/common/ListItem';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { useUser } from '@/store/user';
import { getInitials } from '@/utils/format';

/**
 * Hub for modules that do not earn a permanent tab. Five tabs is the practical
 * ceiling on a phone, so Users, billing, AI, and settings are pushed
 * full-screen from here and the hamburger sidebar.
 */
export function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, status } = useUser();

  return (
    <Screen scrollable>
      <ScreenHeader title="More" showBack />

      <Card style={styles.profileCard} onPress={() => router.push(ROUTES.main.users)}>
        <View style={styles.profileRow}>
          {status === 'loading' ? (
            <Skeleton width={48} height={48} radius={24} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.brandSurface }]}>
              <AppText variant="h3" color="brand">
                {getInitials(profile?.fullName ?? '')}
              </AppText>
            </View>
          )}

          <View style={styles.profileText}>
            {status === 'loading' ? (
              <>
                <Skeleton width="60%" height={16} />
                <Skeleton width="80%" height={12} />
              </>
            ) : (
              <>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {profile?.fullName || 'Users'}
                </AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                  {profile?.email || 'Manage users and roles'}
                </AppText>
              </>
            )}
          </View>
        </View>
      </Card>

      <View style={styles.group}>
        <ListItem
          title="Users"
          subtitle="People, roles, and access"
          icon="people-outline"
          onPress={() => router.push(ROUTES.main.users)}
        />
        <ListItem
          title="Billing"
          subtitle="Plan, invoices, and payment methods"
          icon="card-outline"
          onPress={() => router.push(ROUTES.main.billing)}
        />
        <ListItem
          title="EDABIP AI"
          subtitle="Ask questions about your data"
          icon="sparkles-outline"
          onPress={() => router.push(ROUTES.main.ai)}
        />
        <ListItem
          title="Settings"
          subtitle="Appearance and session"
          icon="settings-outline"
          onPress={() => router.push(ROUTES.main.settings)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 4 },
  group: { gap: 4 },
});
