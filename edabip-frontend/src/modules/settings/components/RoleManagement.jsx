import { useEffect, useMemo, useRef, useState } from 'react';
import CollapsibleSection from './CollapsibleSection.jsx';
import PermissionMatrix from './PermissionMatrix.jsx';
import { normalizePermissions, sortMatrixRoles } from '../data/permissionMatrix.js';

const PAGE_SIZE = 4;
const TABS = [
  { id: 'overview', label: 'Roles Overview' },
  { id: 'matrix', label: 'Permission Matrix' },
];

function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= pageCount - 2) {
    return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

function RowMenu({ role, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="st-menu" ref={menuRef} role="menu" aria-label={`${role.name} actions`}>
      <button type="button" role="menuitem" onClick={onClose}>
        View details
      </button>
      <button type="button" role="menuitem" onClick={onClose}>
        Edit role
      </button>
    </div>
  );
}

function RoleManagement({ roles }) {
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState('');
  const [matrix, setMatrix] = useState({});

  useEffect(() => {
    setMatrix((prev) => {
      const sameShape =
        Object.keys(prev).length === roles.length &&
        roles.every((role) => Object.hasOwn(prev, role.id));
      if (sameShape) return prev;

      const next = {};
      roles.forEach((role) => {
        next[role.id] = prev[role.id] || normalizePermissions(role.name, role.permissions);
      });
      return next;
    });
  }, [roles]);

  const pageCount = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedRoles = roles.slice(start, start + PAGE_SIZE);
  const pages = useMemo(
    () => getPageNumbers(currentPage, pageCount),
    [currentPage, pageCount]
  );

  const uniqueRoles = useMemo(() => {
    const seen = new Set();
    const next = roles.filter((role) => {
      if (seen.has(role.name)) return false;
      seen.add(role.name);
      return true;
    });
    return sortMatrixRoles(next);
  }, [roles]);

  return (
    <CollapsibleSection
      title="Role & Permissions"
      description="Manage roles and permissions for your organization."
    >
      <div className="st-tabs" role="tablist" aria-label="Role management views">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`st-tab${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Users</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="st-table__empty">
                      No roles available.
                    </td>
                  </tr>
                ) : (
                  pagedRoles.map((role) => (
                    <tr key={role.id}>
                      <td>{role.name}</td>
                      <td>{role.userCount}</td>
                      <td>{role.description}</td>
                      <td className="st-table__action">
                        <button
                          type="button"
                          className="st-kebab"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === role.id}
                          aria-label={`More actions for ${role.name}`}
                          onClick={() => setOpenMenuId((prev) => (prev === role.id ? '' : role.id))}
                        >
                          <span />
                        </button>
                        {openMenuId === role.id ? (
                          <RowMenu role={role} onClose={() => setOpenMenuId('')} />
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="st-pagination">
            <p>
              Showing {roles.length === 0 ? 0 : start + 1} to {Math.min(start + PAGE_SIZE, roles.length)} of{' '}
              {roles.length} roles
            </p>
            <div className="st-pagination__controls">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Back
              </button>
              {pages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === currentPage ? 'is-active' : ''}
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <PermissionMatrix roles={uniqueRoles} matrix={matrix} />
      )}
    </CollapsibleSection>
  );
}

export default RoleManagement;
