import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import Breadcrumbs from '../components/Breadcrumbs'
import GlobalNotificationBell from '../components/GlobalNotificationBell'

// ── File classification types (matches backend DbfTableRouter) ──────────
type FileClassification = 'required' | 'optional' | 'ignored'

interface FileMapping {
  fileName: string
  targetTable: string | null
  displayName: string
  classification: FileClassification
  ignoreReason?: string
  file?: File
  recordCount?: number
}

// SSE event types
interface SseEvent {
  type: string
  payload: Record<string, unknown>
}

type ImportPhase = 'idle' | 'analyzing' | 'ready' | 'uploading' | 'complete' | 'error'

// ── Known file table (client-side mirror for instant classification) ─────
const KNOWN_FILES: Record<string, { table: string; display: string; cls: FileClassification }> = {
  'ACCOUNTS.DBF':  { table: 'fs_accounts',  display: 'Chart of Accounts',          cls: 'required' },
  'CHECKMAS.DBF':  { table: 'fs_checkmas',  display: 'Check Master',               cls: 'required' },
  'CHECKVOU.DBF':  { table: 'fs_checkvou',  display: 'Check Vouchers',             cls: 'required' },
  'EFFECTS.DBF':   { table: 'fs_effects',   display: 'GL Effects',                 cls: 'required' },
  'SCHEDULE.DBF':  { table: 'fs_schedule',   display: 'GL Schedule',               cls: 'required' },
  'CASHRCPT.DBF':  { table: 'fs_cashrcpt',  display: 'Cash Receipts',              cls: 'optional' },
  'JOURNALS.DBF':  { table: 'fs_journals',  display: 'Journal Vouchers',            cls: 'optional' },
  'POURNALS.DBF':  { table: 'fs_pournals',  display: 'Posted Journals',            cls: 'optional' },
  'SALEBOOK.DBF':  { table: 'fs_salebook',  display: 'Sales Book',                 cls: 'optional' },
  'PURCBOOK.DBF':  { table: 'fs_purcbook',  display: 'Purchase Book',              cls: 'optional' },
  'ADJSTMNT.DBF':  { table: 'fs_adjstmnt',  display: 'Adjustments',                cls: 'optional' },
  'BANKS.DBF':     { table: 'fs_banks',     display: 'Banks',                       cls: 'optional' },
  'SUPPLIER.DBF':  { table: 'fs_supplier',  display: 'Suppliers',                   cls: 'optional' },
  'MASTFILE.DBF':  { table: 'pay_master',   display: 'Payroll Master',              cls: 'optional' },
  'ACHECKMA.DBF':  { table: 'fs_checkmas',  display: 'Check Master (Archive)',      cls: 'optional' },
  'ACHECKVO.DBF':  { table: 'fs_checkvou',  display: 'Check Vouchers (Archive)',    cls: 'optional' },
}

const IGNORED_FILES = new Set(['PATHFILE.DBF', 'ACCTNEW.DBF', 'ACCTS.DBF'])
const REQUIRED_FILES = Object.entries(KNOWN_FILES).filter(([, v]) => v.cls === 'required').map(([k]) => k)

const COMPANIES = [
  { code: 'cyberfridge', name: 'Cyberfridge Solutions' },
  { code: 'johntrix',    name: 'JohnTrix Corp' },
  { code: 'thermalex',   name: 'Thermalex Industries' },
  { code: 'gmixteam',    name: 'G-Mix Team' },
  { code: 'dynamiq',     name: 'DynamiQ Systems' },
  { code: 'metaleon',    name: 'MetaLeon' },
  { code: 'lmjay',       name: 'Lmjay General Services' },
  { code: '3jcrt',       name: '3JCRT General Services' },
  { code: 'gian',        name: 'Gian-Den General Services' },
  { code: 'jimi',        name: 'Jimi Tubing Specialist' },
]

