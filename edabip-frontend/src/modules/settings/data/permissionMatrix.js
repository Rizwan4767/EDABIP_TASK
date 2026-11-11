export const ACCESS = 'access';
export const VIEW_ONLY = 'view';

export const MATRIX_ROLE_ORDER = [
  'Admin',
  'Executive',
  'Business Analyst',
  'Data Engineer',
  'Client User',
];

const ALL_ROLES = MATRIX_ROLE_ORDER;
const ADMIN_ONLY = ['Admin'];
const ADMIN_EXEC_ENGINEER = ['Admin', 'Executive', 'Data Engineer'];

export const PERMISSION_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    actions: [
      {
        id: 'view',
        label: 'View Dashboard',
        description: 'Allows users to see the main dashboard widgets and general metrics.',
        accessRoles: ALL_ROLES,
      },
      {
        id: 'edit',
        label: 'Edit Dashboard',
        description: 'Allows users to configure widgets, layouts, and data sources on the dashboard.',
        accessRoles: ADMIN_EXEC_ENGINEER,
      },
    ],
  },
  {
    id: 'powerbi',
    label: 'Power BI',
    actions: [
      {
        id: 'manage',
        label: 'Manage Power BI',
        description: 'Configure API keys and workspace links for Power BI integration.',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: 'tableau',
    label: 'Tableau',
    actions: [
      {
        id: 'manage',
        label: 'Manage Tableau',
        description: 'Set up server authentication and data source mapping for Tableau.',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    actions: [
      {
        id: 'advanced',
        label: 'Advanced Settings',
        description: 'Access predictive modeling and trend analysis tools.',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    actions: [
      {
        id: 'generate',
        label: 'Generate reports',
        description: 'Allows users to create, export, and schedule custom analytics reports.',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    actions: [
      {
        id: 'view',
        label: 'View Billing',
        description: 'Access invoices, payment history, and current plan details.',
        accessRoles: ALL_ROLES,
      },
      {
        id: 'edit',
        label: 'Edit Subscription',
        description: 'Modify plan levels, add-ons and payment methods',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    actions: [
      {
        id: 'manage',
        label: 'Manage Users',
        description: 'Invite new users, deactivate accounts, and reset passwords.',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    actions: [
      {
        id: 'view',
        label: 'View Settings',
        description: 'Modify global application settings, branding, and security policies.',
        accessRoles: ADMIN_ONLY,
      },
    ],
  },
];

export function defaultLevelFor(roleName, action) {
  return (action.accessRoles || []).includes(roleName) ? ACCESS : VIEW_ONLY;
}

export function buildDefaultPermissions(roleName) {
  return Object.fromEntries(
    PERMISSION_MODULES.map((module) => [
      module.id,
      Object.fromEntries(
        module.actions.map((action) => [action.id, defaultLevelFor(roleName, action)])
      ),
    ])
  );
}

export function normalizePermissions(roleName, permissions = {}) {
  const source = permissions && typeof permissions === 'object' ? permissions : {};

  return Object.fromEntries(
    PERMISSION_MODULES.map((module) => {
      const moduleSource = source[module.id];
      const moduleIsBoolean = typeof moduleSource === 'boolean';

      return [
        module.id,
        Object.fromEntries(
          module.actions.map((action) => {
            if (moduleIsBoolean) {
              return [action.id, moduleSource ? ACCESS : VIEW_ONLY];
            }

            const value =
              moduleSource && typeof moduleSource === 'object'
                ? moduleSource[action.id]
                : undefined;

            if (value === ACCESS || value === VIEW_ONLY) return [action.id, value];
            if (value === true) return [action.id, ACCESS];
            if (value === false) return [action.id, VIEW_ONLY];
            return [action.id, defaultLevelFor(roleName, action)];
          })
        ),
      ];
    })
  );
}

export function sortMatrixRoles(roles) {
  return [...roles].sort((left, right) => {
    const leftIndex = MATRIX_ROLE_ORDER.indexOf(left.name);
    const rightIndex = MATRIX_ROLE_ORDER.indexOf(right.name);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}
