import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { ManagedRole } from '@/screens/users/usersData';
import {
  listCardFill,
  roleListCardStyles as styles,
} from '@/screens/users/components/roleListCardStyles';

export function RoleListCard({
  roles,
  onEditPress,
  onDeletePress,
}: {
  roles: ManagedRole[];
  onEditPress: (role: ManagedRole) => void;
  onDeletePress: (role: ManagedRole) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, listCardFill(theme.colors.surface), theme.shadows.sm]}
      accessibilityLabel="Role List"
    >
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Role List
        </AppText>
      </View>

      <View style={styles.list}>
        {roles.length === 0 ? (
          <AppText variant="caption" color="textMuted" align="center" style={styles.empty}>
            No roles to display.
          </AppText>
        ) : (
          roles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              onEdit={() => onEditPress(role)}
              onDelete={() => onDeletePress(role)}
            />
          ))
        )}
      </View>
    </View>
  );
}

function RoleRow({
  role,
  onEdit,
  onDelete,
}: {
  role: ManagedRole;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isActive = role.status === 'Active';

  return (
    <View style={styles.row} accessibilityLabel={`${role.name} role card`}>
      <View style={styles.fields}>
        <View style={styles.fieldRow}>
          <Field label="Role ID" value={role.id} fixed />
          <Field label="Role Name" value={role.name} />
          <View style={styles.field}>
            <AppText variant="caption" style={styles.fieldLabel}>
              Status
            </AppText>
            <View style={[styles.status, isActive ? styles.statusActive : styles.statusInactive]}>
              <AppText variant="overline" style={styles.statusLabel}>
                {role.status}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Field label="Permission" value={role.permission} />
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          label="Delete"
          onPress={onDelete}
          variant="outline"
          size="sm"
          style={[styles.action, { borderColor: '#134B4A' }]}
        />
        <Button label="Edit Role" onPress={onEdit} size="sm" style={styles.action} />
      </View>
    </View>
  );
}

function Field({ label, value, fixed = false }: { label: string; value: string; fixed?: boolean }) {
  return (
    <View style={fixed ? styles.fieldFixed : styles.field}>
      <AppText variant="caption" style={styles.fieldLabel}>
        {label}
      </AppText>
      <AppText variant="label" numberOfLines={2} style={styles.fieldValue}>
        {value}
      </AppText>
    </View>
  );
}
