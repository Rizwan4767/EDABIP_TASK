import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import AddUserModal from '../components/AddUserModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import UpdateUserRoleModal from '../components/UpdateUserRoleModal.jsx';
import UserManagementPageSkeleton from '../components/UserManagementPageSkeleton.jsx';
import SuccessToast from '../components/SuccessToast.jsx';
import DateRangePicker from '../../../components/common/DateRangePicker/index.jsx';
import { DEFAULT_DATE_RANGE } from '../../../components/common/DateRangePicker/dateRange.js';
import '../../dashboard/pages/DashboardPage.css';
import './UserManagementPage.css';

import SearchIcon from '../../../assets/dashboard/search.svg';
import SearchClear from '../../../assets/dashboard/charts/search-clear.svg';
import ChevronDown from '../../../assets/dashboard/charts/chevron-down.svg';
import RefreshIcon from '../../../assets/dashboard/powerbi/refresh.svg';
import ClockIcon from '../../../assets/dashboard/charts/clock.svg';
import ExportIcon from '../../../assets/dashboard/reports/export.svg';
import TrendUp from '../../../assets/dashboard/analytics/trend-up-black.svg';
import TrendDown from '../../../assets/dashboard/analytics/trend-down.svg';

// KPI icons/sparklines reuse the Analytics metric assets:
// Total Users = Model Accuracy, Active Users = Precision,
// Inactive Users = Recall, New This Month = F1 Score.
import TotalUsersIcon from '../../../assets/dashboard/analytics/Model-accuracy.svg';
import ActiveUsersIcon from '../../../assets/dashboard/analytics/precison.svg';
import InactiveUsersIcon from '../../../assets/dashboard/analytics/Recall.svg';
import NewUsersIcon from '../../../assets/dashboard/analytics/F1Score.svg';
import TotalUsersGraph from '../../../assets/dashboard/analytics/model-graph.svg';
import ActiveUsersGraph from '../../../assets/dashboard/analytics/precision-Graph.svg';
import InactiveUsersGraph from '../../../assets/dashboard/analytics/Recall-Graph.svg';
import NewUsersGraph from '../../../assets/dashboard/analytics/F1Score_graph.svg';

import EditIcon from '../../../assets/dashboard/users/edit.svg';
import DeleteIcon from '../../../assets/dashboard/users/trash.svg';
import PlusIcon from '../../../assets/dashboard/users/plus.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';
import { useToast } from '../../../components/Toast/useToast';

const KPI_CARDS = [
  {
    id: 'total-users',
    label: 'Total Users',
    value: 132,
    change: '+12% vs last month',
    positive: true,
    icon: TotalUsersIcon,
    graph: TotalUsersGraph,
  },
  {
    id: 'active-users',
    label: 'Active Users',
    value: 98,
    change: '+8% vs last month',
    positive: true,
    icon: ActiveUsersIcon,
    graph: ActiveUsersGraph,
  },
  {
    id: 'inactive-users',
    label: 'Inactive Users',
    value: 34,
    change: '+5% vs last month',
    positive: false,
    icon: InactiveUsersIcon,
    graph: InactiveUsersGraph,
  },
  {
    id: 'new-users',
    label: 'New This Month',
    value: 15,
    change: '+25% vs last month',
    positive: true,
    icon: NewUsersIcon,
    graph: NewUsersGraph,
  },
];

// Mock data (frontend-only; swap for real API calls when the user-management endpoints are wired).

const USER_TEMPLATES = [
  { name: 'Alice Johnson', email: 'alice@example.com' },
  { name: 'Bob Williams', email: 'bob@example.com' },
  { name: 'Charlie Brown', email: 'charlie@example.com' },
  { name: 'Diana Smith', email: 'diana@example.com' },
  { name: 'Ethan King', email: 'ethan@example.com' },
];

const LOGIN_STAMPS = [
  '12 May 2025, 10:30 AM',
  '14 May 2025, 11:25 AM',
  '18 May 2025, 11:20 AM',
  '27 June 2025, 10:30 AM',
  '28 June 2025, 02:14 PM',
  '25 May 2025, 10:30 AM',
];

const TOTAL_MOCK_USERS = 132;

function buildMockUsers() {
  return Array.from({ length: TOTAL_MOCK_USERS }, (_, i) => {
    const t = USER_TEMPLATES[i % USER_TEMPLATES.length];
    return {
      id: `USR${String(i + 1).padStart(3, '0')}`,
      name: t.name,
      email: t.email,
      role: 'User',
      lastLogin: LOGIN_STAMPS[i % LOGIN_STAMPS.length],
    };
  });
}

