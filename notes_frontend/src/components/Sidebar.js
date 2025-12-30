import React from 'react';
import styles from './Sidebar.module.css';
import NoteItem from './NoteItem';
import appStyles from '../App.module.css';

// PUBLIC_INTERFACE
export default function Sidebar({
  notes,
  selectedId,
  query,
  onQueryChange,
  onSelectNote,
  onCreateNote,
  loading,
}) {
  /** Sidebar with search/filter and note list. */

  return (
    <div className={styles.sidebarRoot} aria-label="Sidebar">
      <div className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <div className={styles.title}>Simple Notes</div>
            <div className={styles.subtitle}>Ocean Professional</div>
          </div>

          <button
            className={`${appStyles.btn} ${appStyles.btnPrimary}`}
            onClick={onCreateNote}
            type="button"
            aria-label="Create new note"
            title="New note (Ctrl/Cmd+N)"
          >
            New
          </button>
        </div>

        <div className={styles.searchRow}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
          />
        </div>
      </div>

      <div className={styles.list} aria-label="Notes list">
        {loading ? (
          <div className={styles.emptyList}>Loading notes…</div>
        ) : notes.length === 0 ? (
          <div className={styles.emptyList}>
            No notes found. Create one with <span className={styles.kbdGroup}><kbd>Ctrl</kbd>+<kbd>N</kbd></span>.
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              active={note.id === selectedId}
              onClick={() => onSelectNote(note.id)}
            />
          ))
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.hint}>
          <span className={styles.kbdGroup}><kbd>Ctrl</kbd>+<kbd>N</kbd></span> new ·{' '}
          <span className={styles.kbdGroup}><kbd>Ctrl</kbd>+<kbd>S</kbd></span> save
        </div>
      </div>
    </div>
  );
}
