// src/lib/notes.ts
/**
 * Note storage utilities.
 *
 * The notes are persisted in the browser's `localStorage` under the key
 * `psicotm.notes.v1`. The format is a JSON‑encoded array of {@link Note} objects.
 *
 * The implementation mirrors the error‑handling strategy used in `storage.ts`
 * (best‑effort persistence): if `localStorage` throws (e.g., quota exceeded or
 * unavailable) we silently ignore the failure so the application remains
 * usable. When reading, any malformed data results in an empty list.
 */

export interface Note {
  /** Unique identifier – a UUID generated when the note is created. */
  id: string
  /** Short title shown in listings. */
  title: string
  /** Full note content. */
  content: string
  /** ISO‑8601 timestamp of creation. */
  createdAt: string
  /** ISO‑8601 timestamp of the last update. */
  updatedAt: string
}

const NOTES_KEY = 'psicotm.notes.v1'

/** Read all stored notes. Returns an empty array on error or when nothing is stored. */
export function readNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Basic runtime validation – keep only objects that look like a Note.
    const notes = parsed.filter(isNote) as Note[]
    return notes
  } catch {
    return []
  }
}

/** Write the complete notes list back to `localStorage`. Best‑effort: if the first
 * attempt fails we try to store a truncated version (first 50 notes) to avoid
 * exceeding quota. If that also fails we silently give up – the UI can continue
 * to work with the in‑memory copy.
 */
export function writeNotes(notes: Note[]) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  } catch {
    // Fallback to a smaller payload; this mirrors the pattern used for history.
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes.slice(0, 50)))
    } catch {
      // Give up – persistence is best‑effort.
    }
  }
}

/** Ensure the storage key exists – useful on first load. */
export function initializeNotes() {
  if (!localStorage.getItem(NOTES_KEY)) {
    writeNotes([])
  }
}

/** Create a new note, persist it and return the created object. */
export function createNote(data: { title: string; content: string }): Note {
  const now = new Date().toISOString()
  const note: Note = {
    id: generateId(),
    title: data.title,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  }
  const notes = readNotes()
  notes.unshift(note) // newest first
  writeNotes(notes)
  return note
}

/** Update an existing note. Returns the updated note or `null` if not found. */
export function updateNote(
  id: string,
  changes: { title?: string; content?: string }
): Note | null {
  const notes = readNotes()
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) return null
  const note = notes[index]
  const updated: Note = {
    ...note,
    title: changes.title ?? note.title,
    content: changes.content ?? note.content,
    updatedAt: new Date().toISOString(),
  }
  notes[index] = updated
  writeNotes(notes)
  return updated
}

/** Delete a note by its identifier. Returns `true` if a note was removed. */
export function deleteNote(id: string): boolean {
  const notes = readNotes()
  const filtered = notes.filter((n) => n.id !== id)
  if (filtered.length === notes.length) return false
  writeNotes(filtered)
  return true
}

/** Simple runtime guard to avoid returning malformed objects. */
function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false
  const n = value as Partial<Note>
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    typeof n.createdAt === 'string' &&
    typeof n.updatedAt === 'string'
  )
}

/** Generate a UUID. Uses the Web Crypto API when available, otherwise falls back
 * to a simple random string. This keeps the module usable in test environments
 * that may not provide `crypto.randomUUID`.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore – TypeScript may not know about randomUUID in older libs.
    return (crypto as any).randomUUID()
  }
  // Fallback: 16‑character alphanumeric string.
  return 'xxxxxx'.replace(/x/g, () => Math.random().toString(36).charAt(2))
}
