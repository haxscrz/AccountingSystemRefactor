/**
 * InitializeNewYear.tsx — Initialize For a New Year
 * Mirrors INITTIME with .t. parameter: resets all yearly accumulators in pay_master.
 */
import { useState } from 'react'
import ModalPortal from '../ModalPortal'

export default function InitializeNewYear() {
  const [confirm, setConfirm] = useState(false)
  const [done, setDone]       = useState(false)
  const [msg, setMsg]         = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)

  const run = async () => {
    setBusy(true); setMsg(null)
    try {
      const res  = await fetch('/api/payroll/initialize-new-year', { method: 'POST' })
      const json = await res.json()
      if (res.ok) { setConfirm(false); setDone(true) }
      else        setMsg(json.error || json.message || 'Initialization failed.')
    } catch { setMsg('Network error.') }
    finally { setBusy(false) }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Initialize For a New Year</h2>
      <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-secondary)' }}>
        INITTIME — Reset yearly accumulators on all employee records
      </p>

      {done ? (
        <div style={{ padding: '16px 20px', borderRadius: 6,
          background: 'rgba(46,160,67,0.15)', border: '1px solid var(--success)', color: 'var(--success)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            Initialization Complete
          </div>
          <p style={{ margin: 0, fontSize: 13 }}>
            All yearly accumulators (YGross, YTax, SSS, PhilHealth, Pag-IBIG, EC, etc.) have been
            reset to zero. The system is ready for the new payroll year.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 14 }}
            onClick={() => setDone(false)}>Back</button>
        </div>
      ) : (
        <>
          <div style={{ padding: '14px 16px', borderRadius: 6, marginBottom: 20,
            background: 'rgba(255,186,0,0.08)', border: '1px solid rgba(255,186,0,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#d4a00a' }}>
              What this operation does
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)',
              display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Resets <b style={{ color: 'var(--text)' }}>YGross, YTax</b> to 0 for all employees</li>
              <li>Resets <b style={{ color: 'var(--text)' }}>SSS, PhilHealth, Pag-IBIG, EC</b> yearly totals to 0</li>
              <li>Resets <b style={{ color: 'var(--text)' }}>YHol, YOt, YLeave, YNetPay, YBonus, YBtax</b> to 0</li>
              <li>Clears <b style={{ color: 'var(--text)' }}>Other Pay Year totals (YOthp1–4)</b></li>
              <li>Affects <b style={{ color: 'var(--text)' }}>ALL employees</b> in the database</li>
            </ul>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 20,
            background: 'rgba(220,53,53,0.08)', border: '1px solid rgba(220,53,53,0.3)',
            fontSize: 13, color: 'var(--danger)' }}>
            <b>Warning:</b> This operation cannot be undone. Make sure you have a backup before proceeding.
          </div>

          <button className="btn btn-primary" style={{ minWidth: 200 }}
            onClick={() => setConfirm(true)}>
            Initialize for a New Year
          </button>
        </>
      )}

      {confirm && (
        <ModalPortal onClick={() => setConfirm(false)}>
          <div style={{ width: 380, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Are you sure?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              This will reset all yearly accumulators for <b style={{ color: 'var(--text)' }}>every employee</b> in the system.
            </p>
            <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 20 }}>
              This action cannot be undone. Ensure you have taken a backup first.
            </p>
            {msg && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{msg}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn" onClick={run} disabled={busy}
                style={{ flex: 1, background: 'rgba(220,53,53,0.2)', color: 'var(--danger)',
                  border: '1px solid var(--danger)' }}>
                {busy ? 'Initializing…' : 'Yes, Initialize'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
