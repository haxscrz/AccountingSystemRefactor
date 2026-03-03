import { useState, useEffect } from 'react'
import axios from 'axios'

interface SystemInfo {
  currentMonth: number
  currentYear: number
  begDate: string | null
  endDate: string | null
  totalUnposted: number
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function FSMonthEnd() {
  const API_BASE = 'http://localhost:5081/api/fs'
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const [resultSuccess, setResultSuccess] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const loadSystemInfo = async () => {
    setLoadingInfo(true)
    try {
      const resp = await axios.get(`${API_BASE}/system-info`)
      setSysInfo(resp.data)
    } catch {
      setSysInfo(null)
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => {
    void loadSystemInfo()
  }, [])

  const currentPeriodLabel = sysInfo
    ? `${MONTH_NAMES[sysInfo.currentMonth]} ${sysInfo.currentYear}`
    : '—'

  const handleConfirmAndClose = async () => {
    if (!sysInfo) return
    const expected = `${sysInfo.currentMonth}/${sysInfo.currentYear}`
    if (confirmText.trim() !== expected) {
      alert(`Please type exactly: ${expected}`)
      return
    }

    if (!window.confirm(
      `MONTH-END PROCESSING FOR ${currentPeriodLabel.toUpperCase()}\n\n` +
      'WARNING: This action cannot be undone!\n\n' +
      'This will:\n' +
      '1. Roll all account balances forward\n' +
      '2. Clear all transaction tables (checkmas, checkvou, cashrcpt, salebook, journals, purcbook, adjstmnt, pournals)\n' +
      '3. Advance the system to the next period\n\n' +
      'Continue?'
    )) return

    setProcessing(true)
    setResultMessage('')

    try {
      const resp = await axios.post(
        `${API_BASE}/month-end?year=${sysInfo.currentYear}&month=${sysInfo.currentMonth}`
      )
      setResultSuccess(true)
      setResultMessage(resp.data.message || 'Month-end processing completed successfully.')
      setStep(3)
      await loadSystemInfo()
    } catch (err: any) {
      setResultSuccess(false)
      setResultMessage(err.response?.data?.error || err.response?.data?.Error || err.message || 'Month-end processing failed.')
    } finally {
      setProcessing(false)
    }
  }

  const isYearEnd = sysInfo?.currentMonth === 12

  return (
    <div className="card">
      <h2>Month-End Processing</h2>
      <p className="subtitle">Close the current period and roll balances forward (f_a_mntend)</p>

      {/* Current Period Information */}
      <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Current Period Information</h4>
        {loadingInfo && <p style={{ color: 'var(--text-secondary)' }}>Loading system info...</p>}
        {!loadingInfo && sysInfo && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Period to Close:</span>
              <strong>{currentPeriodLabel}</strong>
            </div>
            {sysInfo.begDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Period Range:</span>
                <strong>
                  {new Date(sysInfo.begDate).toLocaleDateString()} –{' '}
                  {sysInfo.endDate ? new Date(sysInfo.endDate).toLocaleDateString() : '?'}
                </strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Unposted Transactions:</span>
              <strong className={sysInfo.totalUnposted > 0 ? 'badge badge-error' : 'badge badge-success'}>
                {sysInfo.totalUnposted}
              </strong>
            </div>
            {isYearEnd && (
              <div style={{ padding: '10px', marginTop: '10px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #ca8a04', borderRadius: '4px', color: '#92400e', fontSize: '13px' }}>
                ⚠ YEAR-END CLOSE: This is December. Expense &amp; income accounts marked for initialization will be reset to zero.
              </div>
            )}
          </div>
        )}
        {!loadingInfo && !sysInfo && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
            Could not load system info. Backend may be offline.
          </p>
        )}
      </div>

      {/* Step wizard */}
      {step < 3 && sysInfo && !loadingInfo && (
        <div style={{ marginBottom: '32px' }}>
          <h4>Month-End Steps</h4>
          <div style={{ marginTop: '16px' }}>

            {/* Step 1: Confirm period */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: step === 1 ? 'rgba(15, 91, 102, 0.05)' : 'rgba(22, 163, 74, 0.05)', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step > 1 ? 'var(--success)' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>Confirm Period</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Type the period to close in the format <code>M/YYYY</code> (e.g. <code>{sysInfo.currentMonth}/{sysInfo.currentYear}</code>)
                </p>
                {step === 1 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '140px' }}
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      placeholder={`${sysInfo.currentMonth}/${sysInfo.currentYear}`}
                      onKeyDown={e => { if (e.key === 'Enter') setStep(2) }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const expected = `${sysInfo.currentMonth}/${sysInfo.currentYear}`
                        if (confirmText.trim() !== expected) {
                          alert(`Please type exactly: ${expected}`)
                        } else {
                          setStep(2)
                        }
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Execute close */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: step === 2 ? 'rgba(15, 91, 102, 0.05)' : 'white', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= 2 ? 'var(--primary)' : 'var(--border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <strong>Execute Month-End Close</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Roll balances forward, apply formula logic, and clear all transaction tables
                </p>
                {step === 2 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleConfirmAndClose}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Close Period Now'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={processing}>
                      Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {(resultMessage || step === 3) && (
        <div style={{
          background: resultSuccess ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${resultSuccess ? 'var(--success)' : 'var(--error, #dc2626)'}`,
          borderRadius: '8px',
          padding: '16px',
          color: resultSuccess ? 'var(--success)' : 'var(--error, #dc2626)'
        }}>
          {resultSuccess ? '✓' : '✗'} {resultMessage}
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={() => { setStep(1); setResultMessage(''); setConfirmText('') }}>
            Start Another Close
          </button>
        </div>
      )}
    </div>
  )
}
