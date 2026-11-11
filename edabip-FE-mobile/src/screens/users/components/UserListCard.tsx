import { Pressable, TextInput, View } from 'react-native';

import { ChevronDownIcon, SearchIcon } from '@/assets/analytics';
import { PlusIcon, SearchClearIcon } from '@/assets/users';
import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import type { ManagedUser } from '@/screens/users/usersData';
import {
  listCardFill,
  userListCardStyles as styles,
} from '@/screens/users/components/userListCardStyles';

export function UserListCard({
  users,
  query,
  expanded,
  onQueryChange,
  onToggleExpanded,
  onAddPress,
  onEditPress,
  onDeletePress,
}: {
  users: ManagedUser[];
  query: string;
  expanded: boolean;
  onQueryChange: (value: string) => void;
  onToggleExpanded: () => void;
  onAddPress: () => void;
  onEditPress: (user: ManagedUser) => void;
  onDeletePress: (user: ManagedUser) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, listCardFill(theme.colors.surface), theme.shadows.sm]}
      accessibilityLabel="User List"
    >
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          User List
        </AppText>
        <Button
          label="Add User"
          onPress={onAddPress}
          size="sm"
          fullWidth={false}
          leftIcon={<DashboardIcon icon={PlusIcon} size={12} color={theme.colors.textOnBrand} />}
          style={styles.addButton}
        />
        <Pressable
          onPress={onToggleExpanded}
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse user list' : 'Expand user list'}
        >
          <View style={expanded ? styles.chevron : styles.chevronCollapsed}>
            <DashboardIcon icon={ChevronDownIcon} size={12} />
          </View>
        </Pressable>
      </View>

      {expanded ? (
        <>
          <View style={styles.search}>
            <DashboardIcon icon={SearchIcon} size={14} color={theme.colors.text} />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              placeholder="Search"
              placeholderTextColor={theme.colors.text}
              style={[
                styles.input,
                { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular },
              ]}
              accessibilityLabel="Search users"
              returnKeyType="search"
              underlineColorAndroid="transparent"
            />
            {query ? (
              <Pressable
                onPress={() => onQueryChange('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={theme.dimensions.hitSlop}
              >
                <DashboardIcon icon={SearchClearIcon} size={12} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.list}>
            {users.length === 0 ? (
              <AppText variant="caption" color="textMuted" align="center" style={styles.empty}>
                No users match that search.
              </AppText>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => onEditPress(user)}
                  onDelete={() => onDeletePress(user)}
                />
              ))
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

function UserRow({
  user,
  onEdit,
  onDelete,
}: {
  user: ManagedUser;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row} accessibilityLabel={`${user.name} user card`}>
      <View style={styles.fields}>
        <View style={styles.fieldRow}>
          <Field label="User ID" value={user.id} fixed />
          <Field label="Name" value={user.name} />
          <Field label="Role" value={user.role} />
        </View>
        <View style={styles.fieldRow}>
          <Field label="Email" value={user.email} />
          <Field label="Last Login" value={user.lastLogin} />
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
        <Button label="Edit User" onPress={onEdit} size="sm" style={styles.action} />
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
      <AppText variant="label" numberOfLines={1} style={styles.fieldValue}>
        {value}
      </AppText>
    </View>
  );
}
