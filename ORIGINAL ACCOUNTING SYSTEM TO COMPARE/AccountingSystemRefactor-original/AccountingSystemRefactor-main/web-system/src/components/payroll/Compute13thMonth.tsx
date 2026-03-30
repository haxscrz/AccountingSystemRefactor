import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface SysIdInfo {
  PAYYear: number
  EmpCount: number
}

interface BonusResult {
  message: string
  processed: number
  employees: Array<{
    EmpNo: string
    Name: string
    EmpType: string
    BonusAmt: number
    Taxable: boolean
  }>
}

export default function Compute13thMonth() {
  const [sysId, setSysId] = useState<SysIdInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [result, setResult] = useState<BonusResult | null>(null)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Config matching BONSCOMP.PRG defaults
  const [bonDays, setBonDays] = useState(22)
  const [taxThreshold, setTaxThreshold] = useState(90000)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/system-id')
      if (res.ok) setSysId(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleCompute = async () => {
    setShowConfirm(false)
    setComputing(true)
    setError('')
    setResult(null)
    try {
      const params = new URLSearchParams({
        bonusDays: String(bonDays),
        taxThreshold: String(taxThreshold)
      })
      const res = await fetch(`/api/payroll/compute-13th-month?${params}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.error || data.message || 'Computation failed.')
    } catch {
      setError('Network error — could not reach server.')
    } finally {
      setComputing(false)
    }
  }

  const totalBonus = result?.employees.reduce((s, e) => s + e.BonusAmt, 0) ?? 0

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h2>Compute 13th Month Pay</h2>
      <p className="subtitle">
        Calculates 13th month pay for all employees. Equivalent to BONSCOMP.PRG.<br />
        <strong>Regular:</strong> b_rate × bon_days &nbsp;|&nbsp; <strong>Casual:</strong> y_basic ÷ 12
      </p>

      {/* Config panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Bonus Days (bon_days)</label>
          <input
            type="number"
            min="1"
            max="31"
            value={bonDays}
            onChange={e => setBonDays(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>Used for Regular employees</div>
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Tax-Free Threshold (₱)</label>
          <input
            type="number"
            step="1000"
            min="0"
            value={taxThreshold}
            onChange={e => setTaxThreshold(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>13th month above this is taxable</div>
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Employees', value: sysId?.EmpCount ?? '—' },
          { label: 'Year', value: sysId?.PAYYear ?? '—' },
          { label: 'Formula (Regular)', value: `b_rate × ${bonDays}` },
          { label: 'Formula (Casual)', value: 'y_basic ÷ 12' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--panel-2)', borderRadius: '8px', padding: '12px 18px', minWidth: '130px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.value}</div>
          </div>
        ))}
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
        {computing ? 'Computing...' : 'Compute 13th Month Pay'}
      </button>

      {/* Results */}
      {result && (
        <div>
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '8px', padding: '14px', marginBottom: '16px', color: 'var(--success)' }}>
            &#10003; {result.message} — {result.processed} employees processed.
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Emp No.</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>13th Month Pay</th>
                  <th>Taxable?</th>
                </tr>
              </thead>
              <tbody>
                {result.employees.map(emp => (
                  <tr key={emp.EmpNo}>
                    <td style={{ fontFamily: 'monospace' }}>{emp.EmpNo}</td>
                    <td>{emp.Name}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: emp.EmpType === 'R' ? 'rgba(37,99,235,0.12)' : 'rgba(217,119,6,0.12)', color: emp.EmpType === 'R' ? '#2563eb' : '#d97706' }}>
                        {emp.EmpType === 'R' ? 'Regular' : 'Casual'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>₱{emp.BonusAmt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: emp.Taxable ? '#dc3545' : 'var(--success)', fontWeight: '600', fontSize: '12px' }}>{emp.Taxable ? 'YES' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--panel-2)', fontWeight: '600' }}>
                  <td colSpan={3} style={{ textAlign: 'right' }}>Total:</td>
                  <td style={{ textAlign: 'right' }}>₱{totalBonus.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ModalPortal onClick={() => setShowConfirm(false)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Compute 13th Month Pay?</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px', fontSize: '14px' }}>
                This will compute 13th month pay for all <strong>{sysId?.EmpCount}</strong> employees for year <strong>{sysId?.PAYYear}</strong>.
              </p>
              <ul style={{ fontSize: '13px', paddingLeft: '18px', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                <li>Bonus Days: <strong>{bonDays}</strong> (Regular employees)</li>
                <li>Casual: annual basic ÷ 12</li>
                <li>Tax-free threshold: <strong>₱{taxThreshold.toLocaleString()}</strong></li>
              </ul>
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
