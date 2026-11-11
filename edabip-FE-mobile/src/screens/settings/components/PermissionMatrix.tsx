import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronDownIcon, UsersIcon } from '@/assets/settings';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { permissionMatrixStyles as styles } from '@/screens/settings/components/permissionMatrixStyles';
import {
  ALLOWED,
  DENIED,
  MATRIX_ACTIONS,
  PERMISSION_MODULES,
  actionKindIcon,
  permissionLabel,
  type PermissionLevel,
  type PermissionModule,
} from '@/screens/settings/permissionMatrix';
import type { SettingsRole } from '@/screens/settings/settingsData';

function formatUserCount(count: number) {
  return `${count} ${count === 1 ? 'User' : 'Users'}`;
}

function PermissionPill({
  level,
  onPress,
  accessibilityLabel,
}: Readonly<{
  level: PermissionLevel;
  onPress: () => void;
  accessibilityLabel: string;
}>) {
  const allowed = level === ALLOWED;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ checked: allowed }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={[styles.pill, allowed ? styles.pillAllowed : styles.pillDenied]}
    >
      <AppText
        variant="caption"
        style={[styles.pillLabel, allowed ? styles.pillAllowedLabel : styles.pillDeniedLabel]}
      >
        {permissionLabel(level)}
      </AppText>
    </Pressable>
  );
}

function RolePermissionCard({
  role,
  module,
  onChange,
}: Readonly<{
  role: SettingsRole;
  module: PermissionModule;
  onChange: (roleId: string, moduleId: string, actionId: string, level: PermissionLevel) => void;
}>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.roleCard, theme.shadows.sm]}
      accessibilityLabel={`${role.name}, ${formatUserCount(role.userCount)}`}
    >
      <View style={styles.roleHead}>
        <AppText variant="h3" style={styles.roleName} numberOfLines={1}>
          {role.name}
        </AppText>
        <View
          style={styles.roleUsers}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <DashboardIcon icon={UsersIcon} size={14} color="#134B4A" />
          <AppText variant="caption" style={styles.roleUsersLabel}>
            {formatUserCount(role.userCount)}
          </AppText>
        </View>
      </View>

      {MATRIX_ACTIONS.map((action) => {
        const level = role.permissions[module.id]?.[action.id] ?? DENIED;
        const nextLevel = level === ALLOWED ? DENIED : ALLOWED;

        return (
          <View key={action.id}>
            <View style={styles.rule} />
            <View style={styles.actionRow}>
              <DashboardIcon icon={actionKindIcon(action.kind)} size={24} />
              <AppText variant="body" style={styles.actionLabel}>
                {action.label}
              </AppText>
              <PermissionPill
                level={level}
                onPress={() => onChange(role.id, module.id, action.id, nextLevel)}
                accessibilityLabel={`Set ${action.label} to ${permissionLabel(nextLevel)} for ${role.name} on ${module.label}`}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function PermissionMatrix({
  roles,
  onChange,
}: Readonly<{
  roles: SettingsRole[];
  onChange: (roleId: string, moduleId: string, actionId: string, level: PermissionLevel) => void;
}>) {
  const theme = useTheme();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMISSION_MODULES.map((module) => [module.id, true])),
  );

  return (
    <View style={styles.board} accessibilityLabel="Permission Matrix">
      {PERMISSION_MODULES.map((module) => {
        const expanded = openModules[module.id] !== false;

        return (
          <View
            key={module.id}
            style={[styles.module, theme.shadows.sm]}
            accessibilityLabel={module.label}
          >
            <Pressable
              onPress={() => setOpenModules((current) => ({ ...current, [module.id]: !expanded }))}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={expanded ? `Collapse ${module.label}` : `Expand ${module.label}`}
              style={styles.moduleHead}
            >
              <View style={[styles.moduleIcon, module.framed ? styles.moduleIconFramed : null]}>
                <DashboardIcon
                  icon={module.icon}
                  size={module.framed ? 16 : 32}
                  color={module.framed ? '#FFFFFF' : undefined}
                />
              </View>
              <AppText variant="h3" style={styles.moduleTitle}>
                {module.label}
              </AppText>
              <View style={expanded ? styles.chevronOpen : styles.chevronClosed}>
                <DashboardIcon icon={ChevronDownIcon} size={12} />
              </View>
            </Pressable>

            {expanded ? (
              <View style={styles.roles}>
                {roles.map((role) => (
                  <RolePermissionCard
                    key={role.id}
                    role={role}
                    module={module}
                    onChange={onChange}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
