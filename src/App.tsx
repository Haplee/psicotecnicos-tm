import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import {
  Activity, ArrowDownToLine, ArrowLeft, BookOpen, Brain, Calculator, Check,
  CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Clock3, Cog, Download, FileJson,
  FileText, History, Info, LayoutDashboard, ListChecks, Menu, Moon, MoreHorizontal,
  Play, Printer, RotateCcw, ScanEye, Settings, Shapes, ShieldCheck, Sun, Target, Timer,
  Trophy, Upload, X, XCircle, Zap, Box as BoxIcon,
} from 'lucide-react'
import { aptitudes, getQuestionsForAptitude, memoryBrief, questionBank, type AptitudeId, type Question } from './data/questions'
import { QuestionCard } from './components/QuestionCard'
import { createBackup, parseBackup, readHistory, readPreferences, writeHistory, writePreferences, type ExamResult, type Preferences } from './lib/storage'

type Page = 'dashboard' | 'training' | 'simulacros' | 'history' | 'mistakes' | 'settings' | 'results' | 'exam'
type Mode = 'practice' | 'block' | 'full' | 'review'
type Session = {
  id: string
  mode: Mode
  title: string
  aptitudeId?: AptitudeId
  questions: Question[]
  answers: Record<string, number | null>
  phase: 'memory' | 'exam'
  memoryRemaining: number
  memoryDeadline: number | null
  remaining: number
  deadline: number | null
  durationSeconds: number
  examStartedAt: string | null
}

const iconMap = {
  book: BookOpen,
  calculator: Calculator,
  box: BoxIcon,
  cog: Cog,
  scan: ScanEye,
  brain: Brain,
  shapes: Shapes,
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'training', label: 'Entrenamiento', icon: BookOpen },
  { id: 'simulacros', label: 'Simulacros', icon: ClipboardList },
  { id: 'mistakes', label: 'Repasar errores', icon: RotateCcw },
  { id: 'history', label: 'Historial', icon: History },
]

