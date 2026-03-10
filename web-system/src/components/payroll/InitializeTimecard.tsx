import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface SysInfo {
  begDate: string
  endDate: string
  presMo: number
  presYr: number
  trnCtr: number
  trnPrc: number
  trnUpd: number
  payType: number
  workHours: number
  needBackup: boolean
  tcCount: number
  empCount: number
}

// Compute next period dates based on previous end_date (matching INITTIME.PRG logic)
function nextPeriodDates(endDate: string, payType: number): { begDate: string; endDate: string; nextPayType: number; nextMonth: number } {
  const end = new Date(endDate)
  const beg = new Date(end)
  beg.setDate(beg.getDate() + 1)
  const periodLen = end.getDate() - new Date(endDate.slice(0, 7) + '-01').getDate()
  const newEnd = new Date(beg)
  newEnd.setDate(newEnd.getDate() + periodLen)
  const nextPayType = payType === 1 ? 2 : 1
  const nextMonth = nextPayType === 1 ? (beg.getMonth() + 1) % 12 + 1 : beg.getMonth() + 1
  return {
    begDate: beg.toISOString().slice(0, 10),
    endDate: newEnd.toISOString().slice(0, 10),
    nextPayType,
    nextMonth
  }
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

  useEffect(() => {
    loadSysInfo()
  }, [])

  const loadSysInfo = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/system-id')
      if (res.ok) {
        const data: SysInfo = await res.json()
        setSysInfo(data)
        // Pre-fill form with suggested next period
        const next = nextPeriodDates(data.endDate, data.payType)
        setBegDate(next.begDate)
        setEndDate(next.endDate)
        setPayType(next.nextPayType)
        setPresMo(next.nextMonth)
        setWorkHours(data.workHours || 80)
      } else {
        setLoadError('Could not load system information.')
      }
    } catch {
      setLoadError('Cannot reach backend server.')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    setConfirmOpen(false)
    setSaving(true)
    setError('')
    setResult('')
    try {
      const res = await fetch('/api/payroll/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ BegDate: begDate, EndDate: endDate, PayType: payType, PresMo: presMo, WorkHours: workHours })
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data.message)
        loadSysInfo()
      } else {
        setError(data.error || data.message || 'Initialization failed.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const monthName = (m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] ?? ''
  const halfLabel = (pt: number) => pt === 1 ? '1st Half' : '2nd Half'
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  // ─── Prerequisites check ────────────────────────────────────────
  const warnings: string[] = []
  if (sysInfo) {
    if (sysInfo.needBackup)
      warnings.push('A backup is required before initializing. Please run Backup Databases first.')
    if (sysInfo.tcCount > 0 && sysInfo.trnCtr !== sysInfo.trnPrc)
      warnings.push(`Initialization denied — ${sysInfo.trnCtr - sysInfo.trnPrc} employee(s) have not been computed yet.`)
    if (sysInfo.tcCount > 0 && sysInfo.trnPrc !== sysInfo.trnUpd)
      warnings.push('Initialization denied — timecard has not yet been posted. Run Post Transactions first.')
  }
  const canInitialize = warnings.length === 0 && !saving

  return (
    <div className="card">
      <h2>Initialize Timecard</h2>
      <p className="subtitle">Prepares the timecard file for a new payroll period. Clears existing timecard data and resets period counters.</p>

      {loading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>}
      {loadError && <div style={{ padding: '16px', color: '#dc3545' }}>{loadError}</div>}

      {!loading && sysInfo && (
        <>
          {/* Current Period Info */}
          <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
            <strong>Current Period:</strong>&nbsp;
            {fmt(sysInfo.begDate)} &#8212; {fmt(sysInfo.endDate)}
            &nbsp;&bull;&nbsp;{halfLabel(sysInfo.payType)}
            &nbsp;&bull;&nbsp;Month {sysInfo.presMo}/{sysInfo.presYr}
            &nbsp;&bull;&nbsp;{sysInfo.tcCount} timecard record(s)
            &nbsp;&bull;&nbsp;Computed: {sysInfo.trnPrc}/{sysInfo.trnCtr}
            &nbsp;&bull;&nbsp;Posted: {sysInfo.trnUpd}
          </div>

          {/* Warnings */}
          {warnings.map((w, i) => (
            <div key={i} style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '6px', padding: '12px 16px', marginBottom: '10px', color: '#dc3545', fontSize: '13px' }}>
              &#9888;&nbsp;{w}
            </div>
          ))}

          {result && (
            <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', color: 'var(--success)' }}>
              &#10003;&nbsp;{result}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', color: '#dc3545' }}>
              &#9888;&nbsp;{error}
            </div>
          )}

          {/* New Period Form */}
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ marginBottom: '18px' }}>New Payroll Period</h4>

            <div className="form-group">
              <label className="form-label">Beginning Date</label>
              <input type="date" className="form-input" value={begDate} onChange={e => setBegDate(e.target.value)} disabled={!canInitialize} />
            </div>

            <div className="form-group">
              <label className="form-label">Ending Date</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!canInitialize} />
            </div>

            <div className="form-group">
              <label className="form-label">1st / 2nd Half</label>
              <select className="form-input" value={payType} onChange={e => setPayType(Number(e.target.value))} disabled={!canInitialize}>
                <option value={1}>1st Half (resets monthly counters)</option>
                <option value={2}>2nd Half</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payroll Month</label>
              <select className="form-input" value={presMo} onChange={e => setPresMo(Number(e.target.value))} disabled={!canInitialize}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')} — {monthName(m)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Standard Work Hours (per period)</label>
              <input type="number" className="form-input" min={1} max={200} value={workHours} onChange={e => setWorkHours(Number(e.target.value))} disabled={!canInitialize} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setConfirmOpen(true)}
                disabled={!canInitialize || !begDate || !endDate}
              >
                Initialize Timecard File
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm Dialog ─────────────────────────────── */}
      {confirmOpen && (
        <ModalPortal onClick={() => setConfirmOpen(false)}>
          <div className="modal" style={{ maxWidth: '460px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Initialization</h3>
              <button className="modal-close" onClick={() => setConfirmOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '12px' }}><strong>This will permanently clear all timecard records and reset all payroll counters for the current period.</strong></p>
              <p style={{ marginBottom: '4px', fontSize: '14px' }}>New period: <strong>{fmt(begDate)} &#8212; {fmt(endDate)}</strong></p>
              <p style={{ marginBottom: '4px', fontSize: '14px' }}>Half: <strong>{halfLabel(payType)}</strong></p>
              <p style={{ marginBottom: '20px', fontSize: '14px' }}>Month: <strong>{monthName(presMo)}</strong> &bull; Work Hours: <strong>{workHours}</strong></p>
              {payType === 1 && (
                <div style={{ background: 'rgba(255,193,7,0.15)', border: '1px solid #ffc107', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#856404' }}>
                  &#9888; This is a 1st-half initialization. Make sure you have printed all monthly reports first.
                </div>
              )}
              <p style={{ color: '#dc3545', fontSize: '13px', marginBottom: '20px' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleInitialize} disabled={saving}>
                  {saving ? 'Initializing...' : 'Begin Initialization'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
