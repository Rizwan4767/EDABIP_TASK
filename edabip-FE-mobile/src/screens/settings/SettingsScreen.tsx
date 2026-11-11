import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { EdabipAppTabFooter } from '@/components/navigation/EdabipAppTabFooter';
import { GoToDashboardFab } from '@/components/navigation/GoToDashboardFab';
import { useScrollAwareFab } from '@/components/navigation/useScrollAwareFab';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { GeneralSettingsCard } from '@/screens/settings/components/GeneralSettingsCard';
import { IntegrationsCard } from '@/screens/settings/components/IntegrationsCard';
import { NotificationPreferencesCard } from '@/screens/settings/components/NotificationPreferencesCard';
import { RolesCard } from '@/screens/settings/components/RolesCard';
import { SecurityCard } from '@/screens/settings/components/SecurityCard';
import {
  settingsScreenStyles as styles,
  surfaceFill,
} from '@/screens/settings/settingsScreenStyles';
import { useSettingsData } from '@/screens/settings/useSettingsData';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function SettingsScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <SettingsCanvas />
    </ThemeSchemeOverride>
  );
}

function SettingsCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, reload: reloadProfile, applyProfilePatch } = useUser();
  const {
    data,
    isLoading,
    error,
    reload,
    saveGeneral,
    saveNotifications,
    saveSecurity,
    changePassword,
    toggleIntegration,
    saveRolePermission,
  } = useSettingsData(profile);
  const { visible: fabVisible, onScroll: onFabScroll } = useScrollAwareFab();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState({
    general: true,
    notifications: true,
    integrations: true,
    security: true,
    roles: true,
  });

  const firstName = getFirstName(
    profile?.firstName || profile?.fullName || data.general.firstName || '',
  );

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile()]);
  };

  const toggleSection = (section: keyof typeof openSection) => {
    setOpenSection((current) => ({ ...current, [section]: !current[section] }));
  };

  return (
    <View style={[styles.root, surfaceFill(theme.colors.background)]}>
      <StatusBar style="light" />
      <View style={styles.flex}>
        <ScrollView
          style={[styles.flex, surfaceFill(theme.colors.background)]}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={onFabScroll}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={theme.colors.textOnBrand}
            />
          }
        >
          <EdabipAppHeader
            topInset={insets.top}
            firstName={firstName}
            avatarUrl={profile?.avatarUrl || undefined}
            initialsSource={profile?.fullName ?? ''}
            onMenuPress={() => setMenuOpen(true)}
            onProfilePress={() => router.push(ROUTES.main.profile)}
            onRefreshPress={onRefresh}
          />

          <View style={styles.body}>
            {error ? <ErrorBanner message={error} /> : null}

            <GeneralSettingsCard
              value={data.general}
              options={data.options}
              expanded={openSection.general}
              onToggle={() => toggleSection('general')}
              onSave={async (payload) => {
                await saveGeneral(payload);
                applyProfilePatch({
                  firstName: payload.firstName,
                  lastName: payload.lastName,
                  fullName: `${payload.firstName} ${payload.lastName}`.trim(),
                  email: payload.email,
                  phone: payload.mobileNumber,
                });
              }}
            />

            <NotificationPreferencesCard
              value={data.notifications}
              options={data.options}
              expanded={openSection.notifications}
              onToggle={() => toggleSection('notifications')}
              onSave={saveNotifications}
            />

            <IntegrationsCard
              integrations={data.integrations}
              expanded={openSection.integrations}
              onToggle={() => toggleSection('integrations')}
              onToggleConnected={toggleIntegration}
            />

            <SecurityCard
              value={data.security}
              expanded={openSection.security}
              onToggle={() => toggleSection('security')}
              onSave={saveSecurity}
              onChangePassword={changePassword}
            />

            <RolesCard
              roles={data.roles}
              expanded={openSection.roles}
              onToggle={() => toggleSection('roles')}
              onPermissionChange={saveRolePermission}
            />

            <EdabipLegalFooter />
          </View>
        </ScrollView>

        <GoToDashboardFab includeSafeArea={false} visible={fabVisible} />
      </View>

      <EdabipAppTabFooter />

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}
