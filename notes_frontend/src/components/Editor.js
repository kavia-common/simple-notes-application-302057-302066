import React, { useEffect, useMemo, useState } from 'react';
import styles from './Editor.module.css';
import appStyles from '../App.module.css';
import { normalizeTitle, validateNoteDraft } from '../utils/notesUtils';

function formatLong(iso) {
  const t = iso ? new Date(iso) : null;
  if (!t || Number.isNaN(t.getTime())) return '';
  return t.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// PUBLIC_INTERFACE
export default function Editor({
  note,
  dirty,
  setDirty,
  onSave,
  onDelete,
  onTogglePinned,
  onSetColor,
  saving,
  saveError,
}) {
  /** Main note editor with title/content and explicit save. */
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // When note changes, reset local draft.
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setValidationError('');
    setDirty(false);
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const draft = useMemo(() => ({ title, content }), [title, content]);

  const canSave = useMemo(() => {
    const v = validateNoteDraft(draft);
    return v.ok && dirty && !saving;
  }, [draft, dirty, saving]);

  const doSave = async () => {
    const v = validateNoteDraft(draft);
    if (!v.ok) {
      setValidationError(v.error);
      return;
    }
    setValidationError('');
    await onSave({
      title: normalizeTitle(title),
      content,
    });
  };

  return (
    <div className={styles.root} aria-label="Editor">
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${appStyles.btn} ${appStyles.btnPrimary}`}
          onClick={doSave}
          disabled={!canSave}
          title="Save (Ctrl/Cmd+S)"
        >
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>

        <button
          type="button"
          className={`${appStyles.btn} ${appStyles.btnGhost}`}
          onClick={onTogglePinned}
          title="Toggle pinned"
        >
          {note?.pinned ? 'Unpin' : 'Pin'}
        </button>

        <button
          type="button"
          className={`${appStyles.btn} ${appStyles.btnGhost}`}
          onClick={() => onSetColor(note?.color === 'amber' ? 'blue' : 'amber')}
          title="Toggle color"
        >
          Color: {note?.color === 'amber' ? 'Amber' : 'Blue'}
        </button>

        <div className={appStyles.spacer} />

        <button
          type="button"
          className={`${appStyles.btn} ${appStyles.btnDanger}`}
          onClick={onDelete}
          title="Delete note"
        >
          Delete
        </button>
      </div>

      <div className={styles.titleWrap}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
            if (validationError) setValidationError('');
          }}
          placeholder="Note title"
          aria-label="Note title"
        />
        {validationError ? <div className={styles.error}>{validationError}</div> : null}
        {saveError ? <div className={styles.error}>{saveError}</div> : null}
      </div>

      <div className={styles.bodyWrap}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          placeholder="Write something… (Markdown supported later)"
          aria-label="Note content"
        />

        <div className={styles.metaRow}>
          <div className={styles.pill}>Created: {formatLong(note?.createdAt)}</div>
          <div className={styles.pill}>Updated: {formatLong(note?.updatedAt)}</div>
          <div className={styles.smallHint}>
            {dirty ? 'Unsaved changes' : 'No pending changes'}
          </div>
        </div>
      </div>
    </div>
  );
}
