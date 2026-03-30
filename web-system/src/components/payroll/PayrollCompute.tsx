import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface SysInfo {
  begDate: string; endDate: string; presMo: number; presYr: number
  trnCtr: number; trnPrc: number; trnUpd: number; payType: number
  empCount: number; tcCount: number
}

interface ComputeSummary {
  begDate: string; endDate: string; presMo: number; presYr: number
  trnCtr: number; trnPrc: number; trnUpd: number; payType: number
  uncomputed: number; computedCount: number; postedCount: number
  totalGross: number; totalTax: number; totalSssEe: number
  totalMedEe: number; totalPgbgEe: number; totalDed: number; totalNet: number
  rows: { empNo: string; grsPay: number; sssEe: number; medEe: number; pgbgEe: number; taxEe: number; totDed: number; netPay: number }[]
}

const fmt = (n: number) => (n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
const fmtDate = (d: string) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }

export default function PayrollCompute() {
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null)
  const [summary, setSummary] = useState<ComputeSummary | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [computeResult, setComputeResult] = useState<string | null>(null)
  const [computeError, setComputeError] = useState('')
  const [showCasualTaxDialog, setShowCasualTaxDialog] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true); setLoadError('')
    try {
      const [sysRes, sumRes] = await Promise.all([
        fetch('/api/payroll/system-id'),
        fetch('/api/payroll/compute-summary')
      ])
      if (sysRes.ok) setSysInfo(await sysRes.json())
      else setLoadError('Could not load system information.')
      if (sumRes.ok) setSummary(await sumRes.json())
    } catch { setLoadError('Cannot reach backend server.') }
    finally { setLoading(false) }
  }

  const startCompute = (deductTaxForCasual: boolean) => {
    setShowCasualTaxDialog(false)
    setComputing(true); setProgress(0); setComputeResult(null); setComputeError('')
    const interval = setInterval(() => setProgress(prev => prev < 90 ? prev + 3 : prev), 150)
    fetch(`/api/payroll/compute?deductTaxForCasual=${deductTaxForCasual}`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        clearInterval(interval); setProgress(100)
        if (data.Error || data.error) setComputeError(data.Error || data.error)
        else { setComputeResult(`Computation complete. ${data.EmployeesProcessed} employee(s) processed.`); loadData() }
      })
      .catch(() => { clearInterval(interval); setComputeError('Network error — could not reach the computation service.') })
      .finally(() => setComputing(false))
  }

  const canCompute = sysInfo && sysInfo.tcCount > 0 && sysInfo.trnPrc < sysInfo.trnCtr
  const halfLabel = sysInfo ? (sysInfo.payType === 1 ? '1st Half' : '2nd Half') : ''

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      <PageHeader
        breadcrumb="PAYROLL PROCESSING / COMPUTE"
        title="Compute Payroll"
        subtitle="Calculates gross pay, government contributions, withholding tax, and net pay for all timecard entries"
      />

      {/* Loading / error */}
      {loading && (
        <div className="flex items-center gap-3 py-8 text-on-surface-variant/60 text-sm animate-pulse">
          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> Loading payroll status…
        </div>
      )}
      {loadError && (
        <div className="flex items-center gap-3 px-5 py-4 bg-error/5 border border-error/20 rounded-2xl text-error text-sm">
          <span className="material-symbols-outlined text-[20px]">error</span> {loadError}
        </div>
      )}

      {!loading && sysInfo && (
        <>
          {/* Period info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 bg-white border border-outline-variant/15 rounded-2xl px-6 py-5 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-1">Current Period</div>
              <div className="font-headline font-bold text-on-surface text-lg">{fmtDate(sysInfo.begDate)} — {fmtDate(sysInfo.endDate)}</div>
              <div className="text-sm text-on-surface-variant mt-1">{halfLabel} · Month {sysInfo.presMo}/{sysInfo.presYr}</div>
            </div>
            {[
              { label: 'In Timecard', val: sysInfo.tcCount, color: 'text-primary', icon: 'assignment' },
              { label: 'Computed', val: `${sysInfo.trnPrc} / ${sysInfo.trnCtr}`, color: 'text-emerald-600', icon: 'check_circle' },
              { label: 'Posted', val: sysInfo.trnUpd, color: sysInfo.trnUpd > 0 ? 'text-primary' : 'text-on-surface-variant/50', icon: 'publish' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-outline-variant/15 rounded-2xl px-6 py-5 shadow-sm flex items-center gap-3">
                <span className={`material-symbols-outlined text-[22px] ${s.color} opacity-70`}>{s.icon}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">{s.label}</div>
                  <div className={`font-mono font-bold text-xl ${s.color}`}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Status banners */}
          {sysInfo.trnCtr === sysInfo.trnUpd && sysInfo.trnCtr > 0 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <strong>Period already fully posted.</strong> Use Initialize Timecard to start a new payroll period.
            </div>
          )}
          {sysInfo.tcCount === 0 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              No timecards in the system. Use <strong className="mx-1">Add/Edit Timecard</strong> to enter employee time data first.
            </div>
          )}

          {/* Compute action */}
          <div className="bg-white border border-outline-variant/15 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline font-bold text-on-surface">Run Payroll Computation</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {canCompute ? `Will process ${(sysInfo.trnCtr - sysInfo.trnPrc)} remaining employee(s)` : 'All records already computed or no timecards available.'}
                </p>
              </div>
              <button
                onClick={() => setShowCasualTaxDialog(true)}
                disabled={computing || !canCompute}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">{computing ? 'sync' : 'calculate'}</span>
                {computing ? 'Computing…' : 'Compute Payroll'}
              </button>
            </div>

            {/* Progress bar */}
            {computing && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant animate-pulse">Processing employees…</span>
                  <span className="font-mono font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Messages */}
            {computeResult && (
              <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                <span className="material-symbols-outlined text-[18px]">check_circle</span> {computeResult}
              </div>
            )}
            {computeError && (
              <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <span className="material-symbols-outlined text-[18px]">error</span> {computeError}
              </div>
            )}
          </div>

          {/* Computed summary */}
          {summary && summary.computedCount > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Employees Computed', val: summary.computedCount.toString(), color: 'text-primary', icon: 'group' },
                  { label: 'Total Gross Pay', val: `₱${fmt(summary.totalGross)}`, color: 'text-emerald-700', icon: 'payments' },
                  { label: 'Total Deductions', val: `₱${fmt(summary.totalDed)}`, color: 'text-red-600', icon: 'remove_circle' },
                  { label: 'Net Payroll', val: `₱${fmt(summary.totalNet)}`, color: 'text-primary', icon: 'account_balance' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-outline-variant/15 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[22px] ${s.color} opacity-70`}>{s.icon}</span>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">{s.label}</div>
                      <div className={`font-mono font-bold text-base ${s.color}`}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-employee table */}
              <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">table_chart</span>
                  <h4 className="font-headline font-bold text-sm text-on-surface uppercase tracking-wide">Per-Employee Results</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-container-highest text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-widest">
                      <tr>
                        <th className="px-5 py-3 text-left">Emp No.</th>
                        <th className="px-5 py-3 text-right">Gross Pay</th>
                        <th className="px-5 py-3 text-right">SSS</th>
                        <th className="px-5 py-3 text-right">PhilHealth</th>
                        <th className="px-5 py-3 text-right">Pag-IBIG</th>
                        <th className="px-5 py-3 text-right">Tax</th>
                        <th className="px-5 py-3 text-right">Total Ded</th>
                        <th className="px-5 py-3 text-right">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {summary.rows.map(r => (
                        <tr key={r.empNo} className="hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-primary">{r.empNo}</td>
                          <td className="px-5 py-3 text-right font-mono text-emerald-700">{fmt(r.grsPay)}</td>
                          <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(r.sssEe)}</td>
                          <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(r.medEe)}</td>
                          <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(r.pgbgEe)}</td>
                          <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(r.taxEe)}</td>
                          <td className="px-5 py-3 text-right font-mono text-red-600">{fmt(r.totDed)}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-on-surface">{fmt(r.netPay)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-container-highest font-bold text-sm">
                      <tr>
                        <td className="px-5 py-3 text-on-surface-variant">TOTALS</td>
                        <td className="px-5 py-3 text-right font-mono text-emerald-700">{fmt(summary.totalGross)}</td>
                        <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(summary.totalSssEe)}</td>
                        <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(summary.totalMedEe)}</td>
                        <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(summary.totalPgbgEe)}</td>
                        <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{fmt(summary.totalTax)}</td>
                        <td className="px-5 py-3 text-right font-mono text-red-600">{fmt(summary.totalDed)}</td>
                        <td className="px-5 py-3 text-right font-mono text-on-surface">{fmt(summary.totalNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Casual Tax Dialog */}
      {showCasualTaxDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCasualTaxDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-96 p-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">calculate</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface text-center mb-2">Begin Computation</h3>
            <p className="text-sm text-on-surface-variant text-center mb-6">
              Deduct withholding tax from <strong>Casual Employees</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => startCompute(false)} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">No</button>
              <button onClick={() => startCompute(true)} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