const formatTime = (seconds: number) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`
const formatDate = (value: string) => new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const percent = (correct: number, total: number) => total ? Math.round(correct / total * 100) : 0

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [history, setHistory] = useState<ExamResult[]>(() => readHistory())
  const [preferences, setPreferences] = useState<Preferences>(() => readPreferences())
  const [session, setSession] = useState<Session | null>(null)
  const [viewingResult, setViewingResult] = useState<ExamResult | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedAptitude, setSelectedAptitude] = useState<AptitudeId>('verbal')
  const [importMessage, setImportMessage] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const sessionRef = useRef<Session | null>(session)
  const finishRef = useRef<(() => void) | null>(null)
  sessionRef.current = session

  useEffect(() => writeHistory(history), [history])
  useEffect(() => writePreferences(preferences), [preferences])
  useEffect(() => { document.documentElement.dataset.theme = preferences.theme }, [preferences.theme])

  const finishExam = useCallback(() => {
    const active = sessionRef.current
    if (!active || active.phase !== 'exam') return
    const correct = active.questions.filter((q) => active.answers[q.id] === q.answer).length
    const answered = active.questions.filter((q) => active.answers[q.id] !== null && active.answers[q.id] !== undefined).length
    const incorrect = answered - correct
    const unanswered = active.questions.length - answered
    const elapsed = active.examStartedAt ? Math.max(0, Math.round((Date.now() - new Date(active.examStartedAt).getTime()) / 1000)) : 0
    const result: ExamResult = {
      id: active.id,
      mode: active.mode,
      title: active.title,
      startedAt: active.examStartedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: Math.min(elapsed, active.durationSeconds || elapsed),
      score: correct,
      correct,
      incorrect,
      unanswered,
      total: active.questions.length,
      answers: active.answers,
      questions: active.questions,
    }
    setHistory((previous) => [result, ...previous].slice(0, 50))
    setViewingResult(result)
    setSession(null)
    setPage('results')
  }, [])
  finishRef.current = finishExam

  useEffect(() => {
    if (!session) return
    const interval = window.setInterval(() => {
      const active = sessionRef.current
      if (!active) return
      if (active.phase === 'memory') {
        const remaining = Math.max(0, Math.ceil(((active.memoryDeadline ?? Date.now()) - Date.now()) / 1000))
        if (remaining <= 0) {
          const startedAt = new Date().toISOString()
          setSession((previous) => previous ? { ...previous, phase: 'exam', memoryRemaining: 0, memoryDeadline: null, remaining: previous.durationSeconds, deadline: previous.durationSeconds ? Date.now() + previous.durationSeconds * 1000 : null, examStartedAt: startedAt } : null)
        } else {
          setSession((previous) => previous ? { ...previous, memoryRemaining: remaining } : null)
        }
      } else if (active.durationSeconds > 0) {
        const remaining = Math.max(0, Math.ceil(((active.deadline ?? Date.now()) - Date.now()) / 1000))
        if (remaining <= 0) {
          setSession((previous) => previous ? { ...previous, remaining: 0 } : null)
          window.setTimeout(() => finishRef.current?.(), 0)
        } else {
          setSession((previous) => previous ? { ...previous, remaining } : null)
        }
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [session?.id, session?.phase])

  const startSession = (mode: Mode, aptitudeId?: AptitudeId, chosenQuestions?: Question[]) => {
    const questions = chosenQuestions ?? (aptitudeId ? getQuestionsForAptitude(aptitudeId) : questionBank)
    const title = mode === 'full' ? 'Simulacro completo' : mode === 'review' ? 'Repaso de errores' : `${aptitudes.find((a) => a.id === aptitudeId)?.title ?? 'Entrenamiento'}`
    const hasMemory = questions.some((q) => q.aptitudeId === 'memoria')
    const durationSeconds = mode === 'practice' || mode === 'review' ? 0 : (mode === 'full' ? preferences.blockMinutes * 60 * 7 : preferences.blockMinutes * 60)
    const newSession: Session = {
      id: crypto.randomUUID(), mode, title, aptitudeId, questions,
      answers: Object.fromEntries(questions.map((q) => [q.id, null])),
      phase: hasMemory ? 'memory' : 'exam',
      memoryRemaining: hasMemory ? preferences.memorySeconds : 0,
      memoryDeadline: hasMemory ? Date.now() + preferences.memorySeconds * 1000 : null,
      remaining: durationSeconds,
      deadline: hasMemory || !durationSeconds ? null : Date.now() + durationSeconds * 1000,
      durationSeconds,
      examStartedAt: hasMemory ? null : new Date().toISOString(),
    }
    setSession(newSession)
    setPage('exam')
    setSidebarOpen(false)
  }

  const answerQuestion = (questionId: string, answer: number) => {
    setSession((previous) => previous ? { ...previous, answers: { ...previous.answers, [questionId]: answer } } : null)
  }

  const closeExam = () => {
    if (window.confirm('¿Quieres abandonar el examen? Las respuestas de este intento no se guardarán.')) {
      setSession(null)
      setPage('dashboard')
    }
  }

  const openResult = (result: ExamResult) => {
    setViewingResult(result)
    setPage('results')
  }

  const failedQuestions = useMemo(() => {
    const seen = new Set<string>()
    const failed: Question[] = []
    history.forEach((result) => result.questions.forEach((question) => {
      const selected = result.answers[question.id]
      if (selected !== null && selected !== question.answer && !seen.has(question.id)) {
        seen.add(question.id)
        failed.push(question)
      }
    }))
    return failed
  }, [history])

  const go = (next: Page) => {
    if (session && !window.confirm('Hay un examen en curso. ¿Quieres salir y perder este intento?')) return
    setSession(null)
    setPage(next)
    setSidebarOpen(false)
  }

  const exportBackup = () => {
    const backup = createBackup(history, preferences)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `psicotecnicos-tm-copia-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setImportMessage('Copia de seguridad descargada.')
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    try {
      const parsed = parseBackup(JSON.parse(await file.text()))
      if (!window.confirm(`La copia contiene ${parsed.history.length} resultados. ¿Quieres sustituir tu historial y preferencias actuales?`)) return
      setHistory(parsed.history)
      setPreferences(parsed.preferences)
      setImportMessage('Copia restaurada correctamente.')
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'No se pudo leer el archivo.')
    }
  }

  useEffect(() => {
    const handler = () => setPage('training')
    window.addEventListener('navigate-training', handler)
    return () => window.removeEventListener('navigate-training', handler)
  }, [])

  const average = history.length ? Math.round(history.reduce((sum, result) => sum + percent(result.correct, result.total), 0) / history.length) : 0
  const totalCorrect = history.reduce((sum, result) => sum + result.correct, 0)
  const activeTitle = session?.title ?? (page === 'dashboard' ? 'Inicio' : page === 'training' ? 'Entrenamiento' : page === 'simulacros' ? 'Simulacros' : page === 'history' ? 'Historial' : page === 'mistakes' ? 'Repasar errores' : page === 'settings' ? 'Configuración' : 'Resultados')

  return (
    <div className="app-shell">
      {page !== 'exam' && <>
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="brand-lockup">
            <div className="brand-mark">TM</div>
            <div className="brand-copy"><strong>PSICOTÉCNICOS</strong><span>TROPA Y MARINERÍA</span></div>
            <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
          </div>
          <div className="sidebar-label">PLATAFORMA</div>
          <nav className="side-nav" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon
              return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => go(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === 'mistakes' && failedQuestions.length > 0 && <small>{failedQuestions.length}</small>}</button>
            })}
          </nav>
          <div className="sidebar-spacer" />
          <div className="sidebar-note"><ShieldCheck size={16} /><span>Tus datos permanecen en este dispositivo.</span></div>
          <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}><Settings size={18} /><span>Configuración</span></button>
          <div className="sidebar-footer"><span className="status-dot" /> VERSIÓN 1.0 · ENTRENAMIENTO</div>
        </aside>
        {sidebarOpen && <button className="mobile-scrim" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
      </>}

      <main className={`main-area ${page === 'exam' ? 'exam-area' : ''}`}>
        {page !== 'exam' && <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
            <div><span className="eyebrow">PSICOTÉCNICOS TM</span><h1>{activeTitle}</h1></div>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setPreferences((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} aria-label="Cambiar tema">{preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="profile-chip"><div className="profile-avatar">TM</div><div><strong>Preparación local</strong><span>Sin cuenta</span></div></div>
          </div>
        </header>}

        {page === 'dashboard' && <Dashboard history={history} average={average} totalCorrect={totalCorrect} failedCount={failedQuestions.length} onStart={() => go('training')} onFull={() => go('simulacros')} onSelect={(id) => { setSelectedAptitude(id); go('training') }} onHistory={() => go('history')} />}
        {page === 'training' && <Training selected={selectedAptitude} setSelected={setSelectedAptitude} onStart={startSession} blockMinutes={preferences.blockMinutes} />}
        {page === 'simulacros' && <MockExams onStart={startSession} blockMinutes={preferences.blockMinutes} />}
        {page === 'history' && <HistoryPage history={history} onOpen={openResult} onClear={() => { if (window.confirm('¿Eliminar todo el historial guardado en este dispositivo?')) setHistory([]) }} />}
        {page === 'mistakes' && <MistakesPage questions={failedQuestions} onStart={() => startSession('review', undefined, failedQuestions)} onTraining={(id) => startSession('review', undefined, failedQuestions.filter((question) => question.aptitudeId === id))} />}
        {page === 'settings' && <SettingsPage preferences={preferences} setPreferences={setPreferences} historyCount={history.length} onExport={exportBackup} onImport={importBackup} importMessage={importMessage} confirmReset={confirmReset} setConfirmReset={setConfirmReset} onReset={() => { setHistory([]); setPreferences({ theme: 'dark', blockMinutes: 7, memorySeconds: 45 }); setConfirmReset(false); setImportMessage('Datos locales reiniciados.') }} />}
        {page === 'results' && viewingResult && <ResultsPage result={viewingResult} onBack={() => go('history')} onPrint={() => window.print()} onRetry={() => startSession(viewingResult.mode === 'full' ? 'full' : viewingResult.mode === 'block' ? 'block' : viewingResult.mode === 'review' ? 'review' : 'practice', viewingResult.questions.length === 15 ? viewingResult.questions[0]?.aptitudeId : undefined, viewingResult.mode === 'review' ? viewingResult.questions : undefined)} />}
        {page === 'results' && !viewingResult && <EmptyState title="Todavía no hay resultados" description="Completa un entrenamiento o simulacro para ver aquí tu corrección." action="Ir a entrenamiento" onAction={() => go('training')} />}
        <footer className="app-footer"><span>PSICOTÉCNICOS TM</span><span>Herramienta de entrenamiento independiente · No oficial</span></footer>
      </main>

      {page === 'exam' && session && <ExamScreen session={session} onAnswer={answerQuestion} onSubmit={finishExam} onExit={closeExam} onStartMemory={() => setSession((previous) => previous ? { ...previous, phase: 'exam', memoryRemaining: 0, memoryDeadline: null, remaining: previous.durationSeconds, deadline: previous.durationSeconds ? Date.now() + previous.durationSeconds * 1000 : null, examStartedAt: new Date().toISOString() } : null)} />}
    </div>
  )
}

