import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { EdabipAppTabFooter } from '@/components/navigation/EdabipAppTabFooter';
import { GoToDashboardFab } from '@/components/navigation/GoToDashboardFab';
import { useScrollAwareFab } from '@/components/navigation/useScrollAwareFab';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { AddUserModal } from '@/screens/users/components/AddUserModal';
import { EditRoleModal } from '@/screens/users/components/EditRoleModal';
import { EditUserModal } from '@/screens/users/components/EditUserModal';
import { RoleListCard } from '@/screens/users/components/RoleListCard';
import { UserListCard } from '@/screens/users/components/UserListCard';
import { UsersHeader } from '@/screens/users/components/UsersHeader';
import type { ManagedRole, ManagedUser } from '@/screens/users/usersData';
import { surfaceFill, usersScreenStyles as styles } from '@/screens/users/usersScreenStyles';
import { useUsersData } from '@/screens/users/useUsersData';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function UsersScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <UsersCanvas />
    </ThemeSchemeOverride>
  );
}

function UsersCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, reload: reloadProfile } = useUser();
  const {
    data,
    filteredUsers,
    userQuery,
    setUserQuery,
    isLoading,
    error,
    reload,
    addUser,
    updateUserRole,
    deleteUser,
    updateRole,
    deleteRole,
    emailTaken,
  } = useUsersData();
  const { visible: fabVisible, onScroll: onFabScroll } = useScrollAwareFab();
  const [menuOpen, setMenuOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editingRole, setEditingRole] = useState<ManagedRole | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { type: 'user'; item: ManagedUser } | { type: 'role'; item: ManagedRole } | null
  >(null);

  const firstName = getFirstName(profile?.fullName ?? '');

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile()]);
  };

  return (
    <View style={[styles.root, surfaceFill(theme.colors.surface)]}>
      <StatusBar style="light" />
      <View style={styles.flex}>
        <ScrollView
          style={[styles.flex, surfaceFill(theme.colors.surface)]}
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
          <UsersHeader
            topInset={insets.top}
            firstName={firstName}
            avatarUrl={profile?.avatarUrl || undefined}
            initialsSource={profile?.fullName ?? ''}
            isLoading={isLoading}
            kpis={data.kpis}
            onMenuPress={() => setMenuOpen(true)}
            onSearchPress={() => setListExpanded(true)}
            onProfilePress={() => router.push(ROUTES.main.profile)}
            onRefreshPress={onRefresh}
          />

          <View style={styles.body}>
            {error ? <ErrorBanner message={error} /> : null}

            <UserListCard
              users={filteredUsers}
              query={userQuery}
              expanded={listExpanded}
              onQueryChange={setUserQuery}
              onToggleExpanded={() => setListExpanded((value) => !value)}
              onAddPress={() => setAddOpen(true)}
              onEditPress={setEditingUser}
              onDeletePress={(user) => setPendingDelete({ type: 'user', item: user })}
            />

            <RoleListCard
              roles={data.roles}
              onEditPress={setEditingRole}
              onDeletePress={(role) => setPendingDelete({ type: 'role', item: role })}
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

      <AddUserModal
        visible={addOpen}
        emailTaken={emailTaken}
        onClose={() => setAddOpen(false)}
        onSave={(input) => {
          addUser(input);
          setAddOpen(false);
          setListExpanded(true);
        }}
      />

      <EditUserModal
        visible={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(role) => {
          if (!editingUser) return;
          updateUserRole(editingUser.id, role);
          setEditingUser(null);
        }}
      />

      <EditRoleModal
        visible={Boolean(editingRole)}
        role={editingRole}
        onClose={() => setEditingRole(null)}
        onSave={(patch) => {
          if (!editingRole) return;
          updateRole(editingRole.id, patch);
          setEditingRole(null);
        }}
      />

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'role' ? 'Delete role' : 'Delete user'}
        message={
          pendingDelete
            ? pendingDelete.type === 'role'
              ? `Remove the ${pendingDelete.item.name} role? This cannot be undone.`
              : `Remove ${pendingDelete.item.name} from the user list? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === 'role') deleteRole(pendingDelete.item.id);
          else deleteUser(pendingDelete.item.id);
          setPendingDelete(null);
        }}
      />
    </View>
  );
}
