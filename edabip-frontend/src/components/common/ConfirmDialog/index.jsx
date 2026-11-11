function ConfirmDialog({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <dialog
      open
      aria-modal="true"
      aria-label="Confirm"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <p>Confirm?</p>
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </dialog>
  );
}

export default ConfirmDialog;