function Dashboard({ history, average, totalCorrect, failedCount, onStart, onFull, onSelect, onHistory }: { history: ExamResult[]; average: number; totalCorrect: number; failedCount: number; onStart: () => void; onFull: () => void; onSelect: (id: AptitudeId) => void; onHistory: () => void }) {
  const last = history[0]
  const aptitudeStats = aptitudes.map((aptitude) => {
    const relevant = history.filter((result) => result.questions.some((q) => q.aptitudeId === aptitude.id))
    const questions = relevant.flatMap((result) => result.questions.filter((q) => q.aptitudeId === aptitude.id).map((q) => ({ q, selected: result.answers[q.id] })))
    const correct = questions.filter(({ q, selected }) => selected === q.answer).length
    return { ...aptitude, attempts: relevant.length, progress: percent(correct, questions.length), count: questions.length }
  })
  return <div className="page-content dashboard-page">
    <section className="welcome-panel">
      <div className="welcome-copy"><span className="panel-kicker"><span className="tiny-dot" /> PREPARACIÓN PERSONAL</span><h2>Entrena con método.<br /><em>Avanza con confianza.</em></h2><p>Practica las siete aptitudes, mide tu rendimiento y convierte cada error en aprendizaje.</p><div className="welcome-actions"><button className="button-primary" onClick={onStart}><Play size={16} fill="currentColor" /> Empezar a entrenar</button><button className="button-secondary" onClick={onFull}>Simulacro completo <ArrowDownToLine size={15} /></button></div></div>
      <div className="welcome-visual"><div className="orbital orbital-one" /><div className="orbital orbital-two" /><div className="visual-center"><span>TM</span><small>TRAINING</small></div><div className="orbit-tag tag-top">7 APTITUDES</div><div className="orbit-tag tag-bottom">FOCUS · DISCIPLINE</div></div>
    </section>
    <section className="metric-grid">
      <Metric icon={<ClipboardList size={18} />} label="Tests realizados" value={String(history.length)} note="Intentos guardados" />
      <Metric icon={<Activity size={18} />} label="Media de aciertos" value={`${average}%`} note="En todos tus intentos" />
      <Metric icon={<CheckCircle2 size={18} />} label="Respuestas correctas" value={String(totalCorrect)} note="Aciertos acumulados" />
      <Metric icon={<RotateCcw size={18} />} label="Para repasar" value={String(failedCount)} note="Preguntas falladas distintas" />
    </section>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">ÁREAS DE PREPARACIÓN</span><h2>Tus siete aptitudes</h2><p>Elige un bloque para entrenar o realizar un simulacro cronometrado.</p></div><button className="text-button" onClick={onStart}>Ver entrenamiento <ArrowDownToLine size={14} /></button></div>
      <div className="aptitude-grid">{aptitudeStats.map((aptitude) => <AptitudeCard key={aptitude.id} aptitude={aptitude} onClick={() => onSelect(aptitude.id)} />)}</div>
    </section>
    <section className="bottom-grid">
      <div className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">ACTIVIDAD</span><h3>Último intento</h3></div><button className="text-button" onClick={onHistory}>Ver historial <ArrowDownToLine size={14} /></button></div>{last ? <div className="recent-result"><div className="recent-score"><strong>{last.correct}/{last.total}</strong><span>aciertos</span></div><div className="recent-details"><strong>{last.title}</strong><span>{formatDate(last.completedAt)}</span><div className="mini-track"><span style={{ width: `${percent(last.correct, last.total)}%` }} /></div><small>{percent(last.correct, last.total)} % de aciertos · {formatTime(last.durationSeconds)}</small></div></div> : <div className="empty-inline"><div className="empty-icon"><Target size={20} /></div><div><strong>Tu actividad aparecerá aquí</strong><span>Realiza tu primer entrenamiento para empezar a registrar resultados.</span></div></div>}</div>
      <div className="panel objective-panel"><div className="panel-heading"><div><span className="eyebrow">SIGUIENTE PASO</span><h3>Entrenamiento inteligente</h3></div><Zap size={19} className="wine-icon" /></div><p>La plataforma detecta las preguntas que has fallado y te permite volver a trabajarlas.</p><button className="button-secondary full-width" disabled={failedCount === 0} onClick={() => onSelect('verbal')}>Explorar mis aptitudes <ArrowDownToLine size={14} /></button><span className="panel-footnote">{failedCount ? `${failedCount} preguntas distintas disponibles para repaso.` : 'Cuando completes intentos, podrás crear tu repaso de errores.'}</span></div>
    </section>
  </div>
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <div className="metric-card"><div className="metric-top"><span className="metric-icon">{icon}</span><MoreHorizontal size={17} className="muted-icon" /></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span></div>
}

