import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { KebabIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { PermissionMatrix } from '@/screens/settings/components/PermissionMatrix';
import { rolesCardStyles as styles } from '@/screens/settings/components/rolesCardStyles';
import { SettingsSectionCard } from '@/screens/settings/components/SettingsSectionCard';
import type { PermissionLevel } from '@/screens/settings/permissionMatrix';
import type { SettingsRole } from '@/screens/settings/settingsData';

const TABS = [
  { id: 'overview', label: 'Roles Overview' },
  { id: 'matrix', label: 'Permission Matrix' },
] as const;

type RoleTab = (typeof TABS)[number]['id'];

function formatUserCount(count: number) {
  return `${count} ${count === 1 ? 'User' : 'Users'}`;
}

export function RolesCard({
  roles,
  expanded,
  onToggle,
  onPermissionChange,
}: Readonly<{
  roles: SettingsRole[];
  expanded: boolean;
  onToggle: () => void;
  onPermissionChange: (
    roleId: string,
    moduleId: string,
    actionId: string,
    level: PermissionLevel,
  ) => void;
}>) {
  const theme = useTheme();
  const [tab, setTab] = useState<RoleTab>('overview');
  const [menuRole, setMenuRole] = useState<SettingsRole | null>(null);

  const closeMenu = () => setMenuRole(null);

  return (
    <SettingsSectionCard
      title="Role & Permissions"
      description="Manage roles and permissions for your organization."
      expanded={expanded}
      onToggle={onToggle}
    >
      <View
        style={styles.tabs}
        accessibilityRole="tablist"
        accessibilityLabel="Role management views"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active ? styles.tabActive : null]}
            >
              <AppText
                variant="label"
                style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
              >
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {tab === 'overview' ? (
        <View style={styles.list}>
          {roles.map((role) => (
            <View
              key={role.id}
              style={[styles.card, theme.shadows.sm]}
              accessibilityLabel={`${role.name}, ${formatUserCount(role.userCount)}`}
            >
              <View style={styles.cardHead}>
                <AppText variant="h3" style={styles.name}>
                  {role.name}
                </AppText>
                <Pressable
                  onPress={() => setMenuRole(role)}
                  accessibilityRole="button"
                  accessibilityLabel={`More actions for ${role.name}`}
                  hitSlop={theme.dimensions.hitSlop}
                  style={styles.kebab}
                >
                  <DashboardIcon icon={KebabIcon} size={16} />
                </Pressable>
              </View>
              <AppText variant="caption" style={styles.description}>
                {role.description}
              </AppText>
              <View style={styles.badge}>
                <AppText variant="caption" style={styles.badgeLabel}>
                  {formatUserCount(role.userCount)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <PermissionMatrix roles={roles} onChange={onPermissionChange} />
      )}

      <BottomSheet
        visible={Boolean(menuRole)}
        onClose={closeMenu}
        title={menuRole ? `${menuRole.name} actions` : 'Role actions'}
      >
        <Pressable
          onPress={() => {
            setTab('matrix');
            closeMenu();
          }}
          accessibilityRole="button"
          accessibilityLabel="View details"
          style={styles.menuItem}
        >
          <AppText variant="body">View details</AppText>
        </Pressable>
        <Pressable
          onPress={() => {
            setTab('matrix');
            closeMenu();
          }}
          accessibilityRole="button"
          accessibilityLabel="Edit role"
          style={styles.menuItem}
        >
          <AppText variant="body">Edit role</AppText>
        </Pressable>
      </BottomSheet>
    </SettingsSectionCard>
  );
}