const ROLE_TEMPLATES = [
  { name: 'Administrator', description: 'Full access to all modules and settings', permission: 'All Modules' },
  { name: 'Editor', description: 'Can create and modify data, reports and dashboards', permission: 'Data ETL, Reports, Dashboards' },
  { name: 'Viewer', description: 'Can view data, reports and dashboards', permission: 'Reports, Dashboards (View Only)' },
  { name: 'Business Analyst', description: 'Can view and analyze reports', permission: 'Reports, Analytics' },
];
const ROLE_STATUS_PATTERN = ['Active', 'Inactive', 'Active', 'Active', 'Active', 'Inactive', 'Active', 'Active', 'Inactive', 'Active'];

// 50 mock roles / 10 per page = exactly 5 pages, matching the Figma pagination
// widget (Back · 1 2 3 4 5 · Next, no ellipsis) — same shape as the Billing
// invoice table's 50-row / 5-page reference.
const TOTAL_MOCK_ROLES = 50;

function buildMockRoles() {
  return Array.from({ length: TOTAL_MOCK_ROLES }, (_, i) => {
    const t = ROLE_TEMPLATES[i % ROLE_TEMPLATES.length];
    return {
      id: `ROL${String(i + 1).padStart(3, '0')}`,
      name: t.name,
      description: t.description,
      permission: t.permission,
      status: ROLE_STATUS_PATTERN[i % ROLE_STATUS_PATTERN.length],
    };
  });
}

function deleteSuccessCopy(isRole, isPlural) {
  if (isRole && isPlural) {
    return { title: 'User Roles Deleted Successfully', message: 'The roles have been successfully removed.' };
  }
  if (isRole) {
    return { title: 'User Role Deleted Successfully', message: 'The role has been successfully removed.' };
  }
  if (isPlural) {
    return { title: 'Users Deleted Successfully', message: 'The users have been successfully removed.' };
  }
  return { title: 'User Deleted Successfully', message: 'The user has been successfully removed.' };
}

const USERS_PAGE_SIZE = 10;
const ROLES_PAGE_SIZE = 10;
const BASE_ASSIGNABLE_ROLES = [
  'User',
  'Administrator',
  'Editor',
  'Viewer',
  'Business Analyst',
  'Data Engineer',
];

