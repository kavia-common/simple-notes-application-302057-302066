import React, { useMemo } from 'react';
import styles from './NoteItem.module.css';
import { notePreview } from '../utils/notesUtils';

function formatShort(iso) {
  const t = iso ? new Date(iso) : null;
  if (!t || Number.isNaN(t.getTime())) return '';
  return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// PUBLIC_INTERFACE
export default function NoteItem({ note, active, onClick }) {
  /** A selectable note list row with title + preview. */
  const preview = useMemo(() => notePreview(note), [note]);

  return (
    <div
      className={`${styles.item} ${active ? styles.active : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      aria-label={`Open note: ${note?.title || 'Untitled'}`}
    >
      <div
        className={styles.colorBar}
        style={{
          background:
            note?.color === 'amber'
              ? 'rgba(245, 158, 11, 0.65)'
              : 'rgba(37, 99, 235, 0.55)',
          boxShadow:
            note?.color === 'amber'
              ? '0 0 0 3px rgba(245, 158, 11, 0.12)'
              : '0 0 0 3px rgba(37, 99, 235, 0.12)',
        }}
        aria-hidden="true"
      />
      <div className={styles.content}>
        <div className={styles.rowTop}>
          <div className={styles.title}>{note?.title || 'Untitled'}</div>
          <div className={styles.meta}>
            {note?.pinned ? <span className={styles.pin} title="Pinned">PIN</span> : null}
          </div>
        </div>
        <div className={styles.preview}>{preview}</div>
        <div className={styles.time}>Updated {formatShort(note?.updatedAt || note?.createdAt)}</div>
      </div>
    </div>
  );
}
