import type { ImageSourcePropType } from 'react-native';

import {
  EditIcon,
  MatrixAnalyticsIcon,
  MatrixBillingIcon,
  MatrixDashboardIcon,
  MatrixPowerBiIcon,
  MatrixReportsIcon,
  MatrixSettingsIcon,
  MatrixTableauIcon,
  MatrixUsersIcon,
  ViewIcon,
} from '@/assets/settings';

export const ALLOWED = 'allowed';
export const DENIED = 'denied';

export type PermissionLevel = typeof ALLOWED | typeof DENIED;

export const MATRIX_ACTIONS = [
  { id: 'view', label: 'View', kind: 'view' },
  { id: 'edit', label: 'Edit', kind: 'edit' },
] as const;

export type MatrixActionId = (typeof MATRIX_ACTIONS)[number]['id'];
export type MatrixActionKind = (typeof MATRIX_ACTIONS)[number]['kind'];

export interface PermissionModule {
  id: string;
  label: string;
  icon: ImageSourcePropType;
  framed: boolean;
  editRoles: string[];
}

const ALL_ROLES = ['Admin', 'Business Analyst', 'Editor', 'Viewer'];
const ADMIN_ONLY = ['Admin'];
const ADMIN_AND_ANALYST = ['Admin', 'Business Analyst'];

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: MatrixDashboardIcon,
    framed: false,
    editRoles: ADMIN_AND_ANALYST,
  },
  {
    id: 'powerbi',
    label: 'Power BI',
    icon: MatrixPowerBiIcon,
    framed: false,
    editRoles: ADMIN_ONLY,
  },
  {
    id: 'tableau',
    label: 'Tableau',
    icon: MatrixTableauIcon,
    framed: false,
    editRoles: ADMIN_AND_ANALYST,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: MatrixAnalyticsIcon,
    framed: false,
    editRoles: ADMIN_ONLY,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: MatrixReportsIcon,
    framed: false,
    editRoles: ADMIN_ONLY,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: MatrixBillingIcon,
    framed: true,
    editRoles: ALL_ROLES,
  },
  {
    id: 'users',
    label: 'Users',
    icon: MatrixUsersIcon,
    framed: true,
    editRoles: ADMIN_ONLY,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: MatrixSettingsIcon,
    framed: false,
    editRoles: ADMIN_ONLY,
  },
];

export type RolePermissions = Record<string, Record<string, PermissionLevel>>;

export function defaultLevelFor(
  roleName: string,
  module: PermissionModule,
  actionId: MatrixActionId,
): PermissionLevel {
  if (actionId === 'view') return ALLOWED;
  return module.editRoles.includes(roleName) ? ALLOWED : DENIED;
}

export function buildDefaultPermissions(roleName: string): RolePermissions {
  return Object.fromEntries(
    PERMISSION_MODULES.map((module) => [
      module.id,
      Object.fromEntries(
        MATRIX_ACTIONS.map((action) => [action.id, defaultLevelFor(roleName, module, action.id)]),
      ),
    ]),
  );
}

function coerceLevel(value: unknown, fallback: PermissionLevel): PermissionLevel {
  if (value === ALLOWED || value === DENIED) return value;
  if (value === 'access') return ALLOWED;
  return fallback;
}

export function hydratePermissions(
  roleName: string,
  saved?: Record<string, Record<string, string>>,
): RolePermissions {
  const defaults = buildDefaultPermissions(roleName);
  if (!saved) return defaults;

  return Object.fromEntries(
    PERMISSION_MODULES.map((module) => [
      module.id,
      Object.fromEntries(
        MATRIX_ACTIONS.map((action) => [
          action.id,
          coerceLevel(saved[module.id]?.[action.id], defaultLevelFor(roleName, module, action.id)),
        ]),
      ),
    ]),
  );
}

export function actionKindIcon(kind: MatrixActionKind): ImageSourcePropType {
  return kind === 'view' ? ViewIcon : EditIcon;
}

export function permissionLabel(level: PermissionLevel): 'Allowed' | 'Denied' {
  return level === ALLOWED ? 'Allowed' : 'Denied';
}