function nextUserId(users) {
  const max = users.reduce((highest, user) => {
    const numeric = Number.parseInt(String(user.id).replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);
  return `USR${String(max + 1).padStart(3, '0')}`;
}

function formatNowStamp() {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

function getPageNumbers(currentPage, pageCount) {
  const pages = [];
  if (pageCount <= 5) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 5; i++) pages.push(i);
  } else if (currentPage >= pageCount - 2) {
    for (let i = pageCount - 4; i <= pageCount; i++) pages.push(i);
  } else {
    pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
  }
  return pages;
}

function RoleStatusPill({ status }) {
  const isActive = status === 'Active';
  return (
    <span className={`db-pill ${isActive ? 'db-pill--active' : 'db-pill--inactive'}`}>
      {status}
    </span>
  );
}

function UserManagementPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [allUsers, setAllUsers] = useState(() => buildMockUsers());
  const [allRoles, setAllRoles] = useState(() => buildMockRoles());

  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const [roleSearch, setRoleSearch] = useState('');
  const [rolePage, setRolePage] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState(new Set());

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);

  const displayName = getWelcomeDisplayName(user);
  const roleOptions = useMemo(() => {
    const fromRows = allRoles.map((role) => role.name);
    return [...new Set([...BASE_ASSIGNABLE_ROLES, ...fromRows])];
  }, [allRoles]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 750);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) =>
      [u.id, u.name, u.email, u.role].some((v) => v.toLowerCase().includes(q))
    );
  }, [allUsers, userSearch]);

  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
  const userStartIndex = (userPage - 1) * USERS_PAGE_SIZE;
  const pagedUsers = filteredUsers.slice(userStartIndex, userStartIndex + USERS_PAGE_SIZE);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return allRoles;
    return allRoles.filter((r) =>
      [r.id, r.name, r.description, r.permission, r.status].some((v) => v.toLowerCase().includes(q))
    );
  }, [allRoles, roleSearch]);

  const rolePageCount = Math.max(1, Math.ceil(filteredRoles.length / ROLES_PAGE_SIZE));
  const roleStartIndex = (rolePage - 1) * ROLES_PAGE_SIZE;
  const pagedRoles = filteredRoles.slice(roleStartIndex, roleStartIndex + ROLES_PAGE_SIZE);

  const allPagedUsersSelected = pagedUsers.length > 0 && pagedUsers.every((u) => selectedUsers.has(u.id));
  const allPagedRolesSelected = pagedRoles.length > 0 && pagedRoles.every((r) => selectedRoles.has(r.id));

  const toggleUser = (id) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllUsers = () => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (allPagedUsersSelected) {
        pagedUsers.forEach((u) => next.delete(u.id));
      } else {
        pagedUsers.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const toggleRole = (id) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRoles = () => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (allPagedRolesSelected) {
        pagedRoles.forEach((r) => next.delete(r.id));
      } else {
        pagedRoles.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const openDeleteUsers = () => {
    if (selectedUsers.size === 0) return;
    setDeleteTarget({ type: 'user', count: selectedUsers.size });
  };

  const openDeleteRoles = () => {
    if (selectedRoles.size === 0) return;
    setDeleteTarget({ type: 'role', count: selectedRoles.size });
  };

  const dismissToast = useCallback(() => setToast(null), []);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const isRole = deleteTarget.type === 'role';
    const isPlural = deleteTarget.count > 1;

    if (isRole) {
      setAllRoles((prev) => prev.filter((row) => !selectedRoles.has(row.id)));
      setSelectedRoles(new Set());
      setRolePage(1);
    } else {
      setAllUsers((prev) => prev.filter((row) => !selectedUsers.has(row.id)));
      setSelectedUsers(new Set());
      setUserPage(1);
    }

    setDeleteTarget(null);
    setToast(deleteSuccessCopy(isRole, isPlural));
  };

  const handleCreateUser = ({ firstName, lastName, email, role }) => {
    setAllUsers((prev) => [
      {
        id: nextUserId(prev),
        name: `${firstName} ${lastName}`.trim(),
        email,
        role,
        lastLogin: formatNowStamp(),
      },
      ...prev,
    ]);
    setUserPage(1);
    setAddUserOpen(false);
    setToast({
      title: 'User Added Successfully',
      message: 'The new user has been successfully added.',
    });
  };

  const getRoleDetails = (roleName) => {
    return allRoles.find((role) => role.name === roleName);
  }

  const handleEditRole = (role) => {
    setEditingUser({ id: role.id, role: role.name, roleId: role.id, isRole: true });
  };

  const handleUpdateUserRole = (roleName) => {
    if (!editingUser) return;
    const selectedRole = getRoleDetails(roleName);

    if (editingUser.isRole) {
      setAllRoles((prev) =>
        prev.map((row) =>
          row.id === editingUser.roleId
            ? {
              ...row,
              name: roleName,
              description: selectedRole?.description ?? row.description,
              permission: selectedRole?.permission ?? row.permission,
            }
            : row
        )
      );
    } else {
      setAllUsers((prev) =>
        prev.map((row) => (row.id === editingUser.id ? { ...row, role: roleName } : row))
      );
    }

    setEditingUser(null);
    setToast({
      title: 'User Role Updated Successfully',
      message: 'The user role has been successfully updated.',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleRefresh = async () => {
    try {
      throw new Error('Simulated failure');
    } catch {
      showError('Unable to Refresh Data', "We couldn't refresh the data right now.");
    }
  };

  return (
    <div className="db-page um-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content">
          <div className="um-page-header">
            <h1>Users</h1>
            <div className="um-page-header__actions">
              <span className="um-last-refreshed">
                <img src={ClockIcon} alt="" width="16" height="16" />
                <span>Last Refreshed: 2h ago</span>
              </span>
              <ExportMenu
                iconSrc={ExportIcon}
                buttonClassName="db-btn db-btn--solid"
                filename="users"
                title="Users"
                columns={[
                  { key: 'id', label: 'User ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Role' },
                  { key: 'lastLogin', label: 'Last Login' },
                ]}
                rows={
                  selectedUsers.size
                    ? filteredUsers.filter((user) => selectedUsers.has(user.id))
                    : filteredUsers
                }
              />
            </div>
          </div>

          {loading ? (
            <UserManagementPageSkeleton />
          ) : (
            <>
              {/* Welcome Banner*/}
              <section className="um-welcome">
                <div className="um-welcome__inner">
                  <div className="um-welcome__head">
                    <div className="um-welcome__left">
                      <div className="um-welcome__title-row">
                        <h2 className="um-welcome-title">Welcome Back, {displayName}!</h2>
                        <span className="um-realtime">
                          <span className="um-realtime__dot" />
                          <span>Real Time</span>
                        </span>
                      </div>
                      <p className="um-welcome__sub">
                        Stay Organised with real time insight, Monitor Your Bussiness Perfomence and key Metrics.
                      </p>
                    </div>
                    <div className="um-welcome__actions">
                      <DateRangePicker value={dateRange} onChange={setDateRange} />
                      <button type="button" className="um-btn um-btn--outline">
                        <span>All Categories</span>
                        <img src={ChevronDown} alt="" width="16" height="16" />
                      </button>
                      <button type="button" className="um-btn um-btn--solid" onClick={handleRefresh}>
                        <img src={RefreshIcon} alt="" width="16" height="16" />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/*card*/}

              <section className="um-kpi-grid" aria-label="User metrics">
                {KPI_CARDS.map((card) => (
                  <article key={card.id} className="um-kpi-card">
                    <div className="um-kpi-card__head">
                      <img src={card.icon} alt="" className="um-kpi-card__icon" width="40" height="42" />
                      <p className="um-kpi-card__label">{card.label}</p>
                    </div>
                    <div className="um-kpi-card__metrics">
                      <p className="um-kpi-card__value">{card.value}</p>
                      <div className="um-kpi-card__spark">
                        <img src={card.graph} alt="" />
                      </div>
                    </div>
                    <div
                      className={`um-kpi-card__change ${card.positive ? 'um-kpi-card__change--up' : 'um-kpi-card__change--down'}`}
                    >
                      <img src={card.positive ? TrendUp : TrendDown} alt="" width="12" height="12" />
                      <span>{card.change}</span>
                    </div>
                  </article>
                ))}
              </section>

              <section className="db-card um-card">
                <div className="db-card__header">
                  <h3>User List</h3>
                  <div className="um-card__header-actions">
                    <div className="db-search db-search--sm">
                      <img src={SearchIcon} alt="" className="db-search__icon" width="14" height="14" />
                      <input
                        type="text"
                        placeholder="Search"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setUserPage(1);
                        }}
                        aria-label="Search users"
                      />
                      {userSearch ? (
                        <button
                          type="button"
                          className="db-search__clear"
                          onClick={() => setUserSearch('')}
                          aria-label="Clear user search"
                        >
                          <img src={SearchClear} alt="" width="14" height="14" />
                        </button>
                      ) : (
                        <img src={SearchClear} alt="" className="db-search__clear-icon" width="14" height="14" />
                      )}
                    </div>
                    <button
                      type="button"
                      className="db-btn db-btn--outline"
                      onClick={openDeleteUsers}
                      disabled={selectedUsers.size === 0}
                    >
                      <img src={DeleteIcon} alt="" width="12" height="14" />
                      <span>Delete</span>
                    </button>
                    <button
                      type="button"
                      className="db-btn db-btn--solid"
                      onClick={() => setAddUserOpen(true)}
                    >
                      <img src={PlusIcon} alt="" width="14" height="14" />
                      <span>Add User</span>
                    </button>
                  </div>
                </div>

                <div className="db-table-wrap">
                  <table className="db-table um-table">
                    <thead>
                      <tr>
                        <th className="um-table__checkbox-col">
                          <input
                            type="checkbox"
                            className="um-checkbox"
                            checked={allPagedUsersSelected}
                            onChange={toggleAllUsers}
                            aria-label="Select all users on this page"
                          />
                        </th>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last Login</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map((row) => (
                        <tr key={row.id}>
                          <td className="um-table__checkbox-col">
                            <input
                              type="checkbox"
                              className="um-checkbox"
                              checked={selectedUsers.has(row.id)}
                              onChange={() => toggleUser(row.id)}
                              aria-label={`Select ${row.name}`}
                            />
                          </td>
                          <td>
                            <span className="um-id-link">{row.id}</span>
                          </td>
                          <td>{row.name}</td>
                          <td>{row.email}</td>
                          <td>{row.role}</td>
                          <td>{row.lastLogin}</td>
                          <td>
                            <button
                              type="button"
                              className="um-row-action"
                              aria-label={`Update role for ${row.name}`}
                              onClick={() => setEditingUser(row)}
                            >
                              <img src={EditIcon} alt="" width="12" height="12" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pagedUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="um-table__empty">No users match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="um-pagination">
                  <p className="um-pagination__text">
                    Showing {filteredUsers.length === 0 ? 0 : userStartIndex + 1} to{' '}
                    {Math.min(userStartIndex + USERS_PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="um-pagination__controls">
                    <button
                      type="button"
                      className="um-pagination__btn um-pagination__btn--nav"
                      disabled={userPage === 1}
                      onClick={() => setUserPage((p) => p - 1)}
                    >
                      &lt; Back
                    </button>
                    {getPageNumbers(userPage, userPageCount).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`um-pagination__btn ${n === userPage ? 'um-pagination__btn--active' : ''}`}
                        onClick={() => setUserPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="um-pagination__btn um-pagination__btn--nav"
                      disabled={userPage === userPageCount}
                      onClick={() => setUserPage((p) => p + 1)}
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
              </section>

              <section className="db-card um-card">
                <div className="db-card__header">
                  <h3>Role Management</h3>
                  <div className="um-card__header-actions">
                    <div className="db-search db-search--sm">
                      <img src={SearchIcon} alt="" className="db-search__icon" width="14" height="14" />
                      <input
                        type="text"
                        placeholder="Search"
                        value={roleSearch}
                        onChange={(e) => {
                          setRoleSearch(e.target.value);
                          setRolePage(1);
                        }}
                        aria-label="Search roles"
                      />
                      {roleSearch ? (
                        <button
                          type="button"
                          className="db-search__clear"
                          onClick={() => setRoleSearch('')}
                          aria-label="Clear role search"
                        >
                          <img src={SearchClear} alt="" width="14" height="14" />
                        </button>
                      ) : (
                        <img src={SearchClear} alt="" className="db-search__clear-icon" width="14" height="14" />
                      )}
                    </div>
                    <button
                      type="button"
                      className="db-btn db-btn--outline"
                      onClick={openDeleteRoles}
                      disabled={selectedRoles.size === 0}
                    >
                      <img src={DeleteIcon} alt="" width="12" height="14" />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>

                <div className="db-table-wrap">
                  <table className="db-table um-table">
                    <thead>
                      <tr>
                        <th className="um-table__checkbox-col">
                          <input
                            type="checkbox"
                            className="um-checkbox"
                            checked={allPagedRolesSelected}
                            onChange={toggleAllRoles}
                            aria-label="Select all roles on this page"
                          />
                        </th>
                        <th>Role ID</th>
                        <th>Role Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Permission</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRoles.map((row) => (
                        <tr key={row.id}>
                          <td className="um-table__checkbox-col">
                            <input
                              type="checkbox"
                              className="um-checkbox"
                              checked={selectedRoles.has(row.id)}
                              onChange={() => toggleRole(row.id)}
                              aria-label={`Select ${row.name}`}
                            />
                          </td>
                          <td>
                            <span className="um-id-link">{row.id}</span>
                          </td>
                          <td>{row.name}</td>
                          <td>{row.description}</td>
                          <td>
                            <RoleStatusPill status={row.status} />
                          </td>
                          <td>{row.permission}</td>
                          <td>
                            <button type="button" className="um-row-action" aria-label={`Edit ${row.name}`} onClick={() => handleEditRole(row)}>
                              <img src={EditIcon} alt="" width="12" height="12" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pagedRoles.length === 0 && (
                        <tr>
                          <td colSpan={7} className="um-table__empty">No roles match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="um-pagination">
                  <p className="um-pagination__text">
                    Showing {filteredRoles.length === 0 ? 0 : roleStartIndex + 1} to{' '}
                    {Math.min(roleStartIndex + ROLES_PAGE_SIZE, filteredRoles.length)} of {filteredRoles.length} roles
                  </p>
                  <div className="um-pagination__controls">
                    <button
                      type="button"
                      className="um-pagination__btn um-pagination__btn--nav"
                      disabled={rolePage === 1}
                      onClick={() => setRolePage((p) => p - 1)}
                    >
                      &lt; Back
                    </button>
                    {getPageNumbers(rolePage, rolePageCount).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`um-pagination__btn ${n === rolePage ? 'um-pagination__btn--active' : ''}`}
                        onClick={() => setRolePage(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="um-pagination__btn um-pagination__btn--nav"
                      disabled={rolePage === rolePageCount}
                      onClick={() => setRolePage((p) => p + 1)}
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
          <AppFooter />
        </div>
      </div>

      <AddUserModal
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onCreate={handleCreateUser}
        roleOptions={roleOptions}
      />
      <UpdateUserRoleModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUserRole}
        user={editingUser}
        roleOptions={roleOptions}
      />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        target={deleteTarget}
      />
      <SuccessToast
        isOpen={Boolean(toast)}
        title={toast?.title}
        message={toast?.message}
        onClose={dismissToast}
      />
    </div>
  );
}

export default UserManagementPage;
