import { isBackendEnabled, getBackendBaseUrl } from '../config/env';
import { generateId, nowIso, normalizeTitle, sortNotes } from '../utils/notesUtils';

const STORAGE_KEY = 'simpleNotes.notes.v1';

/**
 * Future-ready REST adapter (not enabled until backend env is set).
 * Keeping the shape here makes it easy to swap implementations later.
 */
async function backendRequest(path, options = {}) {
  const base = getBackendBaseUrl();
  if (!base) {
    // Defensive: never attempt fetch when backend is disabled.
    throw new Error('Backend is not configured.');
  }

  const url = `${base.replace(/\/$/, '')}${path}`;

  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (e) {
    // Typical browser error when server is down / CORS / DNS: "Failed to fetch".
    const msg = e?.message || 'Failed to fetch.';
    throw new Error(`Network error: ${msg}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

function readLocalNotes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeLocalNotes(notes) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function ensureSeedDataIfEmpty(notes) {
  if (notes.length > 0) return notes;

  const createdAt = nowIso();
  const seed = [
    {
      id: generateId(),
      title: 'Welcome to Simple Notes',
      content:
        'Create notes on the left, edit on the right.\n\nKeyboard shortcuts:\n- Ctrl/Cmd + N: New note\n- Ctrl/Cmd + S: Save\n\nThis app uses localStorage for now.',
      createdAt,
      updatedAt: createdAt,
      pinned: true,
      color: 'blue',
    },
  ];
  writeLocalNotes(seed);
  return seed;
}

function getLocalNotesWithSeed() {
  return sortNotes(ensureSeedDataIfEmpty(readLocalNotes()));
}

function isLikelyNetworkError(err) {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('ecconnrefused') ||
    msg.includes('timeout')
  );
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** List notes (localStorage by default). */
  if (!isBackendEnabled()) {
    return getLocalNotesWithSeed();
  }

  try {
    return await backendRequest('/notes', { method: 'GET' });
  } catch (err) {
    // Graceful fallback: if backend is configured but unreachable, don't crash the app on mount.
    if (isLikelyNetworkError(err)) {
      return getLocalNotesWithSeed();
    }
    throw err;
  }
}

// PUBLIC_INTERFACE
export async function getNote(id) {
  /** Fetch a note by id. */
  if (isBackendEnabled()) {
    return backendRequest(`/notes/${encodeURIComponent(id)}`, { method: 'GET' });
  }
  const notes = readLocalNotes();
  return notes.find((n) => n.id === id) || null;
}

// PUBLIC_INTERFACE
export async function createNote(partial) {
  /** Create a new note. Returns created note. */
  if (isBackendEnabled()) {
    return backendRequest('/notes', { method: 'POST', body: JSON.stringify(partial) });
  }

  const notes = readLocalNotes();
  const ts = nowIso();
  const note = {
    id: generateId(),
    title: normalizeTitle(partial?.title || 'Untitled'),
    content: partial?.content || '',
    createdAt: ts,
    updatedAt: ts,
    pinned: Boolean(partial?.pinned),
    color: partial?.color || 'blue',
  };

  const next = [note, ...notes];
  writeLocalNotes(next);
  return note;
}

// PUBLIC_INTERFACE
export async function updateNote(id, patch) {
  /** Update a note. Returns updated note. */
  if (isBackendEnabled()) {
    return backendRequest(`/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  const notes = readLocalNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx < 0) throw new Error('Note not found.');

  const current = notes[idx];
  const updated = {
    ...current,
    ...patch,
    title: patch?.title !== undefined ? normalizeTitle(patch.title) : current.title,
    updatedAt: nowIso(),
  };

  const next = [...notes];
  next[idx] = updated;
  writeLocalNotes(next);
  return updated;
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete note by id. Returns { ok: true }. */
  if (isBackendEnabled()) {
    return backendRequest(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  const notes = readLocalNotes();
  const next = notes.filter((n) => n.id !== id);
  writeLocalNotes(next);
  return { ok: true };
}
