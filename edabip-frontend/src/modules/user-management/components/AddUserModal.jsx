import { useEffect, useState } from 'react';
import UserDialog from './UserDialog.jsx';
import InfoIcon from '../../../assets/dashboard/users/info-icon.svg';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'User',
};

function AddUserModal({ isOpen, onClose, onCreate, roleOptions }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...EMPTY_FORM, role: roleOptions[0] || 'User' });
    setError('');
  }, [isOpen, roleOptions]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const role = form.role.trim();

    if (!firstName || !lastName || !email || !role) {
      setError('Please fill in all fields.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    onCreate({ firstName, lastName, email, role });
  };

  return (
    <UserDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="um-add-user-title"
      describedBy="um-add-user-copy um-add-user-note"
    >
      {({ closeButtonRef }) => (
        <form className="um-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="um-modal__header">
            <div className="um-modal__header-block">
              <h2 id="um-add-user-title" className="um-modal__title">
                Add User
              </h2>
              <p id="um-add-user-copy" className="um-modal__subtitle">
                Create a new user and assign access permissions.
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

          <div className="um-modal__alert" id="um-add-user-note" role="note">
            <img src={InfoIcon} alt="" width="20" height="20" />
            <p>
              Fill in the details below to create a new user. You can configure
              permissions after creation.
            </p>
          </div>

          <label className="um-modal__field" htmlFor="um-add-first-name">
            <span>First Name</span>
            <input
              id="um-add-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
            />
          </label>

          <label className="um-modal__field" htmlFor="um-add-last-name">
            <span>Last Name</span>
            <input
              id="um-add-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
            />
          </label>

          <label className="um-modal__field" htmlFor="um-add-email">
            <span>Email Address</span>
            <input
              id="um-add-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
          </label>

          <div className="um-modal__field um-modal__field--locked">
            <span id="um-add-role-label">Role</span>
            <span
              className="um-modal__select-wrap um-modal__select-wrap--locked"
              aria-labelledby="um-add-role-label"
              aria-describedby="um-add-role-hint"
            >
              <select
                id="um-add-role"
                name="role"
                value={form.role}
                disabled
                tabIndex={-1}
                aria-labelledby="um-add-role-label"
                aria-describedby="um-add-role-hint"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <span className="um-modal__select-lock" aria-hidden="true" />
              <span className="um-modal__role-hint" id="um-add-role-hint" role="tooltip">
                This role is assigned automatically. You can update it after the user is created.
              </span>
            </span>
          </div>

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
              Create User
            </button>
          </div>
        </form>
      )}
    </UserDialog>
  );
}

export default AddUserModal;
