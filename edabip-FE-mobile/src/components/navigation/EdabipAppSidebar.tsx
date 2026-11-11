import type { ImageSourcePropType } from 'react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SidebarAiIcon,
  SidebarAnalyticsIcon,
  SidebarBillingIcon,
  SidebarDashboardIcon,
  SidebarLogoutIcon,
  SidebarPowerBiIcon,
  SidebarReportIcon,
  SidebarSettingsIcon,
  SidebarTableauIcon,
  SidebarUsersIcon,
} from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { SideDrawer } from '@/components/modals/SideDrawer';
import { edabipAppSidebarStyles as styles } from '@/components/navigation/edabipAppSidebarStyles';
import { SidebarProfileAvatar } from '@/components/navigation/SidebarProfileAvatar';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useTheme } from '@/hooks/useTheme';
import { billingPlansHref, ROUTES } from '@/navigation/routes';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { useAuth } from '@/store/auth';
import { useUser } from '@/store/user';
import { getPersonName } from '@/utils/format';

interface NavItem {
  id: string;
  label: string;
  icon: ImageSourcePropType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: SidebarDashboardIcon, href: ROUTES.main.dashboard },
  { id: 'powerbi', label: 'Power BI', icon: SidebarPowerBiIcon, href: ROUTES.main.powerBi },
  { id: 'tableau', label: 'Tableau', icon: SidebarTableauIcon, href: ROUTES.main.tableau },
  { id: 'analytics', label: 'Analytics', icon: SidebarAnalyticsIcon, href: ROUTES.main.analytics },
  { id: 'report', label: 'Report', icon: SidebarReportIcon, href: ROUTES.main.reports },
  { id: 'billing', label: 'Billing', icon: SidebarBillingIcon, href: ROUTES.main.billing },
  { id: 'users', label: 'Users', icon: SidebarUsersIcon, href: ROUTES.main.users },
  { id: 'settings', label: 'Settings', icon: SidebarSettingsIcon, href: ROUTES.main.settings },
];

const ICON_COLOR = '#1A1A1A';
const ACTIVE_FILL = 'rgba(62, 149, 147, 0.12)';

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EdabipAppSidebar({
  visible,
  onClose,
  onOpen,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
}>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { profile } = useUser();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const signOutAction = useAsyncAction(signOut);

  const displayName = getPersonName(
    profile?.firstName ?? '',
    profile?.lastName ?? '',
    profile?.fullName ?? '',
    profile?.email ?? '',
  );

  const go = (href: string) => {
    onClose();
    if (!isRouteActive(pathname, href)) {
      router.push(href as never);
    }
  };

  const goToPlans = () => {
    onClose();
    const href = billingPlansHref();
    if (isRouteActive(pathname, ROUTES.main.billing)) {
      router.setParams(href.params);
      return;
    }
    router.navigate(href as never);
  };

  return (
    <>
      <SideDrawer visible={visible} onOpen={onOpen} onClose={onClose}>
        <View style={styles.root}>
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top, theme.spacing.base) + theme.spacing.sm },
            ]}
          >
            <View style={styles.profile}>
              <SidebarProfileAvatar avatarUrl={profile?.avatarUrl} />
              <View style={styles.profileText}>
                <AppText
                  variant="bodyStrong"
                  numberOfLines={1}
                  style={[styles.name, { fontFamily: theme.typography.fontFamily.bold }]}
                >
                  {displayName}
                </AppText>
                {profile?.email ? (
                  <AppText variant="caption" numberOfLines={1} style={styles.email}>
                    {profile.email}
                  </AppText>
                ) : null}
                <Pressable
                  onPress={goToPlans}
                  accessibilityRole="link"
                  accessibilityLabel="Upgrade Your Plan"
                  hitSlop={theme.dimensions.hitSlop}
                >
                  <AppText variant="caption" style={styles.upgrade}>
                    Upgrade Your Plan
                  </AppText>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={theme.dimensions.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={theme.dimensions.icon.md}
                color={theme.colors.textMuted}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.nav}
            contentContainerStyle={styles.navContent}
            showsVerticalScrollIndicator={false}
          >
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(pathname, item.href);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => go(item.href)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    styles.link,
                    active || pressed ? { backgroundColor: ACTIVE_FILL } : null,
                  ]}
                >
                  <DashboardIcon icon={item.icon} size={20} color={ICON_COLOR} />
                  <AppText
                    variant="body"
                    style={[
                      styles.linkLabel,
                      {
                        fontFamily: active
                          ? theme.typography.fontFamily.semibold
                          : theme.typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => {
                onClose();
                setIsSignOutOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Logout"
              style={({ pressed }) => [
                styles.link,
                pressed ? { backgroundColor: ACTIVE_FILL } : null,
              ]}
            >
              <DashboardIcon icon={SidebarLogoutIcon} size={20} color={ICON_COLOR} />
              <AppText variant="body" style={styles.linkLabel}>
                Logout
              </AppText>
            </Pressable>
          </ScrollView>

          <View style={styles.ai}>
            <View style={styles.aiTop}>
              <DashboardIcon icon={SidebarAiIcon} width={44} height={40} />
              <View style={styles.aiCopy}>
                <AppText
                  variant="bodyStrong"
                  style={[styles.aiTitle, { fontFamily: theme.typography.fontFamily.bold }]}
                >
                  AI Assistant
                </AppText>
                <AppText variant="caption" style={styles.aiSub}>
                  Your Intelligent Companion
                </AppText>
              </View>
            </View>
            <Pressable
              onPress={() => go(ROUTES.main.ai)}
              accessibilityRole="button"
              accessibilityLabel="Ask AI Assistant"
              style={styles.aiButton}
            >
              <AppText
                variant="button"
                style={[styles.aiButtonLabel, { fontFamily: theme.typography.fontFamily.semibold }]}
              >
                Ask AI
              </AppText>
            </Pressable>
          </View>
        </View>
      </SideDrawer>

      <ConfirmDialog
        visible={isSignOutOpen}
        title="Logout"
        message="Are you sure you want to log out? You will need to sign in again to access your account and dashboard."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        destructive
        isPending={signOutAction.isPending}
        onCancel={() => setIsSignOutOpen(false)}
        onConfirm={() => {
          setIsSignOutOpen(false);
          onClose();
          void signOutAction.run();
        }}
      />
    </>
  );
}