function classifyFileLocally(fileName: string): FileMapping {
  const upper = fileName.toUpperCase()
  if (KNOWN_FILES[upper]) {
    return {
      fileName,
      targetTable: KNOWN_FILES[upper].table,
      displayName: KNOWN_FILES[upper].display,
      classification: KNOWN_FILES[upper].cls,
    }
  }
  if (IGNORED_FILES.has(upper) || upper.endsWith('.NTX') || upper.startsWith('OLD ') || !upper.endsWith('.DBF')) {
    return {
      fileName,
      targetTable: null,
      displayName: fileName,
      classification: 'ignored',
      ignoreReason: upper.endsWith('.NTX') ? 'Index file' : upper.startsWith('OLD ') ? 'Legacy backup' : !upper.endsWith('.DBF') ? 'Not a data file' : 'Not needed',
    }
  }
  return {
    fileName,
    targetTable: null,
    displayName: fileName,
    classification: 'ignored',
    ignoreReason: 'Unknown DBF file',
  }
}


export default function DataImport() {
  const navigate = useNavigate()
  const { state } = useLocation()
  useAuthStore() // auth guard handled by router
  const darkMode = useSettingsStore(s => s.darkMode)

  const [phase, setPhase] = useState<ImportPhase>('idle')
  const [selectedCompany, setSelectedCompany] = useState(state?.companyCode || '')
  const [files, setFiles] = useState<File[]>([])
  const [manifest, setManifest] = useState<FileMapping[]>([])
  const [missingRequired, setMissingRequired] = useState<string[]>([])
  const [progressEvents, setProgressEvents] = useState<SseEvent[]>([])
  const [currentAction, setCurrentAction] = useState('')
  const [processedCount, setProcessedCount] = useState(0)
  const [totalDataFiles, setTotalDataFiles] = useState(0)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const dropzoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [progressEvents])

  // ── File handling ───────────────────────────────────────────────────────
  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList)
    setFiles(arr)
    setPhase('analyzing')
    setErrorMessage('')

    // Client-side classification
    const classified = arr.map(f => {
      const mapping = classifyFileLocally(f.name)
      mapping.file = f
      return mapping
    })

    // Find missing required files
    const providedNames = new Set(arr.map(f => f.name.toUpperCase()))
    const missing = REQUIRED_FILES.filter(r => !providedNames.has(r))

    setManifest(classified)
    setMissingRequired(missing)
    setTotalDataFiles(classified.filter(f => f.classification !== 'ignored').length)
    setPhase('ready')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const items = e.dataTransfer.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.()
        if (entry?.isDirectory) {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader()
          const readDir = new Promise<File[]>((resolve) => {
            dirReader.readEntries((entries) => {
              const files: Promise<File>[] = []
              entries.forEach(e => {
                if (e.isFile) {
                  files.push(new Promise<File>((res) => {
                    ;(e as FileSystemFileEntry).file(f => res(f))
                  }))
                }
              })
              Promise.all(files).then(resolve)
            })
          })
          readDir.then(dirFiles => handleFiles(dirFiles))
          return
        }
      }
    }

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  // ── Upload & Import via SSE ─────────────────────────────────────────────
  const startImport = useCallback(async () => {
    if (!selectedCompany) {
      setErrorMessage('Please select a target company first.')
      return
    }

    const dataFiles = files.filter(f => {
      const upper = f.name.toUpperCase()
      return KNOWN_FILES[upper] !== undefined
    })

    if (dataFiles.length === 0) {
      setErrorMessage('No recognized data files to import.')
      return
    }

    setPhase('uploading')
    setProgressEvents([])
    setCurrentAction('Preparing upload...')
    setProcessedCount(0)
    setSummary(null)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('companyCode', selectedCompany)
    dataFiles.forEach(f => formData.append('files', f))

    try {
      const response = await fetch('/api/admin/import/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        setPhase('error')
        setErrorMessage(`Server error: ${response.status} ${response.statusText}`)
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setPhase('error')
        setErrorMessage('Unable to read response stream.')
        return
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as SseEvent
            setProgressEvents(prev => [...prev, event])

            switch (event.type) {
              case 'start':
                setCurrentAction(`Starting import for ${event.payload.company}...`)
                break
              case 'reading':
                setCurrentAction(`📖 Reading ${event.payload.fileName}...`)
                break
              case 'parsed':
                setCurrentAction(`✅ Parsed ${event.payload.fileName} — ${event.payload.recordCount} records`)
                break
              case 'seeding':
                setCurrentAction(`💾 Seeding ${event.payload.targetTable}...`)
                break
              case 'file_done':
                setProcessedCount(c => c + 1)
                setCurrentAction(`✓ ${event.payload.displayName} — ${event.payload.recordCount} records imported`)
                break
              case 'skip':
                setCurrentAction(`⏭️ Skipped ${event.payload.fileName}: ${event.payload.reason}`)
                break
              case 'file_error':
                setCurrentAction(`❌ Error: ${event.payload.fileName} — ${event.payload.error}`)
                break
              case 'complete':
                setSummary(event.payload)
                setPhase('complete')
                setCurrentAction(`🎉 Import complete!`)
                break
              case 'error':
                setPhase('error')
                setErrorMessage(String(event.payload.message))
                break
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      setPhase('error')
      setErrorMessage(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }, [files, selectedCompany])

  const reset = () => {
    setPhase('idle')
    setFiles([])
    setManifest([])
    setMissingRequired([])
    setProgressEvents([])
    setCurrentAction('')
    setProcessedCount(0)
    setTotalDataFiles(0)
    setSummary(null)
    setErrorMessage('')
  }

  // ── Counts ──────────────────────────────────────────────────────────────
  const requiredFiles = manifest.filter(f => f.classification === 'required')
  const optionalFiles = manifest.filter(f => f.classification === 'optional')
  const ignoredFiles  = manifest.filter(f => f.classification === 'ignored')
  const progressPercent = totalDataFiles > 0 ? Math.round((processedCount / totalDataFiles) * 100) : 0

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen relative transition-colors duration-700 font-body overflow-hidden ${darkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic Background Mesh */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] opacity-60 -z-10 animate-pulse transition-colors duration-1000 ${darkMode ? 'bg-indigo-900/40 mix-blend-screen' : 'bg-blue-400/20 mix-blend-multiply'}`} style={{ animationDuration: '8s' }}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-60 -z-10 animate-pulse transition-colors duration-1000 ${darkMode ? 'bg-purple-900/30 mix-blend-screen' : 'bg-purple-400/20 mix-blend-multiply'}`} style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      <div className={`absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-40 -z-10 animate-pulse transition-colors duration-1000 ${darkMode ? 'bg-emerald-900/20 mix-blend-screen' : 'bg-emerald-400/10 mix-blend-multiply'}`} style={{ animationDuration: '10s', animationDelay: '1s' }}></div>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-colors duration-500 ${darkMode ? 'bg-[#020617]/70 border-white/5' : 'bg-white/70 border-slate-200/50'}`}>
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col justify-center">
          <Breadcrumbs segments={[
            { label: 'Settings', path: '/admin-settings' },
            { label: 'Organization Data', path: '/admin-settings?tab=organization' },
            { label: 'Data Import' }
          ]} className="mb-4" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="font-headline font-extrabold text-2xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  Data Import Hub
                </h1>
                <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Legacy DBF Ingestion Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <GlobalNotificationBell />
              <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg ${darkMode ? 'bg-white/5 shadow-purple-500/10' : 'bg-white shadow-purple-500/20 text-purple-600'}`}>
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 space-y-8">
        
        {/* ── IDLE: Advanced Dropzone ──────────────────────────────────────── */}
        {phase === 'idle' && (
          <div className="animate-fade-in-up">
            <div className={`text-center mb-8`}>
              <h2 className={`font-headline text-4xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Transfer Legacy Data</h2>
              <p className={`text-lg font-medium mx-auto max-w-xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Drag and drop a complete company backup folder to instantly analyze, validate, and inject DBF archives into the SQL database.
              </p>
            </div>

            <div
              ref={dropzoneRef}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`
                relative w-full rounded-[32px] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden
                flex flex-col items-center justify-center p-20 text-center shadow-2xl backdrop-blur-xl group
                ${isDragOver 
                  ? (darkMode ? 'border-blue-400 bg-blue-500/20 scale-[1.02] shadow-blue-500/20' : 'border-blue-500 bg-blue-50 scale-[1.02] shadow-blue-500/30') 
                  : (darkMode ? 'border-slate-700/50 bg-[#0f172a]/60 hover:bg-[#1e293b]/60 hover:border-blue-500/50 hover:shadow-blue-500/10' : 'border-slate-300 bg-white/60 hover:bg-white hover:border-blue-400 hover:shadow-blue-500/15')
                }
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className={`relative w-28 h-28 rounded-3xl flex items-center justify-center mb-8 transition-transform duration-500 ${isDragOver ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-2'} ${darkMode ? 'bg-slate-800 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] text-blue-400' : 'bg-white shadow-[0_10px_40px_rgba(59,130,246,0.15)] text-blue-500'}`}>
                {isDragOver && <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>}
                <span className={`material-symbols-outlined text-[64px] relative z-10 ${isDragOver ? 'animate-bounce' : ''}`}>
                  {isDragOver ? 'file_download' : 'folder_open'}
                </span>
                {/* Micro animation dots */}
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-purple-500 animate-ping opacity-70"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-blue-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
              </div>
              
              <h3 className={`font-headline text-2xl font-bold mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {isDragOver ? 'Release to Initialize Upload' : 'Click or Drag Folder Here'}
              </h3>
              
              <div className={`flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${darkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Supports Complete .DBF Archives
              </div>

              <input
                id="file-input"
                type="file"
                multiple
                // @ts-ignore
                webkitdirectory=""
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>
        )}

        {/* ── READY: Analysis Dashboard ─────────────────────────────────────── */}
        {(phase === 'ready' || phase === 'uploading' || phase === 'complete') && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            
            <div className={`rounded-[24px] p-8 shadow-xl backdrop-blur-xl border transition-colors duration-500 ${darkMode ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <span className="material-symbols-outlined">business</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg">
                    Destination Tenant
                    {state?.companyCode && <span className={`ml-3 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>Auto-Locked</span>}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {state?.companyCode ? 'Target company has been locked by Organization Settings.' : 'Select the target company database to inject records into.'}
                  </p>
                </div>
              </div>
              
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                disabled={phase !== 'ready' || !!state?.companyCode}
                className={`
                  w-full px-5 py-4 rounded-xl font-bold outline-none transition-all cursor-pointer appearance-none border-2
                  ${darkMode 
                    ? 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}
                  ${(phase !== 'ready' || !!state?.companyCode) && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <option value="" disabled>— Select Company —</option>
                {COMPANIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </div>

            {/* Analysis Grid (Only show detailed files in Ready phase to save space later) */}
            {phase === 'ready' && (
              <div className={`rounded-[24px] shadow-xl backdrop-blur-xl border overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                <div className={`px-8 py-5 border-b flex justify-between items-center ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                  <h3 className="font-headline font-bold text-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500">fact_check</span>
                    Pre-Flight Analysis
                  </h3>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                    {manifest.length} Objects Scanned
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {missingRequired.length > 0 && (
                    <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 w-full animate-pulse">
                      <div className="flex items-center gap-2 font-bold mb-2">
                         <span className="material-symbols-outlined">warning</span> CRITICAL: Missing Required Tables
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {missingRequired.map(f => <span key={f} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-mono font-bold shadow-sm">{f}</span>)}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Required Column */}
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Required
                      </h4>
                      <div className="space-y-2">
                        {requiredFiles.map(f => (
                          <div key={f.fileName} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-100 hover:shadow-sm'}`}>
                             <div className="flex items-center gap-3">
                               <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                               <span className="font-mono text-sm font-bold">{f.fileName}</span>
                             </div>
                             <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>{f.targetTable}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optional/Ignored Column */}
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Optional Data
                      </h4>
                      <div className="space-y-2">
                        {optionalFiles.slice(0, 5).map(f => (
                          <div key={f.fileName} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                             <div className="flex items-center gap-3">
                               <span className={`material-symbols-outlined text-[18px] ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>add_circle</span>
                               <span className="font-mono text-sm font-bold opacity-80">{f.fileName}</span>
                             </div>
                          </div>
                        ))}
                        {optionalFiles.length > 5 && <div className="text-xs text-center opacity-50 py-2">+ {optionalFiles.length - 5} more files</div>}
                      </div>

                      {ignoredFiles.length > 0 && (
                        <div className="mt-6">
                           <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                             <span className="w-2 h-2 rounded-full bg-slate-500"></span> Ignored ({ignoredFiles.length})
                           </h4>
                           <div className={`p-4 rounded-xl text-xs font-mono space-y-1 ${darkMode ? 'bg-slate-900 border border-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                             {ignoredFiles.slice(0, 3).map(f => <div key={f.fileName}>[SKIP] {f.fileName}</div>)}
                             {ignoredFiles.length > 3 && <div>...and {ignoredFiles.length - 3} more.</div>}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── UPLOADING: Advanced Progress ─────────────────────────────────── */}
        {(phase === 'uploading' || phase === 'complete') && (
           <div className={`rounded-[24px] shadow-2xl backdrop-blur-xl border border-t-0 overflow-hidden transition-all duration-700 animate-fade-in-up ${darkMode ? 'bg-slate-900 border-slate-800 shadow-blue-900/10' : 'bg-[#0f172a] border-slate-900 shadow-2xl text-slate-100'}`}>
             
             {/* Server Rack Status Header */}
             <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${phase === 'complete' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${phase === 'complete' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  </div>
                  <span className="font-mono text-sm font-bold tracking-widest uppercase">Server Connection: Active</span>
                </div>
                <div className="font-mono text-xs opacity-50">PORT: 443 SSE | {processedCount}/{totalDataFiles}</div>
             </div>

             <div className="p-8">
               <h3 className={`font-headline text-2xl font-black tracking-tight mb-2 ${phase === 'complete' ? 'text-emerald-400' : 'text-blue-400'}`}>
                 {phase === 'complete' ? 'Telemetry Complete' : 'Executing Data Transfer Pipeline'}
               </h3>
               <p className="font-mono text-sm opacity-70 mb-8">{currentAction}</p>

               {/* Sleek Progress Bar */}
               <div className="relative w-full h-4 rounded-full bg-black/40 border border-white/10 overflow-hidden mb-8 shadow-inner">
                 <div
                   className={`h-full relative overflow-hidden transition-all duration-500 ease-out shadow-[0_0_20px_rgba(59,130,246,0.5)] ${phase === 'complete' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                   style={{ width: `${phase === 'complete' ? 100 : progressPercent}%` }}
                 >
                   {/* Animated shine across progress bar */}
                   <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                 </div>
               </div>

               {/* macOS Terminal Log Window */}
               <div className="rounded-xl bg-black border border-white/10 shadow-2xl overflow-hidden mt-6">
                 <div className="px-4 py-2 flex items-center gap-2 border-b border-white/10 bg-white/5">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                   <span className="ml-2 font-mono text-[10px] text-white/40 tracking-widest">AWM_DBF_ENGINE_v3.3</span>
                 </div>
                 <div
                   ref={logRef}
                   className="p-5 max-h-72 overflow-y-auto font-mono text-[13px] leading-relaxed space-y-1"
                   style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                 >
                   {progressEvents.map((evt, i) => {
                     let color = "text-slate-400"
                     let prefix = "[INFO]"
                     if(evt.type === 'start') { color = 'text-blue-400 font-bold'; prefix = '[INIT]' }
                     if(evt.type === 'parsed') { color = 'text-cyan-300' }
                     if(evt.type === 'seeding') { color = 'text-purple-400' }
                     if(evt.type === 'file_done') { color = 'text-emerald-400 font-bold'; prefix = '[DONE]' }
                     if(evt.type === 'skip') { color = 'text-slate-600'; prefix = '[SKIP]' }
                     if(evt.type === 'file_error') { color = 'text-red-400 font-bold bg-red-500/10 inline-block px-1'; prefix = '[ERR!]' }
                     if(evt.type === 'complete') { color = 'text-yellow-400 font-black'; prefix = '[SUCCESS]' }

                     return (
                       <div key={i} className={`${color}`}>
                         <span className="text-slate-600 mr-2">{prefix}</span>
                         {evt.type === 'start' && `Bootstrapping migration for tenant: ${String(evt.payload.company)}`}
                         {evt.type === 'reading' && `I/O stream reading: ${String(evt.payload.fileName)}...`}
                         {evt.type === 'parsed' && `Extracted ${String(evt.payload.recordCount)} objects from ${String(evt.payload.fileName)}`}
                         {evt.type === 'seeding' && `Entity Framework Bulk Insert -> [${String(evt.payload.targetTable)}]...`}
                         {evt.type === 'file_done' && `Commit successful: ${String(evt.payload.displayName)} -> ${String(evt.payload.recordCount)} rows verified`}
                         {evt.type === 'skip' && `${String(evt.payload.fileName)} bypass: ${String(evt.payload.reason)}`}
                         {evt.type === 'file_error' && `Exception threw on ${String(evt.payload.fileName)}: ${String(evt.payload.error)}`}
                         {evt.type === 'complete' && `Tear down complete. System Ready.`}
                       </div>
                     )
                   })}
                   {phase === 'uploading' && <div className="mt-2 text-blue-400 animate-pulse font-bold">root@awm-engine:~# _</div>}
                 </div>
               </div>

               {/* Report Summary Card */}
               {phase === 'complete' && summary && (
                 <div className="mt-6 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/40">
                      <span className="material-symbols-outlined text-[32px]">task_alt</span>
                    </div>
                    <div>
                      <h4 className="font-headline font-black text-xl mb-1 text-emerald-400">Migration Successful!</h4>
                      <p className="font-mono text-sm opacity-80 mb-3">Total payload synchronized: <strong className="text-white">{String(summary.totalRecordsImported)} rows</strong> over <strong className="text-white">{String(summary.totalFilesProcessed)} files</strong>.</p>
                      <div className="flex flex-wrap gap-2">
                        {!!summary.tables && Object.entries(summary.tables as Record<string, number>).map(([table, count]) => (
                          <div key={table} className="text-[10px] px-2.5 py-1 rounded bg-black/40 font-mono text-emerald-300 border border-emerald-500/20">
                            {table}: <span className="text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* ── ERROR DISPLAY ───────────────────────────────────────────────── */}
        {errorMessage && (
          <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500 shadow-xl shadow-red-500/10 animate-fade-in text-center">
             <div className="w-16 h-16 mx-auto rounded-full bg-red-500 shrink-0 text-white flex items-center justify-center mb-4 shadow-lg shadow-red-500/40">
               <span className="material-symbols-outlined text-3xl">dangerous</span>
             </div>
             <h4 className="font-headline font-black text-2xl text-red-500 mb-2">System Error Occurred</h4>
             <p className="font-mono text-sm text-red-400 max-w-lg mx-auto bg-black/20 p-4 rounded-xl">{errorMessage}</p>
          </div>
        )}

        {/* ── GLOBAL ACTION BUTTONS ───────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
          {phase === 'ready' && (
            <>
              <button
                onClick={reset}
                className={`px-8 py-4 rounded-xl font-bold transition-all shadow-sm ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                Cancel & Reset
              </button>
              <button
                onClick={startImport}
                disabled={missingRequired.length > 0 || !selectedCompany}
                className={`
                  flex items-center gap-3 px-10 py-4 rounded-xl font-black text-lg transition-all shadow-xl
                  ${missingRequired.length > 0 || !selectedCompany
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95'
                  }
                `}
              >
                {missingRequired.length > 0 ? 'Cannot Proceed (Missing Files)' : 'Execute Database Injection'}
                {!missingRequired.length && selectedCompany && <span className="material-symbols-outlined font-black">rocket_launch</span>}
              </button>
            </>
          )}

          {phase === 'complete' && (
            <>
               <button onClick={reset} className={`px-8 py-4 rounded-xl font-bold transition-all shadow-md ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}>
                 Import Another Workspace
               </button>
               <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-8 py-4 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">
                 <span className="material-symbols-outlined">dashboard</span> Enter Main Dashboard
               </button>
            </>
          )}

          {phase === 'error' && (
             <button onClick={reset} className="px-10 py-4 rounded-xl font-black text-white bg-red-500 shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all hover:-translate-y-1">
               Acknowledge & Start Over
             </button>
          )}
        </div>

      </main>

      {/* Global CSS for Tailwind Animations */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
