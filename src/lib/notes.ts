import { generateId } from './random'

/**
 * Note storage utilities.
 *
 * The notes are persisted in the browser's `localStorage` under the key
 * `psicotm.notes.v1`. The format is a JSON-encoded array of {@link Note} objects.
 */

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

const NOTES_KEY = 'psicotm.notes.v1'

const bundledNoteModules = import.meta.glob('../Apuntes/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getBundledNotes(): Note[] {
  const now = new Date().toISOString()
  return Object.entries(bundledNoteModules)
    .map(([filePath, content]) => {
      const fileName = filePath.split('/').pop() ?? filePath
      const title = fileName.replace(/\.txt$/i, '')
      return {
        id: `apunte-${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
        title,
        content: typeof content === 'string' ? content.trim() : '',
        createdAt: now,
        updatedAt: now,
      }
    })
    .filter((note) => note.content.length > 0)
    .sort((a, b) => a.title.localeCompare(b.title, 'es'))
}

/** Read all stored notes. Returns an empty array on error or when nothing is stored. */
export function readNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isNote) as Note[]
  } catch {
    return []
  }
}

/** Write the complete notes list back to `localStorage`. */
export function writeNotes(notes: Note[]) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  } catch {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes.slice(0, 50)))
    } catch {
      // Persistence is best-effort.
    }
  }
}

/** Ensure the storage key exists on first load, seeding bundled study notes if empty. */
export function initializeNotes(): Note[] {
  try {
    if (localStorage.getItem(NOTES_KEY) === null) {
      const defaults = getBundledNotes()
      writeNotes(defaults)
      return defaults
    }
    return readNotes()
  } catch {
    return []
  }
}

export function restoreBundledNotes(): Note[] {
  const existing = readNotes()
  const bundled = getBundledNotes()
  const existingTitles = new Set(existing.map((n) => n.title.toLowerCase()))
  const missing = bundled.filter((n) => !existingTitles.has(n.title.toLowerCase()))
  const merged = [...existing, ...missing]
  writeNotes(merged)
  return merged
}

/** Create a new note, persist it and return the created object. */
export function createNote(data: { title: string; content: string }): Note {
  const now = new Date().toISOString()
  const note: Note = {
    id: generateId('note'),
    title: data.title,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  }
  const notes = readNotes()
  notes.unshift(note)
  writeNotes(notes)
  return note
}

/** Update an existing note. Returns the updated note or `null` if not found. */
export function updateNote(
  id: string,
  changes: { title?: string; content?: string },
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
