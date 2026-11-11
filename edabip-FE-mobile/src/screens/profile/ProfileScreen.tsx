import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPlaceholder, LogoWordmarkIcon, MenuIcon, SearchIcon } from '@/assets/dashboard';
import {
  ChevronRightIcon,
  LogoutIcon,
  MyProfileIcon,
  NotificationIcon,
  PaymentHistoryIcon,
  PenEditIcon,
  SettingsMenuIcon,
} from '@/assets/profile';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { GoToDashboardFab } from '@/components/navigation/GoToDashboardFab';
import { useScrollAwareFab } from '@/components/navigation/useScrollAwareFab';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  getProfileDisplayName,
  getProfileEmail,
  goToBillingPlans,
} from '@/screens/profile/profileChrome';
import { profileScreenStyles as styles } from '@/screens/profile/profileScreenStyles';
import { useAuth } from '@/store/auth';
import { useUser } from '@/store/user';

/** Figma menu icon + label colour — Log Out is not treated as destructive. */
const MENU_ICON_COLOR = '#1A1A1A';

interface ProfileMenuItem {
  id: string;
  label: string;
  icon: Parameters<typeof DashboardIcon>[0]['icon'];
  onPress?: () => void;
  showChevron: boolean;
  trailingLabel?: string;
}

export function ProfileScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <ProfileCanvas />
    </ThemeSchemeOverride>
  );
}

function ProfileCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUser();
  const { signOut } = useAuth();
  const signOutAction = useAsyncAction(signOut);
  const { visible: fabVisible, onScroll: onFabScroll } = useScrollAwareFab();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  const displayName = getProfileDisplayName(profile);
  const email = getProfileEmail(profile);

  const menuItems: ProfileMenuItem[] = [
    {
      id: 'my-profile',
      label: 'My Profile',
      icon: MyProfileIcon,
      onPress: () => router.push(ROUTES.main.updateProfile),
      showChevron: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsMenuIcon,
      onPress: () => router.push(ROUTES.main.settings),
      showChevron: true,
    },
    {
      id: 'notification',
      label: 'Notification',
      icon: NotificationIcon,
      showChevron: false,
      trailingLabel: 'Allow',
    },
    {
      id: 'payment-history',
      label: 'Payment History',
      icon: PaymentHistoryIcon,
      onPress: () => router.push(ROUTES.main.paymentHistory),
      showChevron: true,
    },
    {
      id: 'logout',
      label: 'Log Out',
      icon: LogoutIcon,
      onPress: () => setIsSignOutOpen(true),
      showChevron: false,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />

      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onFabScroll}
        >
          {/* ── Teal Header ──────────────────────────────────────────── */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.brand,
                paddingTop: insets.top + theme.spacing.sm,
              },
            ]}
          >
            {/* Nav bar */}
            <View style={styles.navRow}>
              <Pressable
                onPress={() => setMenuOpen(true)}
                style={styles.navButton}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                hitSlop={theme.dimensions.hitSlop}
              >
                <DashboardIcon icon={MenuIcon} size={26} />
              </Pressable>

              <View style={styles.logo}>
                <DashboardIcon icon={LogoWordmarkIcon} width={73} height={29} />
              </View>

              <View style={styles.navRight}>
                <Pressable
                  style={styles.searchButton}
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                  hitSlop={theme.dimensions.hitSlop}
                >
                  <DashboardIcon icon={SearchIcon} size={18} />
                </Pressable>
                {/* Avatar in header — tapping does nothing (already on profile) */}
                <Image
                  source={profile?.avatarUrl ? { uri: profile.avatarUrl } : AvatarPlaceholder}
                  style={styles.headerAvatar}
                  accessibilityLabel="Profile photo"
                />
              </View>
            </View>

            {/* User info row */}
            <View style={styles.userRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={profile?.avatarUrl ? { uri: profile.avatarUrl } : AvatarPlaceholder}
                  style={styles.avatar}
                  accessibilityLabel="Your profile photo"
                />
                <Pressable
                  style={styles.penBadge}
                  onPress={() => router.push(ROUTES.main.updateProfile)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile photo"
                  hitSlop={theme.dimensions.hitSlop}
                >
                  <DashboardIcon icon={PenEditIcon} size={14} />
                </Pressable>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                {email ? (
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => goToBillingPlans(router)}
                  accessibilityRole="link"
                  accessibilityLabel="Upgrade Your Plan"
                  hitSlop={theme.dimensions.hitSlop}
                >
                  <Text style={styles.upgradeLink}>Upgrade Your Plan</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── Menu Card ─────────────────────────────────────────────── */}
          <View style={styles.body}>
            <View style={styles.menuCard}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && item.onPress ? styles.menuItemPressed : null,
                  ]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  disabled={!item.onPress}
                >
                  <View style={styles.menuIconWrap}>
                    <DashboardIcon icon={item.icon} size={22} color={MENU_ICON_COLOR} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.trailingLabel ? (
                    <Text style={styles.allowLabel}>{item.trailingLabel}</Text>
                  ) : null}
                  {item.showChevron ? <DashboardIcon icon={ChevronRightIcon} size={20} /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <GoToDashboardFab includeSafeArea visible={fabVisible} />
      </View>

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />

      <ConfirmDialog
        visible={isSignOutOpen}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        destructive
        isPending={signOutAction.isPending}
        onCancel={() => setIsSignOutOpen(false)}
        onConfirm={() => {
          setIsSignOutOpen(false);
          void signOutAction.run();
        }}
      />
    </View>
  );
}
