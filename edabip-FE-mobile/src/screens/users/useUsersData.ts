import { useCallback, useMemo, useState } from 'react';

import {
  formatLastLogin,
  nextUserId,
  USERS_DATA,
  type ManagedRole,
  type ManagedUser,
  type UsersData,
} from '@/screens/users/usersData';

export function useUsersData() {
  const [data, setData] = useState<UsersData>(USERS_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return data.users;
    return data.users.filter((user) =>
      [user.id, user.name, user.email, user.role].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [data.users, userQuery]);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setData(USERS_DATA);
      setUserQuery('');
    } catch {
      setError('Unable to load users. Pull to try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const addUser = useCallback(
    (input: { firstName: string; lastName: string; email: string; role: string }) => {
      const email = input.email.trim().toLowerCase();
      setData((current) => {
        if (current.users.some((user) => user.email.toLowerCase() === email)) {
          return current;
        }
        const next: ManagedUser = {
          id: nextUserId(current.users),
          name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
          email: input.email.trim(),
          role: input.role,
          lastLogin: formatLastLogin(),
        };
        return { ...current, users: [next, ...current.users] };
      });
    },
    [],
  );

  const updateUserRole = useCallback((userId: string, role: string) => {
    setData((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, role } : user)),
    }));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setData((current) => ({
      ...current,
      users: current.users.filter((user) => user.id !== userId),
    }));
  }, []);

  const updateRole = useCallback((roleId: string, patch: Partial<ManagedRole>) => {
    setData((current) => ({
      ...current,
      roles: current.roles.map((role) => (role.id === roleId ? { ...role, ...patch } : role)),
    }));
  }, []);

  const deleteRole = useCallback((roleId: string) => {
    setData((current) => ({
      ...current,
      roles: current.roles.filter((role) => role.id !== roleId),
    }));
  }, []);

  const emailTaken = useCallback(
    (email: string) =>
      data.users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase()),
    [data.users],
  );

  return {
    data,
    filteredUsers,
    userQuery,
    setUserQuery,
    isLoading: isRefreshing,
    error,
    reload,
    addUser,
    updateUserRole,
    deleteUser,
    updateRole,
    deleteRole,
    emailTaken,
  };
}
