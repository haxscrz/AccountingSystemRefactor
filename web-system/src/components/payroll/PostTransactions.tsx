import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface SysIdInfo {
  trnCtr: number; trnPrc: number; trnUpd: number
  begDate: string; endDate: string
  payMonth: number; payYear: number; payType: number
  empCount: number; tcCount: number
}

interface PostResult { message: string; posted: number }

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const fmtDate = (d: string) => { try { return d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' } catch { return d } }

export default function PostTransactions() {
  const [sysId, setSysId] = useState<SysIdInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [result, setResult] = useState<PostResult | null>(null)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [has3rdPayroll, setHas3rdPayroll] = useState(false)
  const [confirmMonth, setConfirmMonth] = useState('')
  const [confirmYear, setConfirmYear] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/payroll/system-id')
      const data = await res.json()
      if (res.ok) {
        setSysId(data)
        setConfirmMonth(String(data.payMonth).padStart(2, '0'))
        setConfirmYear(String(data.payYear))
      } else { setError('Could not load payroll period information.') }
    } catch { setError('Network error — could not reach server.') }
    finally { setLoading(false) }
  }

  const handlePost = async () => {
    setPosting(true); setError(''); setResult(null); setShowConfirm(false)
    try {
      const params = new URLSearchParams({ has3rdPayroll: String(has3rdPayroll), month: confirmMonth, year: confirmYear })
      const res = await fetch(`/api/payroll/post-timecard?${params}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) { setResult(data); load() }
      else { setError(data.error || data.message || 'Post failed.') }
    } catch { setError('Network error — could not reach server.') }
    finally { setPosting(false) }
  }

  const getValidationError = (): string | null => {
    if (!sysId) return null
    if (sysId.tcCount === 0) return 'No timecard records to post. Please add employees first.'
    if (sysId.trnCtr !== sysId.trnPrc) return `Timecard not fully computed (${sysId.trnPrc}/${sysId.trnCtr} processed). Run Compute Payroll first.`
    if (sysId.trnPrc === sysId.trnUpd) return `Period already posted (${sysId.trnUpd} records). This period has been finalized.`
    return null
  }

  const payTypeLabel = sysId?.payType === 1 ? '1st Half' : sysId?.payType === 2 ? '2nd Half' : 'Monthly'
  const validationError = getValidationError()

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <PageHeader
        breadcrumb="PAYROLL PROCESSING / POST TRANSACTIONS"
        title="Post Transactions"
        subtitle="Posts computed timecard records to the master pay file (POSTTIME.PRG). Once posted, this period's data is finalized."
      />

      {loading && (
        <div className="flex items-center gap-3 py-8 text-on-surface-variant/60 text-sm animate-pulse">
          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> Loading period information…
        </div>
      )}

      {!loading && sysId && (
        <>
          {/* Period cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 bg-white border border-outline-variant/15 rounded-2xl px-6 py-5 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-1">Current Period</div>
              <div className="font-headline font-bold text-on-surface text-lg">{fmtDate(sysId.begDate)} — {fmtDate(sysId.endDate)}</div>
              <div className="text-sm text-on-surface-variant mt-1">{payTypeLabel} · {MONTHS[sysId.payMonth]} {sysId.payYear}</div>
            </div>
            {[
              { label: 'In Timecard', val: sysId.tcCount, icon: 'assignment', color: 'text-primary' },
              { label: 'Computed', val: `${sysId.trnPrc} / ${sysId.trnCtr}`, icon: 'check_circle', color: 'text-emerald-600' },
              { label: 'Posted', val: sysId.trnUpd, icon: 'publish', color: sysId.trnUpd > 0 ? 'text-primary' : 'text-on-surface-variant/40' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-outline-variant/15 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
                <span className={`material-symbols-outlined text-[22px] ${s.color} opacity-70`}>{s.icon}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">{s.label}</div>
                  <div className={`font-mono font-bold text-xl ${s.color}`}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation / ready state */}
          {validationError ? (
            <div className="flex items-start gap-3 px-5 py-4 bg-error/5 border border-error/20 rounded-2xl text-error text-sm">
              <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">warning</span>
              <div><strong>Cannot Post:</strong> {validationError}</div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <strong>Ready to post</strong> — all prerequisites are satisfied.
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span> {error}
            </div>
          )}
          {result && (
            <div className="flex items-start gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <div><strong>{result.message}</strong><br />{result.posted} employee records posted to master file.</div>
            </div>
          )}

          {/* Post button */}
          <div className="bg-white border border-outline-variant/15 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-headline font-bold text-on-surface">Post to Master File</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">
                This will finalize all computed records for {MONTHS[sysId.payMonth]} {sysId.payYear} ({payTypeLabel}).
              </p>
            </div>
            <button
              onClick={() => !validationError && setShowConfirm(true)}
              disabled={posting || !!validationError}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">{posting ? 'sync' : 'publish'}</span>
              {posting ? 'Posting…' : 'Post Transactions'}
            </button>
          </div>
        </>
      )}

      {/* Confirm dialog */}
      {showConfirm && sysId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface text-center mb-2">Confirm Post</h3>
            <p className="text-sm text-on-surface-variant text-center mb-6">
              You are about to post <strong>{sysId.tcCount} timecard records</strong> for{' '}
              <strong>{MONTHS[sysId.payMonth]} {sysId.payYear} ({payTypeLabel})</strong> to the master pay file. This cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">Confirm Month</label>
                <input type="number" min="1" max="12" value={confirmMonth} onChange={e => setConfirmMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">Confirm Year</label>
                <input type="number" min="2000" max="2100" value={confirmYear} onChange={e => setConfirmYear(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {sysId.payType === 2 && (
              <label className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl mb-4 cursor-pointer">
                <input type="checkbox" checked={has3rdPayroll} onChange={e => setHas3rdPayroll(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm">Is there a <strong>3rd payroll</strong> this month? (monthly employees with mid-month cutoff)</span>
              </label>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handlePost} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Confirm Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
