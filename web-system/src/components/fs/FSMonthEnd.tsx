import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import PageHeader from '../PageHeader'

interface SystemInfo {
  currentMonth: number; currentYear: number
  begDate: string | null; endDate: string | null; totalUnposted: number
}

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

type ToastType = 'success' | 'error' | 'info' | 'warning'

export default function FSMonthEnd() {
  const API_BASE = '/api/fs'
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const [resultSuccess, setResultSuccess] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [processLog, setProcessLog] = useState<string[]>([])

  // Toast system
  const [toast, setToast] = useState<{ text: string; type: ToastType } | null>(null)

  const showToast = useCallback((text: string, type: ToastType = 'info') => {
    if (!text) { setToast(null); return }
    const inferredType = type === 'info' && /error|failed|unable|cannot/i.test(text) ? 'error' as const : type
    setToast({ text, type: inferredType })
  }, [])

  useEffect(() => {
    if (toast) {
      const ms = toast.type === 'error' ? 7000 : toast.type === 'warning' ? 6000 : 4500
      const timer = setTimeout(() => setToast(null), ms)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const addLog = useCallback((msg: string) => {
    setProcessLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }, [])

  const loadSystemInfo = async () => {
    setLoadingInfo(true)
    setLoadError('')
    try {
      const resp = await axios.get(`${API_BASE}/system-info`)
      setSysInfo(resp.data)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error'
      setLoadError(`Could not load system info: ${msg}`)
      setSysInfo(null)
      showToast(`Failed to load period info: ${msg}`, 'error')
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => { void loadSystemInfo() }, [])

  const currentPeriodLabel = sysInfo ? `${MONTH_NAMES[sysInfo.currentMonth]} ${sysInfo.currentYear}` : '—'

  // Pre-flight validation
  const preflightErrors: string[] = []
  if (sysInfo) {
    if (sysInfo.currentMonth < 1 || sysInfo.currentMonth > 12) {
      preflightErrors.push('Current month value is invalid. Check system configuration.')
    }
  }

  const handleStepOneConfirm = () => {
    if (!sysInfo) return
    const expected = `${sysInfo.currentMonth}/${sysInfo.currentYear}`
    if (confirmText.trim() !== expected) {
      showToast(`Period mismatch. Please type exactly: ${expected}`, 'warning')
      return
    }
    if (preflightErrors.length > 0) {
      showToast(preflightErrors[0], 'error')
      return
    }
    setStep(2)
    showToast('Period confirmed. Review details and proceed when ready.', 'info')
  }

  const handleConfirmAndClose = async () => {
    if (!sysInfo) return

    // Double-check confirmation text
    const expected = `${sysInfo.currentMonth}/${sysInfo.currentYear}`
    if (confirmText.trim() !== expected) {
      showToast(`Period mismatch. Type exactly: ${expected}`, 'error')
      return
    }

    // We intentionally allow unposted transactions because Month-End backend logic
    // will auto-post them internally before ZAPping the tables.

    // Final confirmation
    if (!window.confirm(
      `MONTH-END PROCESSING FOR ${currentPeriodLabel.toUpperCase()}\n\n` +
      `This will:\n` +
      `• Roll all account balances forward\n` +
      `• Apply DC/CD formula logic\n` +
      `• Clear all transaction tables\n` +
      `${sysInfo.currentMonth === 12 ? '• RESET expense & income accounts (YEAR-END)\n' : ''}` +
      `\nWARNING: This action cannot be undone!\n\nContinue?`
    )) {
      showToast('Month-end processing cancelled.', 'info')
      return
    }

    setProcessing(true)
    setResultMessage('')
    setProcessLog([])

    addLog('Starting month-end processing...')
    addLog(`Closing period: ${currentPeriodLabel}`)

    try {
      addLog('Sending close request to server...')
      const resp = await axios.post(
        `${API_BASE}/month-end?year=${sysInfo.currentYear}&month=${sysInfo.currentMonth}`,
        null,
        { timeout: 120000 } // 2 minute timeout for large datasets
      )

      const msg = resp.data.message || 'Month-end processing completed successfully.'
      addLog(`Server response: ${msg}`)

      // Parse response details if available
      if (resp.data.accountsProcessed !== undefined) {
        addLog(`Accounts processed: ${resp.data.accountsProcessed}`)
      }
      if (resp.data.transactionsCleared !== undefined) {
        addLog(`Transactions cleared: ${resp.data.transactionsCleared}`)
      }
      if (resp.data.newMonth !== undefined && resp.data.newYear !== undefined) {
        addLog(`New period: ${MONTH_NAMES[resp.data.newMonth] || resp.data.newMonth} ${resp.data.newYear}`)
      }

      addLog('Month-end processing completed successfully.')
      setResultSuccess(true)
      setResultMessage(msg)
      setStep(3)
      showToast('Month-end close completed successfully!', 'success')

      // Refresh system info to show updated period
      await loadSystemInfo()

    } catch (err: any) {
      const errMsg = err.response?.data?.error
        || err.response?.data?.Error
        || err.response?.data?.message
        || (err.code === 'ECONNABORTED' ? 'Request timed out. The server may still be processing — please check system info.' : null)
        || err.message
        || 'Month-end processing failed.'

      addLog(`ERROR: ${errMsg}`)

      // Specific error handling
      if (err.response?.status === 400) {
        addLog('Bad request — check that all prerequisites are met.')
      } else if (err.response?.status === 409) {
        addLog('Conflict — another process may already be running.')
      } else if (err.response?.status === 500) {
        addLog('Internal server error — check server logs for details.')
      } else if (!err.response) {
        addLog('No response from server — connection may have been lost.')
      }

      setResultSuccess(false)
      setResultMessage(errMsg)
      showToast(`Month-end failed: ${errMsg}`, 'error')

      // Refresh system info in case partial processing occurred
      try { await loadSystemInfo() } catch { /* best effort */ }

    } finally {
      setProcessing(false)
    }
  }

  const isYearEnd = sysInfo?.currentMonth === 12
  const canProceed = preflightErrors.length === 0

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <PageHeader
        breadcrumb="ADMINISTRATION / MONTH-END PROCESSING"
        title="Month-End Processing"
        subtitle="Close the current fiscal period and roll all account balances forward (f_a_mntend)"
      />

      {/* Period info card */}
      <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event</span>
            <h3 className="font-headline font-bold text-sm text-on-surface uppercase tracking-wide">Current Period Information</h3>
          </div>
          {!loadingInfo && (
            <button onClick={() => void loadSystemInfo()} className="text-xs text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">refresh</span> Refresh
            </button>
          )}
        </div>

        {loadingInfo ? (
          <div className="flex items-center gap-2 px-6 py-6 text-on-surface-variant/60 text-sm animate-pulse">
            <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Loading system info…
          </div>
        ) : sysInfo ? (
          <div className="divide-y divide-outline-variant/10">
            {[
              { label: 'Period to Close', val: currentPeriodLabel, highlight: true },
              { label: 'Period Range', val: sysInfo.begDate ? `${new Date(sysInfo.begDate).toLocaleDateString()} – ${sysInfo.endDate ? new Date(sysInfo.endDate).toLocaleDateString() : '?'}` : '—' },
              {
                label: 'Unposted Transactions',
                val: String(sysInfo.totalUnposted),
                badge: sysInfo.totalUnposted > 0 ? 'warning' : 'success'
              },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-6 py-3.5">
                <span className="text-sm text-on-surface-variant">{row.label}</span>
                {row.badge ? (
                  <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${row.badge === 'error' ? 'bg-error/10 text-error' : row.badge === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {row.val}
                  </span>
                ) : (
                  <span className={`text-sm font-bold text-on-surface ${row.highlight ? 'text-primary text-base' : ''}`}>{row.val}</span>
                )}
              </div>
            ))}

            {isYearEnd && (
              <div className="flex items-start gap-3 mx-5 my-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">warning</span>
                <span><strong>YEAR-END CLOSE:</strong> This is December. Expense &amp; income accounts marked for initialization will be reset to zero.</span>
              </div>
            )}

            {/* Pre-flight warnings */}
            {preflightErrors.length > 0 && (
              <div className="px-5 py-3">
                {preflightErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-2 last:mb-0">
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">block</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-6 text-sm">
            <div className="flex items-start gap-2 text-red-600">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <div>
                <p className="font-semibold">{loadError || 'Could not load system info.'}</p>
                <button onClick={() => void loadSystemInfo()} className="mt-2 text-xs text-primary hover:underline">Try again</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step wizard */}
      {step < 3 && sysInfo && !loadingInfo && (
        <div className="space-y-3">
          {/* Step 1 */}
          <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${step === 1 ? 'border-primary/30' : 'border-outline-variant/15'}`}>
            <div className="flex gap-4 items-start p-5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${step > 1 ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
                {step > 1 ? <span className="material-symbols-outlined text-[18px]">check</span> : '1'}
              </div>
              <div className="flex-1">
                <div className="font-headline font-bold text-on-surface">Confirm Period</div>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">Type the period to close in the format <code className="bg-surface-container-highest px-1 rounded">M/YYYY</code>, e.g. <code className="bg-surface-container-highest px-1 rounded">{sysInfo.currentMonth}/{sysInfo.currentYear}</code></p>
                {step === 1 && (
                  <div className="flex gap-3 mt-3">
                    <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleStepOneConfirm() }}
                      placeholder={`${sysInfo.currentMonth}/${sysInfo.currentYear}`}
                      className="w-36 px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={handleStepOneConfirm}
                      disabled={!canProceed && confirmText.trim() === `${sysInfo.currentMonth}/${sysInfo.currentYear}`}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60">Confirm</button>
                  </div>
                )}
                {step === 1 && !canProceed && (
                  <p className="text-xs text-error mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Resolve the issues above before proceeding.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${step === 2 ? 'border-primary/30' : 'border-outline-variant/15 opacity-60'}`}>
            <div className="flex gap-4 items-start p-5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${step >= 2 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                2
              </div>
              <div className="flex-1">
                <div className="font-headline font-bold text-on-surface">Execute Month-End Close</div>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">Roll balances forward, apply formula logic, and clear all transaction tables</p>
                {step === 2 && (
                  <div className="flex gap-3 mt-3">
                    <button onClick={handleConfirmAndClose} disabled={processing}
                      className="px-5 py-2 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 disabled:opacity-60 transition-colors flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${processing ? 'animate-spin' : ''}`}>{processing ? 'sync' : 'lock_clock'}</span>
                      {processing ? 'Processing…' : 'Close Period Now'}
                    </button>
                    <button onClick={() => { setStep(1); showToast('Stepped back. Verify details before proceeding.', 'info') }} disabled={processing}
                      className="px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Log */}
      {processLog.length > 0 && (
        <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-outline-variant/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">terminal</span>
            <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wide">Processing Log</h4>
          </div>
          <div className="px-5 py-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
            {processLog.map((line, i) => (
              <div key={i} className={`${line.includes('ERROR') ? 'text-red-600 font-bold' : line.includes('completed successfully') ? 'text-emerald-600 font-semibold' : 'text-on-surface-variant/80'}`}>
                {line}
              </div>
            ))}
            {processing && (
              <div className="text-primary animate-pulse flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Working…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {(resultMessage || step === 3) && (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm ${resultSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">{resultSuccess ? 'check_circle' : 'error'}</span>
          <div>
            <p className="font-semibold">{resultSuccess ? 'Period Closed Successfully' : 'Processing Failed'}</p>
            <p className="mt-1 opacity-80">{resultMessage}</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <button onClick={() => { setStep(1); setResultMessage(''); setConfirmText(''); setProcessLog([]) }}
          className="w-fit px-5 py-2 border border-outline-variant/20 text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
          Start Another Close
        </button>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-xl border text-sm font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'error'
            ? 'bg-red-600 text-white border-red-700'
            : toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-surface text-on-surface border-outline-variant/30 shadow-lg'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'error' ? 'error' : toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
          </span>
          {toast.text}
          <button type="button" onClick={() => setToast(null)} className="ml-3 opacity-70 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  )
}