function AptitudeCard({ aptitude, onClick }: { aptitude: typeof aptitudes[number] & { progress: number; attempts: number; count: number }; onClick: () => void }) {
  const Icon = iconMap[aptitude.icon as keyof typeof iconMap] ?? Shapes
  return <button className="aptitude-card" onClick={onClick}><div className="aptitude-card-top"><span className="aptitude-icon"><Icon size={19} /></span><span className="aptitude-number">{aptitude.number}</span></div><strong>{aptitude.title}</strong><p>{aptitude.description}</p><div className="aptitude-card-bottom"><div className="aptitude-track"><span style={{ width: `${aptitude.progress}%` }} /></div><span>{aptitude.count ? `${aptitude.progress}%` : 'Sin datos'}</span></div><span className="card-arrow"><ArrowDownToLine size={15} /></span></button>
}

function Training({ selected, setSelected, onStart, blockMinutes }: { selected: AptitudeId; setSelected: (id: AptitudeId) => void; onStart: (mode: Mode, aptitudeId?: AptitudeId) => void; blockMinutes: number }) {
  const current = aptitudes.find((a) => a.id === selected) ?? aptitudes[0]
  const Icon = iconMap[current.icon as keyof typeof iconMap] ?? Shapes
  const count = getQuestionsForAptitude(selected).length
  return <div className="page-content"><div className="page-intro"><span className="eyebrow">ENTRENAMIENTO POR BLOQUES</span><h2>Trabaja cada aptitud por separado</h2><p>Selecciona una de las siete áreas y elige cómo quieres practicar. Todas las preguntas se muestran en una sola pantalla.</p></div>
    <div className="training-layout"><div className="training-list">{aptitudes.map((aptitude) => { const AptIcon = iconMap[aptitude.icon as keyof typeof iconMap] ?? Shapes; return <button key={aptitude.id} className={`training-item ${selected === aptitude.id ? 'active' : ''}`} onClick={() => setSelected(aptitude.id)}><span className="aptitude-icon"><AptIcon size={18} /></span><span className="training-item-copy"><strong>{aptitude.title}</strong><small>{getQuestionsForAptitude(aptitude.id).length} preguntas · 3 niveles</small></span><ChevronDown size={16} className="training-chevron" /></button> })}</div>
      <div className="training-detail panel"><div className="detail-icon"><Icon size={27} /></div><span className="eyebrow">BLOQUE {current.number}</span><h3>{current.title}</h3><p>{current.description}</p><div className="detail-stats"><div><strong>{count}</strong><span>Preguntas</span></div><div><strong>3</strong><span>Niveles</span></div><div><strong>4</strong><span>Opciones</span></div></div><div className="mode-choice"><div className="mode-choice-title">Elige modalidad</div><button className="mode-option" onClick={() => onStart('practice', selected)}><span className="mode-icon"><BookOpen size={18} /></span><span><strong>Entrenamiento libre</strong><small>Sin límite de tiempo · Corrección al entregar</small></span><ArrowDownToLine size={16} /></button><button className="mode-option" onClick={() => onStart('block', selected)}><span className="mode-icon"><Timer size={18} /></span><span><strong>Simulacro cronometrado</strong><small>{blockMinutes} minutos · 15 preguntas</small></span><ArrowDownToLine size={16} /></button></div></div></div>
    <div className="notice-card"><Info size={17} /><p><strong>Sobre el material:</strong> las preguntas iniciales son ejercicios originales de entrenamiento. No son preguntas oficiales publicadas por el Ministerio de Defensa.</p></div>
  </div>
}

