import { useState, useEffect, useRef } from 'react'
import { 
  FileText, Plus, Download, Trash2, Search, Save, Clock, 
  ChevronLeft, ChevronRight 
} from 'lucide-react'
import { 
  readNotes, createNote, updateNote, deleteNote, initializeNotes, type Note 
} from '../lib/notes'

const wineRgba = (alpha: number) => `rgba(113, 52, 72, ${alpha})`
const badRgba = (alpha: number) => `rgba(220, 130, 141, ${alpha})`

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const saveTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    initializeNotes()
    const loaded = readNotes()
    setNotes(loaded)
    if (loaded.length > 0) setActiveId(loaded[0].id)
  }, [])

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )

  const activeNote = notes.find(n => n.id === activeId)

  const handleCreate = () => {
    const newNote = createNote({ title: 'Nuevo apunte', content: '' })
    setNotes(readNotes())
    setActiveId(newNote.id)
    setSearch('')
  }

  const handleTitleChange = (title: string) => {
    if (!activeId) return
    updateNote(activeId, { title })
    setNotes(readNotes())
  }

  const handleContentChange = (content: string) => {
    if (!activeId) return
    setSaveStatus('unsaved')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      updateNote(activeId, { content })
      setNotes(readNotes())
      setSaveStatus('saving')
      setTimeout(() => setSaveStatus('saved'), 500)
    }, 300)
  }

  const handleDelete = () => {
    if (!activeId || !confirm('¿Eliminar este apunte?')) return
    deleteNote(activeId)
    const remaining = readNotes()
    setNotes(remaining)
    setActiveId(remaining[0]?.id ?? null)
  }

  const handleDownload = () => {
    if (!activeNote) return
    const blob = new Blob([activeNote.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const countStats = (text: string) => ({
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0
  })

  const sidebarStyle: React.CSSProperties = {
    width: sidebarOpen ? '20rem' : '4rem',
    minWidth: sidebarOpen ? '20rem' : '4rem',
    transition: 'width 0.3s ease, min-width 0.3s ease',
    overflow: 'hidden',
    borderRight: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }} className="notes-page">
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0.75rem 1rem', 
        borderBottom: '1px solid var(--border)', 
        background: 'var(--surface)' 
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text)' }}>Mis apuntes</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            style={{ 
              display: sidebarOpen ? 'none' : 'flex', 
              padding: '0.5rem', 
              borderRadius: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Cerrar lista' : 'Abrir lista'}
            className="md:flex"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside style={sidebarStyle} className="notes-sidebar" role="complementary" aria-label="Lista de apuntes">
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={handleCreate}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '0.5rem', 
                background: wineRgba(0.1), 
                color: 'var(--wine)', 
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = wineRgba(0.2)}
              onMouseLeave={e => e.currentTarget.style.background = wineRgba(0.1)}
              aria-label="Nuevo apunte"
            >
              <Plus size={18} style={{ flexShrink: 0 }} /> <span style={{ display: sidebarOpen ? 'inline' : 'none' }}>Nuevo apunte</span>
            </button>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', width: 16, height: 16, flexShrink: 0 }} />
              <input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem', 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border-strong)', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem', 
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--wine-soft)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--wine-soft)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none' }}
                aria-label="Buscar apuntes"
              />
            </div>
          </div>

          <ul style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', listStyle: 'none' }}>
            {filteredNotes.length === 0 ? (
              <li style={{ padding: '2rem 0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
                {search ? 'Sin resultados' : 'No hay apuntes aún'}
              </li>
            ) : (
              filteredNotes.map(note => {
                const stats = countStats(note.content)
                const isActive = note.id === activeId
                return (
                  <li key={note.id}>
                    <button
                      onClick={() => setActiveId(note.id)}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left', 
                        padding: '0.625rem 0.75rem', 
                        borderRadius: '0.5rem', 
                        border: isActive ? '1px solid' + wineRgba(0.3) : '1px solid transparent',
                        background: isActive ? wineRgba(0.1) : 'transparent',
                        color: isActive ? 'var(--wine)' : 'var(--text)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                      aria-current={isActive ? 'true' : 'false'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</span>
                        {!sidebarOpen && <FileText size={16} style={{ flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }}>
                        <span>{formatDate(note.updatedAt)}</span>
                        <span>{stats.chars} car · {stats.words} pal</span>
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeNote ? (
            <>
              <div style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid var(--border)', 
                background: 'var(--surface)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                flexWrap: 'wrap' 
              }}>
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  style={{ 
                    flex: 1, 
                    minWidth: 0, 
                    padding: '0.5rem 0.75rem', 
                    background: 'var(--bg)', 
                    border: '1px solid var(--border-strong)', 
                    borderRadius: '0.5rem', 
                    color: 'var(--text)', 
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--wine-soft)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--wine-soft)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none' }}
                  placeholder="Título del apunte"
                  aria-label="Título del apunte"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem', 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px',
                    color: saveStatus === 'saved' ? 'var(--good)' : saveStatus === 'saving' ? 'var(--warning)' : 'var(--warning)',
                  }}>
                    {saveStatus === 'saved' && <Save size={12} />}
                    {saveStatus === 'saving' && <Clock size={12} />}
                    {saveStatus === 'unsaved' && <Clock size={12} />}
                    {saveStatus === 'saved' && 'Guardado'}
                    {saveStatus === 'saving' && 'Guardando...'}
                    {saveStatus === 'unsaved' && 'Sin guardar'}
                  </span>
                  <button 
                    onClick={handleDownload}
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '0.5rem', 
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
                    aria-label="Descargar como .txt"
                    title="Descargar .txt"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={handleDelete}
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '0.5rem', 
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = badRgba(0.1); e.currentTarget.style.color = 'var(--bad)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
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
                  onChange={e => handleContentChange(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    minHeight: 'calc(100vh - 200px)',
                    background: 'var(--bg)', 
                    border: '1px solid var(--border-strong)', 
                    borderRadius: '0.5rem', 
                    padding: '1rem', 
                    color: 'var(--text)', 
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', 
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--wine-soft)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--wine-soft)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none' }}
                  placeholder="Escribe tu apunte aquí... (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+Z funcionan de forma natural)"
                  spellCheck={false}
                  aria-label="Contenido del apunte"
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.125rem' }}>Selecciona o crea un apunte</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
