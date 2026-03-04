import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface SysInfo {
  BegDate: string
  EndDate: string
  PresMo: number
  PresYr: number
  TrnCtr: number
  TrnPrc: number
  TrnUpd: number
  PayType: number
  EmpCount: number
  TcCount: number
}

interface ComputeSummary {
  BegDate: string
  EndDate: string
  PresMo: number
  PresYr: number
  TrnCtr: number
  TrnPrc: number
  TrnUpd: number
  PayType: number
  Uncomputed: number
  ComputedCount: number
  PostedCount: number
  TotalGross: number
  TotalTax: number
  TotalSssEe: number
  TotalMedEe: number
  TotalPgbgEe: number
  TotalDed: number
  TotalNet: number
  Rows: { EmpNo: string; GrsPay: number; SssEe: number; MedEe: number; PgbgEe: number; TaxEe: number; TotDed: number; NetPay: number }[]
}

export default function PayrollCompute() {
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null)
  const [summary, setSummary] = useState<ComputeSummary | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [computeResult, setComputeResult] = useState<string | null>(null)
  const [computeError, setComputeError] = useState('')
  // Confirmation dialog for "Deduct TAX from Casual Employees?"
  const [showCasualTaxDialog, setShowCasualTaxDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [sysRes, sumRes] = await Promise.all([
        fetch('/api/payroll/system-id'),
        fetch('/api/payroll/compute-summary')
      ])
      if (sysRes.ok) setSysInfo(await sysRes.json())
      else setLoadError('Could not load system information. Is the backend running?')
      if (sumRes.ok) setSummary(await sumRes.json())
    } catch {
      setLoadError('Cannot reach backend server.')
    } finally {
      setLoading(false)
    }
  }

  const startCompute = (deductTaxForCasual: boolean) => {
    setShowCasualTaxDialog(false)
    setComputing(true)
    setProgress(0)
    setComputeResult(null)
    setComputeError('')

    // Animate progress while waiting for the API
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 3 : prev))
    }, 150)

    fetch(`/api/payroll/compute?deductTaxForCasual=${deductTaxForCasual}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        clearInterval(interval)
        setProgress(100)
        if (data.Error || data.error) {
          setComputeError(data.Error || data.error)
        } else {
          setComputeResult(`Computation complete. ${data.EmployeesProcessed} employee(s) processed.`)
          loadData()
        }
      })
      .catch(() => {
        clearInterval(interval)
        setComputeError('Network error — could not reach the computation service.')
      })
      .finally(() => setComputing(false))
  }

  const formatDate = (d: string) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const fmt = (n: number) => (n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
  const halfLabel = sysInfo ? (sysInfo.PayType === 1 ? '1st Half' : '2nd Half') : ''

  const canCompute = sysInfo && sysInfo.TcCount > 0 && sysInfo.TrnCtr !== sysInfo.TrnUpd

  return (
    <div className="card">
      <h2>Compute Payroll</h2>
      <p className="subtitle">Calculates gross pay, government contributions, withholding tax, and net pay for all timecard entries</p>

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading payroll status...</div>
      )}

      {loadError && (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '16px', color: '#dc3545', marginBottom: '16px' }}>
          {loadError}
        </div>
      )}

      {!loading && sysInfo && (
        <>
          {/* Period & Counter Panel */}
          <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '14px' }}>Current Payroll Period</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px', fontSize: '14px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>PERIOD</div>
                <div style={{ fontWeight: '600' }}>{formatDate(sysInfo.BegDate)} &#8212; {formatDate(sysInfo.EndDate)}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{halfLabel} &bull; Month {sysInfo.PresMo}/{sysInfo.PresYr}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>EMPLOYEES IN TIMECARD</div>
                <div style={{ fontWeight: '700', fontSize: '22px', color: 'var(--primary)' }}>{sysInfo.TcCount}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>COMPUTED</div>
                <div style={{ fontWeight: '700', fontSize: '22px', color: 'var(--success)' }}>
                  {sysInfo.TrnPrc} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ {sysInfo.TrnCtr}</span>
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>POSTED</div>
                <div style={{ fontWeight: '700', fontSize: '22px', color: sysInfo.TrnUpd > 0 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  {sysInfo.TrnUpd}
                </div>
              </div>
            </div>

            {sysInfo.TrnCtr === sysInfo.TrnUpd && sysInfo.TrnCtr > 0 && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '6px', color: 'var(--success)', fontSize: '13px' }}>
                &#10003; This period has already been posted. Use <strong>Initialize Timecard</strong> to start a new payroll period.
              </div>
            )}
            {sysInfo.TcCount === 0 && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '6px', color: '#dc3545', fontSize: '13px' }}>
                No timecards in the system. Use <strong>Add/Edit Timecard</strong> to enter employee time data first.
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {computing && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Computing payroll&hellip;</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '24px', background: 'var(--background)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.15s' }} />
              </div>
            </div>
          )}

          {/* Success message */}
          {computeResult && (
            <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: 'var(--success)' }}>
              &#10003; {computeResult}
            </div>
          )}

          {/* Error message */}
          {computeError && (
            <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: '#dc3545' }}>
              &#9888; {computeError}
            </div>
          )}

          {/* Compute Button */}
          <div style={{ marginBottom: '24px' }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: '15px', padding: '10px 28px' }}
              onClick={() => setShowCasualTaxDialog(true)}
              disabled={computing || !canCompute}
            >
              {computing ? 'Computing...' : 'Compute Payroll'}
            </button>
            {canCompute && (
              <span style={{ marginLeft: '14px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Will process {sysInfo.TcCount - sysInfo.TrnPrc} remaining employee(s)
              </span>
            )}
          </div>

          {/* Computation Totals */}
          {summary && summary.ComputedCount > 0 && (
            <>
              <h4 style={{ marginBottom: '14px' }}>Computed Payroll Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Employees', value: summary.ComputedCount.toString(), color: 'var(--primary)' },
                  { label: 'Gross Pay', value: '&#8369; ' + fmt(summary.TotalGross), color: 'var(--text)' },
                  { label: 'SSS (EE)', value: '&#8369; ' + fmt(summary.TotalSssEe), color: 'var(--text)' },
                  { label: 'PhilHealth (EE)', value: '&#8369; ' + fmt(summary.TotalMedEe), color: 'var(--text)' },
                  { label: 'Pag-IBIG (EE)', value: '&#8369; ' + fmt(summary.TotalPgbgEe), color: 'var(--text)' },
                  { label: 'Withholding Tax', value: '&#8369; ' + fmt(summary.TotalTax), color: 'var(--text)' },
                  { label: 'Total Deductions', value: '&#8369; ' + fmt(summary.TotalDed), color: '#dc3545' },
                  { label: 'NET PAY', value: '&#8369; ' + fmt(summary.TotalNet), color: 'var(--success)' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: c.color, marginTop: '4px' }} dangerouslySetInnerHTML={{ __html: c.value }} />
                  </div>
                ))}
              </div>

              {/* Per-Employee Results Table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp No.</th>
                    <th style={{ textAlign: 'right' }}>Gross Pay</th>
                    <th style={{ textAlign: 'right' }}>SSS</th>
                    <th style={{ textAlign: 'right' }}>PhilHealth</th>
                    <th style={{ textAlign: 'right' }}>Pag-IBIG</th>
                    <th style={{ textAlign: 'right' }}>Tax</th>
                    <th style={{ textAlign: 'right' }}>Total Ded</th>
                    <th style={{ textAlign: 'right' }}>Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.Rows.map(r => (
                    <tr key={r.EmpNo}>
                      <td><strong>{r.EmpNo}</strong></td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.GrsPay)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.SssEe)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.MedEe)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.PgbgEe)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.TaxEe)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.TotDed)}</td>
                      <td style={{ textAlign: 'right' }}><strong>{fmt(r.NetPay)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: '700', background: 'var(--background)' }}>
                    <td>TOTALS</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalGross)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalSssEe)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalMedEe)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalPgbgEe)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalTax)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalDed)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(summary.TotalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </>
      )}

      {/* ── Casual Tax Dialog ─────────────────────────────────── */}
      {showCasualTaxDialog && (
        <ModalPortal onClick={() => setShowCasualTaxDialog(false)}>
          <div className="modal" style={{ maxWidth: '400px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Compute Payroll</h3>
              <button className="modal-close" onClick={() => setShowCasualTaxDialog(false)}>&times;</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '24px', fontWeight: '500' }}>Deduct withholding tax from Casual Employees?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => startCompute(true)} style={{ minWidth: '80px' }}>Yes</button>
                <button className="btn btn-secondary" onClick={() => startCompute(false)} style={{ minWidth: '80px' }}>No</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