function MockExams({ onStart, blockMinutes }: { onStart: (mode: Mode, aptitudeId?: AptitudeId) => void; blockMinutes: number }) {
  const [selected, setSelected] = useState<AptitudeId>('verbal')
  return <div className="page-content"><div className="page-intro"><span className="eyebrow">EVALUACIÓN</span><h2>Simula las condiciones de examen</h2><p>Elige un simulacro individual o completa los siete bloques en una única sesión.</p></div><div className="mock-grid"><div className="mock-card featured"><div className="mock-card-top"><span className="mock-badge">RECOMENDADO</span><span className="mock-symbol"><Trophy size={20} /></span></div><span className="eyebrow">SIMULACRO GLOBAL</span><h3>Examen completo</h3><p>Recorre las siete aptitudes y evalúa tu preparación de forma global.</p><div className="mock-facts"><span><ListChecks size={15} /> 105 preguntas</span><span><Clock3 size={15} /> {blockMinutes * 7} minutos</span><span><Target size={15} /> 7 bloques</span></div><button className="button-primary full-width" onClick={() => onStart('full')}>Comenzar examen <Play size={15} fill="currentColor" /></button></div><div className="mock-card"><span className="mock-symbol"><Timer size={20} /></span><span className="eyebrow">SIMULACRO POR APTITUD</span><h3>Examen específico</h3><p>Selecciona una aptitud y responde 15 preguntas con tiempo limitado.</p><label className="mock-select-label" htmlFor="mock-aptitude">Aptitud</label><select id="mock-aptitude" className="mock-select" value={selected} onChange={(e) => setSelected(e.target.value as AptitudeId)}>{aptitudes.map((aptitude) => <option key={aptitude.id} value={aptitude.id}>{aptitude.title}</option>)}</select><div className="mock-facts"><span><ListChecks size={15} /> 15 preguntas</span><span><Clock3 size={15} /> {blockMinutes} minutos</span><span><Target size={15} /> 1 bloque</span></div><button className="button-secondary full-width" onClick={() => onStart('block', selected)}>Comenzar bloque <Play size={14} fill="currentColor" /></button></div></div><div className="notice-card"><ShieldCheck size={17} /><p>Los tiempos son configurables y sirven como referencia de entrenamiento. La estructura de esta aplicación no representa una reproducción oficial de la plataforma de evaluación del Ministerio.</p></div></div>
}

