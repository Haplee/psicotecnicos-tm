import { useState, useEffect, useRef, useCallback } from 'react'
import {
  FileText, Plus, Download, Trash2, Search, Save, Clock,
  ChevronLeft, ChevronRight, Upload, AlertCircle, CheckCircle2, RotateCcw,
} from 'lucide-react'
import {
  readNotes, createNote, updateNote, deleteNote, initializeNotes, restoreBundledNotes, type Note,
} from '../lib/notes'
import { ConfirmDialog } from './ConfirmDialog'

const wineRgba = (alpha: number) => `rgba(113, 52, 72, ${alpha})`
const badRgba = (alpha: number) => `rgba(220, 130, 141, ${alpha})`

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const saveTimeoutRef = useRef<number | undefined>(undefined)
  const pendingSaveRef = useRef<{ id: string; content: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const flushPendingSave = useCallback(() => {
    if (saveTimeoutRef.current !== undefined) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }
    if (pendingSaveRef.current) {
      const { id, content } = pendingSaveRef.current
      pendingSaveRef.current = null
      updateNote(id, { content })
      setSaveStatus('saved')
    }
  }, [])

  useEffect(() => {
    const loaded = initializeNotes()
    setNotes(loaded)
    if (loaded.length > 0) setActiveId(loaded[0].id)
    return () => {
      flushPendingSave()
    }
  }, [flushPendingSave])

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  )

  const activeNote = notes.find((n) => n.id === activeId)

  const selectNote = (id: string) => {
    flushPendingSave()
    setActiveId(id)
  }

  const handleCreate = () => {
    flushPendingSave()
    const newNote = createNote({ title: 'Nuevo apunte', content: '' })
    setNotes(readNotes())
    setActiveId(newNote.id)
    setSearch('')
    setSaveStatus('saved')
  }

  const handleRestoreBundled = () => {
    flushPendingSave()
    const merged = restoreBundledNotes()
    setNotes(merged)
    if (!activeId && merged.length > 0) setActiveId(merged[0].id)
    setUploadMessage({ type: 'success', text: 'Apuntes base de psicotécnicos cargados.' })
    window.setTimeout(() => setUploadMessage(null), 3000)
  }

  const handleTitleChange = (title: string) => {
    if (!activeId) return
    const now = new Date().toISOString()
    setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, title, updatedAt: now } : n)))
    updateNote(activeId, { title })
    setSaveStatus('saved')
  }

  const handleContentChange = (content: string) => {
    if (!activeId) return
    const targetId = activeId
    const now = new Date().toISOString()

    // Actualizamos el estado de React de inmediato para no bloquear la escritura controlada.
    setNotes((prev) => prev.map((n) => (n.id === targetId ? { ...n, content, updatedAt: now } : n)))
    setSaveStatus('unsaved')
    pendingSaveRef.current = { id: targetId, content }

    if (saveTimeoutRef.current !== undefined) window.clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('saving')
      if (pendingSaveRef.current) {
        updateNote(pendingSaveRef.current.id, { content: pendingSaveRef.current.content })
        pendingSaveRef.current = null
      }
      saveTimeoutRef.current = undefined
      setSaveStatus('saved')
    }, 250)
  }

  const confirmDelete = () => {
    if (!activeId) return
    pendingSaveRef.current = null
    if (saveTimeoutRef.current !== undefined) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }
    deleteNote(activeId)
    const remaining = readNotes()
    setNotes(remaining)
    setActiveId(remaining[0]?.id ?? null)
    setConfirmDeleteOpen(false)
    setSaveStatus('saved')
  }

  const handleFileUpload = async (file: File) => {
    const supportedTypes = ['text/plain', 'text/markdown', 'application/pdf']
    const supportedExtensions = ['.txt', '.md', '.pdf']
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`

    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExt)) {
      setUploadMessage({ type: 'error', text: `Formato no soportado: ${file.name}. Usa .txt, .md o .pdf` })
      window.setTimeout(() => setUploadMessage(null), 4000)
      return
    }

    try {
      if (file.type === 'application/pdf' || fileExt === '.pdf') {
        setUploadMessage({
          type: 'error',
          text: 'Los archivos PDF requieren procesamiento adicional. Por ahora, copia el texto y pégalo en un nuevo apunte.',
        })
        window.setTimeout(() => setUploadMessage(null), 6000)
        return
      }

      const content = await file.text()
      if (!content.trim()) {
        setUploadMessage({ type: 'error', text: 'El archivo está vacío.' })
        window.setTimeout(() => setUploadMessage(null), 3000)
        return
      }

      flushPendingSave()
      const title = file.name.replace(/\.[^/.]+$/, '')
      const newNote = createNote({ title, content })
      setNotes(readNotes())
      setActiveId(newNote.id)
      setSearch('')
      setUploadMessage({ type: 'success', text: `Apunte "${title}" creado correctamente` })
      window.setTimeout(() => setUploadMessage(null), 3000)
    } catch {
      setUploadMessage({ type: 'error', text: 'Error al leer el archivo.' })
      window.setTimeout(() => setUploadMessage(null), 3000)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
      e.target.value = ''
    }
  }

  const handleDownload = () => {
    if (!activeNote) return
    const blob = new Blob([activeNote.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.title}.txt`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const countStats = (text: string) => ({
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
  })

  return (
    <div className="notes-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 'calc(100vh - 140px)' }}>
        <aside
          className="notes-sidebar"
          role="complementary"
          aria-label="Lista de apuntes"
          style={{
            width: sidebarOpen ? '20rem' : '4.25rem',
            minWidth: sidebarOpen ? '20rem' : '4.25rem',
            transition: 'width 0.25s ease, min-width 0.25s ease',
            overflow: 'hidden',
            borderRight: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="icon-button"
                aria-label={sidebarOpen ? 'Colapsar lista de apuntes' : 'Expandir lista de apuntes'}
                title={sidebarOpen ? 'Colapsar lista' : 'Expandir lista'}
              >
                {sidebarOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
              </button>
              {sidebarOpen && (
                <>
                  <button
                    type="button"
                    onClick={handleCreate}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '0.5rem',
                      background: wineRgba(0.16),
                      color: 'var(--wine-pale)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      border: `1px solid ${wineRgba(0.3)}`,
                      cursor: 'pointer',
                    }}
                    aria-label="Nuevo apunte"
                  >
                    <Plus size={16} /> Nuevo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '0.5rem',
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontWeight: 550,
                      fontSize: '0.8rem',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                    aria-label="Subir archivo"
                    title="Subir .txt o .md"
                  >
                    <Upload size={15} /> Subir
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreBundled}
                    className="icon-button"
                    aria-label="Cargar apuntes base"
                    title="Cargar apuntes base incluidos"
                  >
                    <RotateCcw size={15} />
                  </button>
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".txt,.md,.pdf"
              style={{ display: 'none' }}
              aria-label="Seleccionar archivo para subir"
            />

            {sidebarOpen && uploadMessage && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: uploadMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(220, 130, 141, 0.15)',
                  border: `1px solid ${uploadMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(220, 130, 141, 0.3)'}`,
                  color: uploadMessage.type === 'success' ? 'var(--good)' : 'var(--bad)',
                }}
              >
                {uploadMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{uploadMessage.text}</span>
              </div>
            )}

            {sidebarOpen && (
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', width: 15, height: 15 }} />
                <input
                  type="search"
                  placeholder="Buscar apuntes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '0.5rem',
                    fontSize: '0.82rem',
                    color: 'var(--text)',
                  }}
                  aria-label="Buscar apuntes"
                />
              </div>
            )}
          </div>

          <ul style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', listStyle: 'none' }}>
            {filteredNotes.length === 0 ? (
              <li style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                {sidebarOpen ? (search ? 'Sin resultados' : 'No hay apuntes aún') : '—'}
              </li>
            ) : (
              filteredNotes.map((note) => {
                const stats = countStats(note.content)
                const isActive = note.id === activeId
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => selectNote(note.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: sidebarOpen ? '0.625rem 0.75rem' : '0.625rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: isActive ? `1px solid ${wineRgba(0.35)}` : '1px solid transparent',
                        background: isActive ? wineRgba(0.14) : 'transparent',
                        color: isActive ? 'var(--wine-pale)' : 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: sidebarOpen ? 'stretch' : 'center',
                        gap: '0.25rem',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                      aria-current={isActive ? 'true' : undefined}
                      title={note.title}
                    >
                      {sidebarOpen ? (
                        <>
                          <span style={{ fontWeight: 550, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {note.title || 'Sin título'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)' }}>
                            <span>{formatDate(note.updatedAt)}</span>
                            <span>{stats.words} pal</span>
                          </div>
                        </>
                      ) : (
                        <FileText size={16} />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeNote ? (
            <>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '0.5rem',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                  }}
                  placeholder="Título del apunte"
                  aria-label="Título del apunte"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      color: saveStatus === 'saved' ? 'var(--good)' : 'var(--warning)',
                    }}
                  >
                    {saveStatus === 'saved' ? <Save size={12} /> : <Clock size={12} />}
                    {saveStatus === 'saved' && 'Guardado'}
                    {saveStatus === 'saving' && 'Guardando...'}
                    {saveStatus === 'unsaved' && 'Sin guardar'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                      e.currentTarget.style.color = 'var(--text)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--muted)'
                    }}
                    aria-label="Descargar como .txt"
                    title="Descargar .txt"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = badRgba(0.1)
                      e.currentTarget.style.color = 'var(--bad)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--muted)'
                    }}
                    aria-label="Eliminar apunte"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 'calc(100vh - 260px)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    color: 'var(--text)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                  }}
                  placeholder="Escribe tu apunte aquí..."
                  spellCheck={false}
                  aria-label="Contenido del apunte"
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', padding: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <FileText size={56} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>Selecciona, crea o carga un apunte</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button type="button" className="button-primary" onClick={handleCreate}>
                    <Plus size={15} /> Crear apunte
                  </button>
                  <button type="button" className="button-secondary" onClick={handleRestoreBundled}>
                    <RotateCcw size={15} /> Cargar apuntes base
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar apunte"
        message={`¿Seguro que quieres eliminar "${activeNote?.title ?? 'este apunte'}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
