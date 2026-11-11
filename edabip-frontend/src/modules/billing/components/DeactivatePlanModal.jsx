import { useEffect, useId, useRef, useState } from 'react';
import './DeactivatePlanModal.css';

const DEACTIVATE_COMMENT_MIN_WORDS = 50;
/** Headroom for ~200 words plus extra explanation. */
const DEACTIVATE_COMMENT_MAX_LENGTH = 4000;

const COPY =
  'Are you sure you want to deactivate your plan? Your plan will be temporarily deactivated, and you can reactivate it anytime.';

function countCommentWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function DeactivatePlanModal({
  isOpen,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const commentsId = useId();
  const cancelButtonRef = useRef(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  const wordCount = countCommentWords(comment);
  const hasMinWords = wordCount >= DEACTIVATE_COMMENT_MIN_WORDS;
  const canSubmit = hasMinWords && !isSubmitting;

  const clearForm = () => {
    setComment('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      clearForm();
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (!isSubmitting) onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isSubmitting, onCancel]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    cancelButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) onCancel();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await onConfirm(comment.trim());
      clearForm();
    } catch {
      setError('Unable to deactivate your plan right now. Try again.');
    }
  };

  return (
    <div className="bl-deactivate__backdrop" onClick={handleBackdropClick}>
      <form
        className="bl-deactivate__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onSubmit={handleSubmit}
      >
        <h2 id={titleId} className="bl-deactivate__title">
          Deactivate Plan
        </h2>
          <p id={descriptionId} className="bl-deactivate__message">
            {COPY}
          </p>

        <label className="bl-deactivate__field" htmlFor={commentsId}>
          <span className="visually-hidden">Comments</span>
          <textarea
            id={commentsId}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add comments"
            maxLength={DEACTIVATE_COMMENT_MAX_LENGTH}
            disabled={isSubmitting}
            rows={4}
            aria-describedby={`${commentsId}-hint`}
          />
        </label>
        <p id={`${commentsId}-hint`} className={`bl-deactivate__counter${hasMinWords ? ' is-ok' : ''}`}>
          {wordCount} / {DEACTIVATE_COMMENT_MIN_WORDS} words
        </p>
        {error ? (
          <p className="bl-deactivate__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="bl-deactivate__actions">
          <button
            type="button"
            className="bl-deactivate__btn bl-deactivate__btn--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
            ref={cancelButtonRef}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`bl-deactivate__btn bl-deactivate__btn--confirm${canSubmit ? '' : ' is-disabled'}`}
            disabled={!canSubmit}
            aria-busy={isSubmitting}
            aria-describedby={hasMinWords ? undefined : `${commentsId}-hint`}
          >
            {isSubmitting ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeactivatePlanModal;