function ExamScreen({ session, onAnswer, onSubmit, onExit, onStartMemory }: { session: Session; onAnswer: (id: string, answer: number) => void; onSubmit: () => void; onExit: () => void; onStartMemory: () => void }) {
  const answered = Object.values(session.answers).filter((answer) => answer !== null).length
  const progress = percent(answered, session.questions.length)
  const hasTimer = session.durationSeconds > 0
  const grouped = session.mode === 'full' || session.mode === 'review'
  if (session.phase === 'memory') return <div className="memory-screen"><header className="exam-topbar"><div className="brand-lockup compact"><div className="brand-mark">TM</div><div className="brand-copy"><strong>PSICOTÉCNICOS</strong><span>FASE DE MEMORIZACIÓN</span></div></div><button className="button-quiet" onClick={onExit}><X size={16} /> Salir</button></header><div className="memory-content"><div className="memory-icon"><Brain size={28} /></div><span className="eyebrow">APTITUD DE MEMORIA</span><h1>Memoriza la información</h1><p className="memory-instruction">Lee con atención el siguiente informe. Cuando comience el examen, el texto desaparecerá y tendrás que responder sin consultarlo.</p><div className="memory-time"><Clock3 size={17} /><span>Tiempo de memorización</span><strong>{formatTime(session.memoryRemaining)}</strong></div><div className="memory-brief"><div className="brief-header"><FileText size={16} /><strong>INFORME DE SERVICIO</strong><span>UNIDAD 14</span></div><pre>{memoryBrief}</pre></div><button className="button-primary memory-start" onClick={onStartMemory}>He memorizado · Comenzar preguntas <ArrowDownToLine size={16} /></button><span className="memory-footnote">Al agotarse el tiempo, el examen comenzará automáticamente.</span></div></div>
  return <div className="exam-screen"><header className="exam-topbar"><div className="exam-top-left"><button className="icon-button" onClick={onExit} aria-label="Salir del examen"><ArrowLeft size={18} /></button><div className="brand-lockup compact"><div className="brand-mark">TM</div><div className="brand-copy"><strong>{session.title}</strong><span>{session.mode === 'full' ? 'SIMULACRO COMPLETO' : session.mode === 'block' ? 'BLOQUE CRONOMETRADO' : session.mode === 'review' ? 'REPASO PERSONALIZADO' : 'ENTRENAMIENTO LIBRE'}</span></div></div></div><div className="exam-top-right"><div className="exam-progress-top"><span>{answered}/{session.questions.length} respondidas</span><div className="top-progress-track"><span style={{ width: `${progress}%` }} /></div></div>{hasTimer && <div className={`timer-chip ${session.remaining <= 60 ? 'timer-warning' : ''}`}><Clock3 size={16} /><strong>{formatTime(session.remaining)}</strong></div>}<button className="button-quiet exit-text" onClick={onExit}>Abandonar</button></div></header>
    <div className="exam-content"><div className="exam-intro"><div><span className="eyebrow">{session.mode === 'full' ? 'EVALUACIÓN GLOBAL' : 'PRUEBA DE APTITUD'}</span><h1>{session.title}</h1><p>{session.mode === 'full' ? 'Responde las preguntas de los siete bloques. Puedes desplazarte libremente antes de entregar.' : 'Todas las preguntas están disponibles en esta pantalla. Puedes modificar tus respuestas hasta entregar.'}</p></div><div className="exam-summary-box"><strong>{answered} <span>/ {session.questions.length}</span></strong><small>Respondidas</small></div></div>
      <div className="question-jump"><span>IR A PREGUNTA</span><div className="jump-list">{session.questions.map((q, index) => <a key={q.id} href={`#question-${q.id}`} className={session.answers[q.id] !== null ? 'done' : ''} title={`Pregunta ${index + 1}`}>{index + 1}</a>)}</div></div>
      {grouped ? aptitudes.map((aptitude) => { const groupQuestions = session.questions.filter((q) => q.aptitudeId === aptitude.id); if (!groupQuestions.length) return null; return <section key={aptitude.id} className="exam-group"><div className="exam-group-heading"><span>{aptitude.number}</span><div><h2>{aptitude.title}</h2><small>{groupQuestions.length} preguntas</small></div></div><div className="questions-list">{groupQuestions.map((q) => <QuestionCard key={q.id} question={q} index={session.questions.findIndex((entry) => entry.id === q.id) + 1} value={session.answers[q.id] ?? null} onChange={(value) => onAnswer(q.id, value)} />)}</div></section> }) : <div className="questions-list">{session.questions.map((q, index) => <QuestionCard key={q.id} question={q} index={index + 1} value={session.answers[q.id] ?? null} onChange={(value) => onAnswer(q.id, value)} />)}</div>}
      <div className="submit-panel"><div><strong>¿Has terminado?</strong><span>{session.questions.length - answered} preguntas pendientes · Puedes volver a revisarlas antes de entregar.</span></div><button className="button-primary" onClick={() => { if (window.confirm(`Vas a entregar el examen con ${answered} de ${session.questions.length} respuestas. ¿Continuar?`)) onSubmit() }}>Entregar y corregir <Check size={16} /></button></div>
      <div className="exam-disclaimer">Entrenamiento independiente · La corrección se mostrará al entregar el examen.</div>
    </div></div>
}

