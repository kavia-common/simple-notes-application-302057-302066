import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';

import Sidebar from './components/Sidebar';
import EmptyState from './components/EmptyState';
import Editor from './components/Editor';

import { listNotes, createNote, updateNote, deleteNote } from './services/notesService';
import { normalizeTitle, sortNotes, validateNoteDraft } from './utils/notesUtils';
import { isBackendConfigured } from './config/env';

// PUBLIC_INTERFACE
function App() {
  /** Single-page notes app with localStorage persistence and backend-ready service layer. */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [appNotice, setAppNotice] = useState('');

  const lastLoadedRef = useRef(false);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const title = (n.title || '').toLowerCase();
      const content = (n.content || '').toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [notes, query]);

  const refreshNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const result = await listNotes();
      const sorted = sortNotes(result || []);
      setNotes(sorted);

      // If the backend is configured but unreachable, listNotes() falls back to local notes.
      // Surface a small non-blocking message so users understand why.
      if (isBackendConfigured()) {
        setAppNotice(
          'Backend is configured but unreachable. Showing local notes stored in this browser.'
        );
      } else {
        setAppNotice('');
      }

      // Select first note if none selected.
      if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id);
    } catch (e) {
      setAppNotice(e?.message || 'Unable to load notes.');
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, [selectedId]);

  useEffect(() => {
    // Initial load.
    if (lastLoadedRef.current) return;
    lastLoadedRef.current = true;
    refreshNotes();
  }, [refreshNotes]);

  const handleCreateNote = useCallback(async () => {
    const created = await createNote({
      title: 'Untitled',
      content: '',
      pinned: false,
      color: 'blue',
    });
    // Put it at top and select it.
    setNotes((prev) => sortNotes([created, ...prev]));
    setSelectedId(created.id);
    setQuery('');
    setDirty(false);
    setSaveError('');
  }, []);

  const handleSave = useCallback(
    async (patch) => {
      if (!selectedNote) return;

      const v = validateNoteDraft({ title: patch?.title, content: patch?.content });
      if (!v.ok) {
        setSaveError(v.error);
        return;
      }

      setSaving(true);
      setSaveError('');
      try {
        const updated = await updateNote(selectedNote.id, patch);
        setNotes((prev) => sortNotes(prev.map((n) => (n.id === updated.id ? updated : n))));
        setDirty(false);
      } catch (e) {
        setSaveError(e?.message || 'Failed to save note.');
      } finally {
        setSaving(false);
      }
    },
    [selectedNote]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedNote) return;
    const ok = window.confirm(`Delete "${selectedNote.title}"? This cannot be undone.`);
    if (!ok) return;

    await deleteNote(selectedNote.id);
    setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
    setDirty(false);
    setSaveError('');

    // Select next available note.
    setSelectedId((prevSelected) => {
      if (prevSelected !== selectedNote.id) return prevSelected;
      const remaining = notes.filter((n) => n.id !== selectedNote.id);
      return remaining.length > 0 ? remaining[0].id : '';
    });
  }, [selectedNote, notes]);

  const handleTogglePinned = useCallback(async () => {
    if (!selectedNote) return;
    const updated = await updateNote(selectedNote.id, { pinned: !selectedNote.pinned });
    setNotes((prev) => sortNotes(prev.map((n) => (n.id === updated.id ? updated : n))));
  }, [selectedNote]);

  const handleSetColor = useCallback(
    async (color) => {
      if (!selectedNote) return;
      const updated = await updateNote(selectedNote.id, { color });
      setNotes((prev) => sortNotes(prev.map((n) => (n.id === updated.id ? updated : n))));
    },
    [selectedNote]
  );

  // Keyboard shortcuts: Ctrl/Cmd+N new, Ctrl/Cmd+S save.
  useEffect(() => {
    const onKeyDown = (e) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (!mod) return;

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      }

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!selectedNote) return;
        // Trigger save by toggling dirty false only after successful save in Editor flow,
        // here we just attempt minimal save of current server state (no-op if not dirty).
        // Editor drives patch updates; this shortcut is mainly for the Save button in Editor.
        // We keep a safe fallback: ensure title is non-empty.
        if (!dirty) return;
        handleSave({ title: normalizeTitle(selectedNote.title), content: selectedNote.content });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCreateNote, handleSave, selectedNote, dirty]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Sidebar
            notes={filteredNotes}
            selectedId={selectedId}
            query={query}
            onQueryChange={setQuery}
            onSelectNote={(id) => {
              if (dirty && id !== selectedId) {
                const ok = window.confirm('You have unsaved changes. Switch notes anyway?');
                if (!ok) return;
              }
              setSelectedId(id);
              setSaveError('');
              setDirty(false);
            }}
            onCreateNote={handleCreateNote}
            loading={loadingNotes}
          />
        </aside>

        <main className={styles.main}>
          <div className={styles.mainInner}>
            <div className={styles.statusBar}>
              <div className={styles.badge}>
                <span
                  className={styles.dot}
                  style={{
                    background: isBackendConfigured() ? '#2563EB' : '#F59E0B',
                    boxShadow: isBackendConfigured()
                      ? '0 0 0 3px rgba(37, 99, 235, 0.18)'
                      : '0 0 0 3px rgba(245, 158, 11, 0.18)',
                  }}
                  aria-hidden="true"
                />
                Mode: {isBackendConfigured() ? 'Backend' : 'Local'}
              </div>

              {appNotice ? (
                <div className={styles.badge} role="status" aria-live="polite">
                  {appNotice}
                </div>
              ) : null}

              <div className={styles.badge}>
                <span>Shortcuts:</span> <kbd>Ctrl</kbd>+<kbd>N</kbd>, <kbd>Ctrl</kbd>+<kbd>S</kbd>
              </div>
            </div>

            {!selectedNote ? (
              <EmptyState onCreateNote={handleCreateNote} />
            ) : (
              <Editor
                note={selectedNote}
                dirty={dirty}
                setDirty={setDirty}
                saving={saving}
                saveError={saveError}
                onSave={async (patch) => {
                  // Patch is from editor draft; update store immediately for UX while saving.
                  setNotes((prev) =>
                    prev.map((n) => (n.id === selectedNote.id ? { ...n, ...patch } : n))
                  );
                  await handleSave(patch);
                  // After saving, refresh list ordering in case updatedAt changed
                  await refreshNotes();
                }}
                onDelete={handleDelete}
                onTogglePinned={handleTogglePinned}
                onSetColor={handleSetColor}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
