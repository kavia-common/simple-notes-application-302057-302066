import React from 'react';
import styles from './EmptyState.module.css';
import appStyles from '../App.module.css';

// PUBLIC_INTERFACE
export default function EmptyState({ onCreateNote }) {
  /** Empty state shown when no note is selected. */
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h2 className={styles.title}>Select a note</h2>
        <p className={styles.desc}>
          Choose a note from the sidebar, or create a new one. Notes are saved locally in your browser
          (localStorage) until a backend is configured.
        </p>
        <div className={styles.actions}>
          <button
            className={`${appStyles.btn} ${appStyles.btnPrimary}`}
            onClick={onCreateNote}
            type="button"
          >
            Create your first note
          </button>
          <span className={appStyles.badge}>
            <span className={appStyles.dot} aria-hidden="true" /> Tip: <kbd>Ctrl</kbd>+<kbd>N</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