function ResultsPage({ result, onBack, onPrint, onRetry }: { result: ExamResult; onBack: () => void; onPrint: () => void; onRetry: () => void }) {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'blank'>('all')
  const questions = result.questions.filter((q) => filter === 'all' || (filter === 'wrong' && result.answers[q.id] !== null && result.answers[q.id] !== q.answer) || (filter === 'blank' && result.answers[q.id] === null))
  return <div className="page-content results-page"><div className="result-hero"><div className="result-hero-copy"><span className="eyebrow">RESULTADO DEL EXAMEN</span><h2>{result.title}</h2><p>{formatDate(result.completedAt)} · {formatTime(result.durationSeconds)} de duración</p></div><div className="score-ring" style={{ '--score': `${percent(result.correct, result.total)}%` } as CSSProperties}><div><strong>{result.correct}/{result.total}</strong><span>aciertos</span></div></div></div>
    <div className="metric-grid result-metrics"><Metric icon={<CheckCircle2 size={18} />} label="Correctas" value={String(result.correct)} note="Respuestas acertadas" /><Metric icon={<XCircle size={18} />} label="Incorrectas" value={String(result.incorrect)} note="No restan puntuación" /><Metric icon={<CircleHelp size={18} />} label="Sin responder" value={String(result.unanswered)} note="Preguntas en blanco" /><Metric icon={<Target size={18} />} label="Aciertos" value={`${percent(result.correct, result.total)}%`} note={`Nota directa: ${result.score}/${result.total}`} /></div>
    <div className="result-toolbar"><div><h3>Revisión de respuestas</h3><p>Consulta la solución y aprende de cada ejercicio.</p></div><div className="result-actions"><button className="button-secondary" onClick={onPrint}><Printer size={15} /> Imprimir</button><button className="button-primary" onClick={onRetry}><RotateCcw size={15} /> Repetir</button></div></div>
    <div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas ({result.total})</button><button className={filter === 'wrong' ? 'active' : ''} onClick={() => setFilter('wrong')}>Incorrectas ({result.incorrect})</button><button className={filter === 'blank' ? 'active' : ''} onClick={() => setFilter('blank')}>Sin responder ({result.unanswered})</button></div>
    <div className="questions-list result-questions">{questions.map((q) => <QuestionCard key={q.id} question={q} index={result.questions.findIndex((entry) => entry.id === q.id) + 1} value={result.answers[q.id] ?? null} onChange={() => undefined} showResult />)}</div>
    <div className="result-bottom-actions"><button className="button-secondary" onClick={onBack}><ArrowLeft size={15} /> Volver al historial</button><button className="button-primary" onClick={onPrint}><Printer size={15} /> Imprimir resultados</button></div>
  </div>
}

function HistoryPage({ history, onOpen, onClear }: { history: ExamResult[]; onOpen: (r: ExamResult) => void; onClear: () => void }) {
  return <div className="page-content"><div className="page-intro intro-with-action"><div><span className="eyebrow">SEGUIMIENTO PERSONAL</span><h2>Tu historial de entrenamiento</h2><p>Consulta intentos anteriores y revisa las correcciones guardadas en este dispositivo.</p></div>{history.length > 0 && <button className="button-quiet danger-quiet" onClick={onClear}><X size={15} /> Borrar historial</button>}</div>{history.length ? <div className="history-list">{history.map((result) => <button key={result.id} className="history-row" onClick={() => onOpen(result)}><div className="history-icon"><ClipboardList size={19} /></div><div className="history-copy"><strong>{result.title}</strong><span>{formatDate(result.completedAt)} · {result.mode === 'full' ? 'Completo' : result.mode === 'block' ? 'Cronometrado' : result.mode === 'review' ? 'Repaso' : 'Entrenamiento libre'}</span></div><div className="history-score"><strong>{result.correct}/{result.total}</strong><span>{percent(result.correct, result.total)}% aciertos</span></div><div className="history-time"><Clock3 size={14} /> {formatTime(result.durationSeconds)}</div><ArrowDownToLine className="history-arrow" size={16} /></button>)}</div> : <EmptyState title="Aún no hay intentos guardados" description="Cuando completes tu primer entrenamiento, podrás consultar aquí los resultados y las explicaciones." action="Empezar a entrenar" onAction={() => window.dispatchEvent(new CustomEvent('navigate-training'))} />}</div>
}

function MistakesPage({ questions, onStart, onTraining }: { questions: Question[]; onStart: () => void; onTraining: (id: AptitudeId) => void }) {
  const byAptitude = aptitudes.map((a) => ({ ...a, count: questions.filter((q) => q.aptitudeId === a.id).length })).filter((a) => a.count > 0)
  return <div className="page-content"><div className="page-intro"><span className="eyebrow">APRENDIZAJE DIRIGIDO</span><h2>Repasa lo que necesitas reforzar</h2><p>Esta sección recoge preguntas que has fallado en intentos anteriores. Cada pregunta aparece una sola vez.</p></div>{questions.length ? <><div className="mistake-hero"><div className="mistake-hero-icon"><RotateCcw size={23} /></div><div><strong>{questions.length} preguntas para repasar</strong><span>Distribuidas en {byAptitude.length} aptitudes.</span></div><button className="button-primary" onClick={onStart}>Iniciar repaso <Play size={14} fill="currentColor" /></button></div><div className="mistake-grid">{byAptitude.map((a) => { const Icon = iconMap[a.icon as keyof typeof iconMap] ?? Shapes; return <button key={a.id} className="mistake-card" onClick={() => onTraining(a.id)}><span className="aptitude-icon"><Icon size={18} /></span><strong>{a.title}</strong><span>{a.count} preguntas falladas</span><ArrowDownToLine size={15} /></button> })}</div></> : <EmptyState title="Todavía no tienes errores guardados" description="Cuando termines un examen y falles alguna pregunta, aparecerá aquí para que puedas practicarla de nuevo." action="Ir a entrenamiento" onAction={() => window.dispatchEvent(new CustomEvent('navigate-training'))} />}</div>
}

