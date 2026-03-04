import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface SysIdInfo {
  PAYYear: number
  EmpCount: number
}

interface TaxResult {
  message: string
  year: number
  employees: Array<{
    EmpNo: string
    Name: string
    AnnualGross: number
    AnnualTax: number
    WithheldTax: number
    TaxDue: number
  }>
}

export default function ComputeYearEndTax() {
  const [sysId, setSysId] = useState<SysIdInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [result, setResult] = useState<TaxResult | null>(null)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/system-id')
      if (res.ok) {
        const data = await res.json()
        setSysId(data)
        setYear(data.PAYYear ?? new Date().getFullYear())
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleCompute = async () => {
    setShowConfirm(false)
    setComputing(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/payroll/compute-yearend-tax?year=${year}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.error || data.message || 'Computation failed.')
    } catch {
      setError('Network error — could not reach server.')
    } finally {
      setComputing(false)
    }
  }

  const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
  const totalGross = result?.employees.reduce((s, e) => s + e.AnnualGross, 0) ?? 0
  const totalTaxDue = result?.employees.reduce((s, e) => s + e.TaxDue, 0) ?? 0
  const totalWithheld = result?.employees.reduce((s, e) => s + e.WithheldTax, 0) ?? 0
  const totalAnnualTax = result?.employees.reduce((s, e) => s + e.AnnualTax, 0) ?? 0

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h2>Compute Year-End Tax</h2>
      <p className="subtitle">
        Computes final annual withholding tax for all employees. Equivalent to YTAXCOMP.PRG. Re-indexes payroll history, applies table-based annual tax rates (exmp2007), and calculates tax due or refund per employee.
      </p>

      {/* Year Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Tax Year</label>
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', width: '120px', fontSize: '16px' }}
          />
        </div>
        <div style={{ background: 'var(--panel-2)', borderRadius: '8px', padding: '12px 18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Employees</div>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>{sysId?.EmpCount ?? '—'}</div>
        </div>
      </div>

      {/* What this does */}
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', marginBottom: '20px', fontSize: '13px' }}>
        <strong>Process (YTAXCOMP.PRG):</strong>
        <ol style={{ marginTop: '6px', paddingLeft: '18px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <li>Re-index payroll history and timecard files</li>
          <li>For each employee: sum all year's gross income from history</li>
          <li>Apply annual tax table (exmp2007 / BIR table) to annual gross</li>
          <li>Compare annual tax vs. withheld-to-date to get tax due (or refund)</li>
          <li>Update employee records with year-end tax figures</li>
        </ol>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '14px', marginBottom: '20px', color: '#dc3545' }}>
          &#9888; {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ fontSize: '15px', padding: '10px 28px', marginBottom: '24px' }}
        onClick={() => setShowConfirm(true)}
        disabled={computing}
      >
        {computing ? 'Computing Year-End Tax...' : `Compute Year-End Tax for ${year}`}
      </button>

      {/* Results */}
      {result && (
        <div>
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '8px', padding: '14px', marginBottom: '16px', color: 'var(--success)' }}>
            &#10003; {result.message}
          </div>

          {/* Summary tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total Annual Gross', value: `₱${fmt(totalGross)}` },
              { label: 'Total Annual Tax', value: `₱${fmt(totalAnnualTax)}` },
              { label: 'Total Tax Withheld', value: `₱${fmt(totalWithheld)}` },
              { label: 'Net Tax Due', value: `₱${fmt(totalTaxDue)}`, highlight: totalTaxDue > 0 },
            ].map(t => (
              <div key={t.label} style={{ background: t.highlight ? 'rgba(220,53,69,0.06)' : 'var(--panel-2)', border: t.highlight ? '1px solid rgba(220,53,69,0.3)' : '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.label}</div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: t.highlight ? '#dc3545' : 'var(--text)' }}>{t.value}</div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Emp No.</th>
                  <th>Name</th>
                  <th style={{ textAlign: 'right' }}>Annual Gross</th>
                  <th style={{ textAlign: 'right' }}>Annual Tax</th>
                  <th style={{ textAlign: 'right' }}>Tax Withheld</th>
                  <th style={{ textAlign: 'right' }}>Tax Due</th>
                </tr>
              </thead>
              <tbody>
                {result.employees.map(emp => (
                  <tr key={emp.EmpNo} style={emp.TaxDue > 0 ? { background: 'rgba(220,53,69,0.04)' } : emp.TaxDue < 0 ? { background: 'rgba(22,163,74,0.04)' } : {}}>
                    <td style={{ fontFamily: 'monospace' }}>{emp.EmpNo}</td>
                    <td>{emp.Name}</td>
                    <td style={{ textAlign: 'right' }}>₱{fmt(emp.AnnualGross)}</td>
                    <td style={{ textAlign: 'right' }}>₱{fmt(emp.AnnualTax)}</td>
                    <td style={{ textAlign: 'right' }}>₱{fmt(emp.WithheldTax)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: emp.TaxDue > 0 ? '#dc3545' : emp.TaxDue < 0 ? 'var(--success)' : 'var(--text)' }}>
                      {emp.TaxDue < 0 ? `(₱${fmt(Math.abs(emp.TaxDue))})` : `₱${fmt(emp.TaxDue)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--panel-2)', fontWeight: '600' }}>
                  <td colSpan={2} style={{ textAlign: 'right' }}>Totals:</td>
                  <td style={{ textAlign: 'right' }}>₱{fmt(totalGross)}</td>
                  <td style={{ textAlign: 'right' }}>₱{fmt(totalAnnualTax)}</td>
                  <td style={{ textAlign: 'right' }}>₱{fmt(totalWithheld)}</td>
                  <td style={{ textAlign: 'right', color: totalTaxDue > 0 ? '#dc3545' : 'var(--success)' }}>₱{fmt(totalTaxDue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Negative values in "Tax Due" indicate a refund owed to the employee.</p>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ModalPortal onClick={() => setShowConfirm(false)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Compute Year-End Tax?</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
                This will compute <strong>year-end withholding tax</strong> for all employees for the year <strong>{year}</strong>.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                This operation reads all payroll history, applies the BIR annual tax table, and updates each employee's year-end tax record. This may take a moment.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCompute}>Proceed</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
