import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface SysIdInfo {
  TrnCtr: number
  TrnPrc: number
  TrnUpd: number
  BegDate: string
  EndDate: string
  PAYMonth: number
  PAYYear: number
  PayType: number
  EmpCount: number
  TcCount: number
}

interface PostResult {
  message: string
  posted: number
}

export default function PostTransactions() {
  const [sysId, setSysId] = useState<SysIdInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [result, setResult] = useState<PostResult | null>(null)
  const [error, setError] = useState('')

  // confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false)
  const [has3rdPayroll, setHas3rdPayroll] = useState(false)
  const [confirmMonth, setConfirmMonth] = useState('')
  const [confirmYear, setConfirmYear] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payroll/system-id')
      const data = await res.json()
      if (res.ok) {
        setSysId(data)
        setConfirmMonth(String(data.PAYMonth).padStart(2, '0'))
        setConfirmYear(String(data.PAYYear))
      } else {
        setError('Could not load payroll period information.')
      }
    } catch {
      setError('Network error — could not reach server.')
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    setPosting(true)
    setError('')
    setResult(null)
    setShowConfirm(false)

    try {
      const params = new URLSearchParams({
        has3rdPayroll: String(has3rdPayroll),
        month: confirmMonth,
        year: confirmYear
      })
      const res = await fetch(`/api/payroll/post-timecard?${params}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        load()
      } else {
        setError(data.error || data.message || 'Post failed.')
      }
    } catch {
      setError('Network error — could not reach server.')
    } finally {
      setPosting(false)
    }
  }

  const getValidationError = (): string | null => {
    if (!sysId) return null
    if (sysId.TcCount === 0) return 'No timecard records to post. Please add employees first.'
    if (sysId.TrnCtr !== sysId.TrnPrc)
      return `Timecard not yet computed (TrnCtr=${sysId.TrnCtr} ≠ TrnPrc=${sysId.TrnPrc}). Please run Compute Payroll first.`
    if (sysId.TrnPrc === sysId.TrnUpd)
      return `Transactions already posted (TrnPrc=${sysId.TrnPrc} = TrnUpd=${sysId.TrnUpd}). This period has already been posted to the master file.`
    return null
  }

  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const payTypeLabel = sysId?.PayType === 1 ? '1st Half' : sysId?.PayType === 2 ? '2nd Half' : 'Monthly'
  const validationError = getValidationError()

  if (loading) {
    return <div className="card"><p>Loading period information...</p></div>
  }

  return (
    <div className="card">
      <h2>Post Transactions</h2>
      <p className="subtitle">
        Posts the computed timecard records to the master pay file. Equivalent to POSTTIME.PRG. Once posted, this period's pay data is finalized in the history records.
      </p>

      {/* Current Period Info */}
      {sysId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Period', value: `${sysId.BegDate} – ${sysId.EndDate}` },
            { label: 'Pay Type', value: payTypeLabel },
            { label: 'Month/Year', value: `${MONTHS[sysId.PAYMonth]} ${sysId.PAYYear}` },
            { label: 'TrnCtr', value: sysId.TrnCtr },
            { label: 'TrnPrc', value: sysId.TrnPrc },
            { label: 'TrnUpd', value: sysId.TrnUpd },
            { label: 'Timecards', value: sysId.TcCount },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--panel-2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Notice */}
      {validationError ? (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#dc3545' }}>
          <strong>&#9888; Cannot Post:</strong> {validationError}
        </div>
      ) : (
        <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '8px', padding: '14px', marginBottom: '20px', color: 'var(--success)' }}>
          &#10003; Ready to post — all prerequisites are satisfied.
        </div>
      )}

      {/* Error / Result */}
      {error && (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '14px', marginBottom: '20px', color: '#dc3545' }}>
          &#9888; {error}
        </div>
      )}
      {result && (
        <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: 'var(--success)' }}>
          <strong>&#10003; {result.message}</strong>
          <div style={{ marginTop: '6px', fontSize: '14px' }}>{result.posted} employee records posted to master file.</div>
        </div>
      )}

      {/* Post Button */}
      <button
        className="btn btn-primary"
        style={{ fontSize: '15px', padding: '10px 28px' }}
        onClick={() => setShowConfirm(true)}
        disabled={posting || !!validationError}
      >
        {posting ? 'Posting...' : 'Post Transactions to Master File'}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && sysId && (
        <ModalPortal onClick={() => setShowConfirm(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Confirm Post</h3>

            <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              You are about to post <strong>{sysId.TcCount} timecard records</strong> for <strong>{MONTHS[sysId.PAYMonth]} {sysId.PAYYear} ({payTypeLabel})</strong> to the master pay file.
            </p>

            {/* Month/Year confirmation */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Confirm Month</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={confirmMonth}
                  onChange={e => setConfirmMonth(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Confirm Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={confirmYear}
                  onChange={e => setConfirmYear(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* 3rd Payroll question (only for 2nd half) */}
            {sysId.PayType === 2 && (
              <div style={{ background: 'var(--background)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={has3rdPayroll} onChange={e => setHas3rdPayroll(e.target.checked)} />
                  Is there a <strong>3rd payroll</strong> this month? (monthly employees with mid-month cutoff)
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePost}>
                Confirm Post
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