function SettingsPage({ preferences, setPreferences, historyCount, onExport, onImport, importMessage, confirmReset, setConfirmReset, onReset }: { preferences: Preferences; setPreferences: (fn: (p: Preferences) => Preferences) => void; historyCount: number; onExport: () => void; onImport: (file?: File) => void; importMessage: string; confirmReset: boolean; setConfirmReset: (v: boolean) => void; onReset: () => void }) {
  return <div className="page-content"><div className="page-intro"><span className="eyebrow">PREFERENCIAS</span><h2>Configuración de la plataforma</h2><p>Personaliza los tiempos y administra los datos guardados localmente.</p></div><div className="settings-grid"><section className="panel settings-section"><div className="settings-section-heading"><div className="settings-icon"><Timer size={19} /></div><div><h3>Duración de los exámenes</h3><p>Tiempo aplicado a cada bloque cronometrado.</p></div></div><label className="setting-row"><span><strong>Minutos por bloque</strong><small>El examen completo multiplica este valor por siete.</small></span><select value={preferences.blockMinutes} onChange={(e) => setPreferences((p) => ({ ...p, blockMinutes: Number(e.target.value) }))}><option value={5}>5 minutos</option><option value={6}>6 minutos</option><option value={7}>7 minutos</option><option value={8}>8 minutos</option><option value={10}>10 minutos</option><option value={12}>12 minutos</option></select></label><label className="setting-row"><span><strong>Memorización inicial</strong><small>Tiempo para leer el informe antes de responder.</small></span><select value={preferences.memorySeconds} onChange={(e) => setPreferences((p) => ({ ...p, memorySeconds: Number(e.target.value) }))}><option value={30}>30 segundos</option><option value={45}>45 segundos</option><option value={60}>60 segundos</option><option value={90}>90 segundos</option></select></label></section>
    <section className="panel settings-section"><div className="settings-section-heading"><div className="settings-icon"><Sun size={19} /></div><div><h3>Aspecto</h3><p>La apariencia se guarda en este navegador.</p></div></div><div className="theme-options"><button className={`theme-choice ${preferences.theme === 'dark' ? 'selected' : ''}`} onClick={() => setPreferences((p) => ({ ...p, theme: 'dark' }))}><Moon size={18} /><strong>Oscuro</strong><small>Predeterminado</small></button><button className={`theme-choice ${preferences.theme === 'light' ? 'selected' : ''}`} onClick={() => setPreferences((p) => ({ ...p, theme: 'light' }))}><Sun size={18} /><strong>Claro</strong><small>Alternativo</small></button></div></section>
    <section className="panel settings-section"><div className="settings-section-heading"><div className="settings-icon"><FileJson size={19} /></div><div><h3>Copia de seguridad</h3><p>Exporta tus resultados y preferencias para restaurarlos en otro navegador.</p></div></div><div className="backup-actions"><button className="button-secondary" onClick={onExport}><Download size={16} /> Exportar copia</button><label className="button-secondary upload-button"><Upload size={16} /> Importar copia<input type="file" accept="application/json,.json" onChange={(e) => onImport(e.target.files?.[0])} /></label></div>{importMessage && <div className="inline-feedback"><Info size={15} /> {importMessage}</div>}<div className="setting-footnote">Resultados guardados: {historyCount}. La copia incluye el historial y tus preferencias, no modifica el banco base de preguntas.</div></section>
    <section className="panel settings-section danger-section"><div className="settings-section-heading"><div className="settings-icon danger-icon"><XCircle size={19} /></div><div><h3>Restablecer datos</h3><p>Elimina todos los resultados y devuelve la configuración a sus valores iniciales.</p></div></div>{confirmReset ? <div className="confirm-reset"><strong>¿Seguro que quieres borrar tus datos locales?</strong><div><button className="button-danger" onClick={onReset}>Sí, restablecer</button><button className="button-quiet" onClick={() => setConfirmReset(false)}>Cancelar</button></div></div> : <button className="button-danger-outline" onClick={() => setConfirmReset(true)}>Restablecer aplicación</button>}</section>
    </div><div className="notice-card"><ShieldCheck size={17} /><p><strong>Privacidad:</strong> esta versión no crea cuentas, no envía resultados a servidores y almacena los datos en el navegador del dispositivo donde entrenas.</p></div></div>
}

function EmptyState({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><div className="empty-state-icon"><Target size={25} /></div><h3>{title}</h3><p>{description}</p><button className="button-primary" onClick={onAction}>{action} <ArrowDownToLine size={15} /></button></div>
}

export default App
