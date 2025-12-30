/**
 * Notes utilities: ids, timestamps, sorting, and validation.
 */

// PUBLIC_INTERFACE
export function nowIso() {
  /** Returns current time as ISO string. */
  return new Date().toISOString();
}

// PUBLIC_INTERFACE
export function generateId() {
  /** Generates a stable unique id without external dependencies. */
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// PUBLIC_INTERFACE
export function normalizeTitle(title) {
  /** Trim title and collapse whitespace. */
  return (title || '').replace(/\s+/g, ' ').trim();
}

// PUBLIC_INTERFACE
export function validateNoteDraft(draft) {
  /** Validates a note draft. Returns { ok, error }. */
  const title = normalizeTitle(draft?.title);
  if (!title) return { ok: false, error: 'Title cannot be empty.' };
  return { ok: true, error: '' };
}

// PUBLIC_INTERFACE
export function sortNotes(notes) {
  /**
   * Sorts notes: pinned first, then updatedAt desc, then createdAt desc.
   */
  return [...notes].sort((a, b) => {
    const ap = a?.pinned ? 1 : 0;
    const bp = b?.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;

    const au = a?.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bu = b?.updatedAt ? Date.parse(b.updatedAt) : 0;
    if (au !== bu) return bu - au;

    const ac = a?.createdAt ? Date.parse(a.createdAt) : 0;
    const bc = b?.createdAt ? Date.parse(b.createdAt) : 0;
    return bc - ac;
  });
}

// PUBLIC_INTERFACE
export function notePreview(note) {
  /** Returns a compact preview string from note content. */
  const text = (note?.content || '').trim();
  if (!text) return 'No content';
  const firstLine = text.split('\n').find((l) => l.trim().length > 0) || '';
  const trimmed = firstLine.trim();
  return trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
}
