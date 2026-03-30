import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface SysInfo {
  begDate: string; endDate: string; presMo: number; presYr: number
  trnCtr: number; trnPrc: number; trnUpd: number; payType: number
  workHours: number; needBackup: boolean; tcCount: number; empCount: number
}

function nextPeriodDates(endDate: string, payType: number): { begDate: string; endDate: string; nextPayType: number; nextMonth: number } {
  const end = new Date(endDate)
  const beg = new Date(end); beg.setDate(beg.getDate() + 1)
  const periodLen = end.getDate() - new Date(endDate.slice(0, 7) + '-01').getDate()
  const newEnd = new Date(beg); newEnd.setDate(newEnd.getDate() + periodLen)
  const nextPayType = payType === 1 ? 2 : 1
  const nextMonth = nextPayType === 1 ? (beg.getMonth() + 1) % 12 + 1 : beg.getMonth() + 1
  return { begDate: beg.toISOString().slice(0, 10), endDate: newEnd.toISOString().slice(0, 10), nextPayType, nextMonth }
}

const monthName = (m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] ?? ''
const halfLabel = (pt: number) => pt === 1 ? '1st Half' : '2nd Half'
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function InitializeTimecard() {
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [begDate, setBegDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [payType, setPayType] = useState(1)
  const [presMo, setPresMo] = useState(1)
  const [workHours, setWorkHours] = useState(80)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => { loadSysInfo() }, [])

  const loadSysInfo = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/system-id')
      if (res.ok) {
        const data: SysInfo = await res.json()
        setSysInfo(data)
        const next = nextPeriodDates(data.endDate, data.payType)
        setBegDate(next.begDate); setEndDate(next.endDate); setPayType(next.nextPayType); setPresMo(next.nextMonth)
        setWorkHours(data.workHours || 80)
      } else setLoadError('Could not load system information.')
    } catch { setLoadError('Cannot reach backend server.') }
    finally { setLoading(false) }
  }

  const handleInitialize = async () => {
    setConfirmOpen(false); setSaving(true); setError(''); setResult('')
    try {
      const res = await fetch('/api/payroll/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ BegDate: begDate, EndDate: endDate, PayType: payType, PresMo: presMo, WorkHours: workHours }) })
      const data = await res.json()
      if (res.ok) { setResult(data.message); loadSysInfo() }
      else setError(data.error || data.message || 'Initialization failed.')
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  const warnings: string[] = []
  if (sysInfo) {
    if (sysInfo.needBackup) warnings.push('A backup is required before initializing. Please run Backup Databases first.')
    if (sysInfo.tcCount > 0 && sysInfo.trnCtr !== sysInfo.trnPrc) warnings.push(`Initialization denied — ${sysInfo.trnCtr - sysInfo.trnPrc} employee(s) have not been computed yet.`)
    if (sysInfo.tcCount > 0 && sysInfo.trnPrc !== sysInfo.trnUpd) warnings.push('Initialization denied — timecard has not yet been posted. Run Post Transactions first.')
  }
  const canInitialize = warnings.length === 0 && !saving

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <PageHeader
        breadcrumb="PAYROLL PROCESSING / INITIALIZE TIMECARD"
        title="Initialize Timecard"
        subtitle="Prepares the timecard file for a new payroll period. Clears existing timecard data and resets period counters."
      />

      {loading && <div className="flex items-center gap-2 py-6 text-on-surface-variant/60 text-sm animate-pulse"><span className="material-symbols-outlined animate-spin text-[18px]">sync</span>Loading…</div>}
      {loadError && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"><span className="material-symbols-outlined text-[18px]">error</span>{loadError}</div>}

      {!loading && sysInfo && (
        <>
          {/* Current period summary */}
          <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm px-6 py-5">
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-3">Current Period</div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div><span className="text-on-surface-variant">Period:</span> <strong>{fmtDate(sysInfo.begDate)} — {fmtDate(sysInfo.endDate)}</strong></div>
              <div><span className="text-on-surface-variant">Half:</span> <strong>{halfLabel(sysInfo.payType)}</strong></div>
              <div><span className="text-on-surface-variant">Month:</span> <strong>{monthName(sysInfo.presMo)} {sysInfo.presYr}</strong></div>
              <div><span className="text-on-surface-variant">Timecards:</span> <strong>{sysInfo.tcCount}</strong></div>
              <div><span className="text-on-surface-variant">Computed:</span> <strong>{sysInfo.trnPrc}/{sysInfo.trnCtr}</strong></div>
              <div><span className="text-on-surface-variant">Posted:</span> <strong>{sysInfo.trnUpd}</strong></div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-4 bg-error/5 border border-error/20 rounded-2xl text-error text-sm">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
              {w}
            </div>
          ))}

          {/* Result / Error */}
          {result && <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm"><span className="material-symbols-outlined text-[18px]">check_circle</span>{result}</div>}
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"><span className="material-symbols-outlined text-[18px]">error</span>{error}</div>}

          {/* New period form */}
          <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm p-6">
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-5">New Payroll Period</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <Field label="Beginning Date">
                <input type="date" value={begDate} onChange={e => setBegDate(e.target.value)} disabled={!canInitialize}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
              </Field>
              <Field label="Ending Date">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!canInitialize}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
              </Field>
              <Field label="1st / 2nd Half">
                <select value={payType} onChange={e => setPayType(Number(e.target.value))} disabled={!canInitialize}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
                  <option value={1}>1st Half (resets monthly counters)</option>
                  <option value={2}>2nd Half</option>
                </select>
              </Field>
              <Field label="Payroll Month">
                <select value={presMo} onChange={e => setPresMo(Number(e.target.value))} disabled={!canInitialize}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{String(m).padStart(2, '0')} — {monthName(m)}</option>)}
                </select>
              </Field>
              <Field label="Standard Work Hours (per period)">
                <input type="number" min={1} max={200} value={workHours} onChange={e => setWorkHours(Number(e.target.value))} disabled={!canInitialize}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm text-right font-mono bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
              </Field>
            </div>
            <button onClick={() => setConfirmOpen(true)} disabled={!canInitialize || !begDate || !endDate}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Initialize Timecard File
            </button>
          </div>
        </>
      )}

      {/* Confirm Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface text-center mb-2">Confirm Initialization</h3>
            <p className="text-sm text-on-surface-variant text-center mb-4">This will permanently clear all timecard records and reset all payroll counters for the current period.</p>
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <div><span className="text-on-surface-variant">New period:</span> <strong>{fmtDate(begDate)} — {fmtDate(endDate)}</strong></div>
              <div><span className="text-on-surface-variant">Half:</span> <strong>{halfLabel(payType)}</strong></div>
              <div><span className="text-on-surface-variant">Month:</span> <strong>{monthName(presMo)}</strong></div>
              <div><span className="text-on-surface-variant">Work Hours:</span> <strong>{workHours}</strong></div>
            </div>
            {payType === 1 && (
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs mb-4">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">warning</span>
                This is a 1st-half initialization. Make sure you have printed all monthly reports first.
              </div>
            )}
            <p className="text-xs text-error text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleInitialize} disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'Initializing…' : 'Begin Initialization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
