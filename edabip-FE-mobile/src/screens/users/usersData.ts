export type UserKpiId = 'total' | 'active' | 'inactive' | 'new';
export type UserRoleStatus = 'Active' | 'Inactive';

export interface UserKpi {
  id: UserKpiId;
  title: string;
  value: string;
  label: string;
  change: string;
  changeNote: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}

export interface ManagedRole {
  id: string;
  name: string;
  status: UserRoleStatus;
  permission: string;
}

export interface UsersData {
  kpis: UserKpi[];
  users: ManagedUser[];
  roles: ManagedRole[];
}

export const ASSIGNABLE_ROLES = [
  'User',
  'Administrator',
  'Editor',
  'Viewer',
  'Business Analyst',
  'Data Engineer',
] as const;

/**
 * Design data transcribed from the mobile Figma users screen (node 194:549)
 * and the web user-management mock. Replaced by a users API once the backend
 * router exists — do not treat this as a live contract.
 */
export const USERS_DATA: UsersData = {
  kpis: [
    {
      id: 'total',
      title: 'Total Users',
      value: '132',
      label: 'Total Revenue',
      change: '12 %',
      changeNote: 'vs last month',
    },
    {
      id: 'active',
      title: 'Active Users',
      value: '98',
      label: 'Total Customers',
      change: '8 %',
      changeNote: 'vs last month',
    },
    {
      id: 'inactive',
      title: 'Inactive Users',
      value: '34',
      label: 'Total Reports',
      change: '5 %',
      changeNote: 'vs last month',
    },
    {
      id: 'new',
      title: 'New This Month',
      value: '15',
      label: 'All Systems Operational',
      change: '25 %',
      changeNote: 'vs last month',
    },
  ],
  users: [
    {
      id: 'USR001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'User',
      lastLogin: '12-05-2025 10:30 AM',
    },
    {
      id: 'USR002',
      name: 'Bob Williams',
      email: 'bob@example.com',
      role: 'User',
      lastLogin: '14-05-2025 11:25 AM',
    },
    {
      id: 'USR003',
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      role: 'User',
      lastLogin: '18-05-2025 11:20 AM',
    },
    {
      id: 'USR004',
      name: 'Diana Smith',
      email: 'diana@example.com',
      role: 'User',
      lastLogin: '27-06-2025 10:30 AM',
    },
    {
      id: 'USR005',
      name: 'Ethan King',
      email: 'ethan@example.com',
      role: 'User',
      lastLogin: '28-06-2025 02:14 PM',
    },
  ],
  roles: [
    {
      id: 'ROL001',
      name: 'Administrator',
      status: 'Inactive',
      permission: 'All Modules',
    },
    {
      id: 'ROL002',
      name: 'Editor',
      status: 'Active',
      permission: 'Data ETL, Reports, Dashboards',
    },
    {
      id: 'ROL003',
      name: 'Viewer',
      status: 'Active',
      permission: 'Reports, Dashboards (View Only)',
    },
    {
      id: 'ROL004',
      name: 'Business Analyst',
      status: 'Inactive',
      permission: 'Reports, Analytics',
    },
  ],
};

export function nextUserId(users: ManagedUser[]): string {
  const max = users.reduce((highest, user) => {
    const numeric = Number.parseInt(String(user.id).replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);
  return `USR${String(max + 1).padStart(3, '0')}`;
}

export function formatLastLogin(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${day}-${month}-${year} ${String(hour12).padStart(2, '0')}:${minutes} ${suffix}`;
}
