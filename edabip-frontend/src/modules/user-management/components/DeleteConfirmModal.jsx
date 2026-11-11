import UserDialog from './UserDialog.jsx';
import DeleteIcon from '../../../assets/dashboard/users/Delete-icon.svg';
import InfoIcon from '../../../assets/dashboard/users/info-icon.svg';

function deleteNoun(isRole, isPlural) {
  if (isRole) return isPlural ? 'Roles' : 'Role';
  return isPlural ? 'Users' : 'User';
}

function deleteWarning(isRole, isPlural) {
  if (isRole && isPlural) {
    return 'Deleting these roles will permanently remove them and all associated permissions. Users assigned to these roles may lose access to certain features.';
  }
  if (isRole) {
    return 'Deleting this role will permanently remove it and all associated permissions. Users assigned to this role may lose access to certain features.';
  }
  if (isPlural) {
    return 'Deleting these users will permanently remove their accounts and access. This cannot be undone.';
  }
  return 'Deleting this user will permanently remove their account and access. This cannot be undone.';
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, target }) {
  const isRole = target?.type === 'role';
  const count = target?.count || 0;
  const isPlural = count > 1;
  const noun = deleteNoun(isRole, isPlural);
  const titleId = 'um-delete-title';
  const copyId = 'um-delete-copy';
  const warning = deleteWarning(isRole, isPlural);

  return (
    <UserDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      describedBy={copyId}
      className="um-modal__card--confirm"
    >
      <div className="um-modal__confirm">
        <img
          src={DeleteIcon}
          alt=""
          className="um-modal__confirm-icon"
          width="88"
          height="94"
        />
        <h2 id={titleId} className="um-modal__title um-modal__title--center">
          Delete {noun}
        </h2>
        <p id={copyId} className="um-modal__subtitle um-modal__subtitle--center">
          This action cannot be undone.
        </p>

        <div className="um-modal__alert" role="note">
          <img src={InfoIcon} alt="" width="20" height="20" />
          <p>{warning}</p>
        </div>

        <div className="um-modal__actions">
          <button type="button" className="um-modal__btn um-modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="um-modal__btn um-modal__btn--solid" onClick={onConfirm}>
            Delete {noun}
          </button>
        </div>
      </div>
    </UserDialog>
  );
}

export default DeleteConfirmModal;
