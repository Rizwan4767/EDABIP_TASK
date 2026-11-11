import { useEffect, useState } from 'react';
import UserDialog from './UserDialog.jsx';
import InfoIcon from '../../../assets/dashboard/users/info-icon.svg';

function UpdateUserRoleModal({ isOpen, onClose, onSave, user, roleOptions }) {
  const [nextRole, setNextRole] = useState(user?.role || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setNextRole(user?.role || roleOptions[0] || '');
    setError('');
  }, [isOpen, user, roleOptions]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!nextRole) {
      setError('Select a role to assign.');
      return;
    }
    if (nextRole === user?.role) {
      setError('Choose a different role to update.');
      return;
    }
    onSave(nextRole);
  };

  return (
    <UserDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="um-update-role-title"
      describedBy="um-update-role-copy um-update-role-note"
    >
      {({ closeButtonRef }) => (
        <form className="um-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="um-modal__header">
            <div className="um-modal__header-block">
              <h2 id="um-update-role-title" className="um-modal__title">
                Update User Role
              </h2>
              <p id="um-update-role-copy" className="um-modal__subtitle">
                Change the role assigned to this user.
              </p>
            </div>
            <button
              type="button"
              className="um-modal__close"
              aria-label="Close dialog"
              onClick={onClose}
              ref={closeButtonRef}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="um-modal__alert" id="um-update-role-note" role="note">
            <img src={InfoIcon} alt="" width="20" height="20" />
            <p>
              Updating the role will modify the user&apos;s access permissions and
              features availability.
            </p>
          </div>

          <label className="um-modal__field" htmlFor="um-current-role">
            <span>Current User Role</span>
            <input
              id="um-current-role"
              type="text"
              value={user?.role ?? ''}
              readOnly
              className="um-modal__input--readonly"
            />
          </label>

          <label className="um-modal__field" htmlFor="um-update-role">
            <span>
              Update User Role <span className="um-modal__required" aria-hidden="true">*</span>
            </span>
            <span className="um-modal__select-wrap">
              <select
                id="um-update-role"
                value={nextRole}
                onChange={(event) => {
                  setNextRole(event.target.value);
                  setError('');
                }}
                required
                aria-required="true"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </span>
          </label>

          {error ? (
            <p className="um-modal__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="um-modal__actions">
            <button type="button" className="um-modal__btn um-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="um-modal__btn um-modal__btn--solid">
              Update Role
            </button>
          </div>
        </form>
      )}
    </UserDialog>
  );
}

export default UpdateUserRoleModal;
