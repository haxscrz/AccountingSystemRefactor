import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'
import './TimecardEntry.css'

interface TimecardEntryProps {
  payrollType: 'regular' | 'casual' | null
}

interface Timecard {
  emp_no: string
  emp_nm: string
  dep_no: string
  period_year: number
  period_month: number
  
  // Earnings Fields (A-P: 16 input fields)
  reg_hrs: number      // A: Regular Hours
  abs_hrs: number      // B: Absent Hours
  rot_hrs: number      // C: Regular OT Hours
  sphp_hrs: number     // D: Special Holiday Hours
  spot_hrs: number     // E: Special Holiday OT Hours
  lghp_hrs: number     // F: Legal Holiday Hours
  lgot_hrs: number     // G: Legal Holiday OT Hours
  nsd_hrs: number      // H: Night Shift Differential Hours
  lv_hrs: number       // I: VL Days Used
  ls_hrs: number       // J: SL Days Used
  oth_pay1: number     // K: CTPA/SEA (Taxable Other Pay 1)
  oth_pay2: number     // L: Taxable Other Pay 2
  oth_pay3: number     // M: Non-Taxable Other Pay 1
  oth_pay4: number     // N: Non-Taxable Other Pay 2
  lv_cashout: number   // O: VL Days Encash
  ls_cashout: number   // P: SL Days Encash
  
  // Deduction Fields (Q-AE: 15 input fields)
  sln_ded: number      // Q: Salary Loan Deduction
  hdmf_ded: number     // R: HDMF Loan Deduction
  cal_ded: number      // S: SSS Calamity Loan Deduction
  comp_ded: number     // T: Company Loan Deduction
  comd_ded: number     // U: Company Deduction/Advances
  oth_ded1: number     // V: Other Deduction 1
  oth_ded2: number     // W: Other Deduction 2
  oth_ded3: number     // X: Other Deduction 3
  oth_ded4: number     // Y: Other Deduction 4
  oth_ded5: number     // Z: Other Deduction 5
  oth_ded6: number     // AA: Other Deduction 6
  oth_ded7: number     // AB: Other Deduction 7
  oth_ded8: number     // AC: Other Deduction 8
  oth_ded9: number     // AD: Other Deduction 9
  tax_add: number      // AE: Additional Tax
  
  // Special Flags (AF-AG: 2 fields)
  withbonus: boolean   // AF: Include in 13th Month (Y/N)
  bonus: number        // AG: 13th Month Amount (computed field for entry)
  
  // Computed Fields (Display Only)
  reg_pay: number
  rot_pay: number
  sphp_pay: number
  spot_pay: number
  lghp_pay: number
  lgot_pay: number
  nsd_pay: number
  lv_pay: number
  lv2_pay: number
  ls_pay: number
  grs_pay: number
  sss_ee: number
  sss_er: number
  med_ee: number
  med_er: number
  pgbg_ee: number
  pgbg_er: number
  ec_er: number
  tax_ee: number
  tot_ded: number
  net_pay: number
  bonustax: number
}

interface EmpLookup {
  emp_no: string
  emp_nm: string
  dep_no: string
  b_rate: number
}

const BLANK_TIMECARD = (emp_no: string, emp_nm: string, dep_no: string, year: number, month: number): Timecard => ({
  emp_no, emp_nm, dep_no, period_year: year, period_month: month,
  reg_hrs: 0, abs_hrs: 0, rot_hrs: 0, sphp_hrs: 0, spot_hrs: 0, lghp_hrs: 0,
  lgot_hrs: 0, nsd_hrs: 0, lv_hrs: 0, ls_hrs: 0, oth_pay1: 0, oth_pay2: 0,
  oth_pay3: 0, oth_pay4: 0, lv_cashout: 0, ls_cashout: 0, sln_ded: 0, hdmf_ded: 0,
  cal_ded: 0, comp_ded: 0, comd_ded: 0, oth_ded1: 0, oth_ded2: 0, oth_ded3: 0,
  oth_ded4: 0, oth_ded5: 0, oth_ded6: 0, oth_ded7: 0, oth_ded8: 0, oth_ded9: 0,
  tax_add: 0, withbonus: true, bonus: 0,
  reg_pay: 0, rot_pay: 0, sphp_pay: 0, spot_pay: 0, lghp_pay: 0, lgot_pay: 0,
  nsd_pay: 0, lv_pay: 0, lv2_pay: 0, ls_pay: 0, grs_pay: 0, sss_ee: 0, sss_er: 0,
  med_ee: 0, med_er: 0, pgbg_ee: 0, pgbg_er: 0, ec_er: 0, tax_ee: 0, tot_ded: 0,
  net_pay: 0, bonustax: 0
})

export default function TimecardEntry({ payrollType }: TimecardEntryProps) {
  const [timecards, setTimecards] = useState<Timecard[]>([])
  const [selectedTimecard, setSelectedTimecard] = useState<Timecard | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [isNewEntry, setIsNewEntry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  // Add New dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [employees, setEmployees] = useState<EmpLookup[]>([])
  const [empSearch, setEmpSearch] = useState('')
  const [loadingEmps, setLoadingEmps] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Timecard | null>(null)

  useEffect(() => {
    if (payrollType) {
      fetchTimecards()
    }
  }, [payrollType, currentPeriod])

  const fetchTimecards = async () => {
    try {
      const response = await fetch(
        `/api/payroll/timecards/${currentPeriod.year}/${currentPeriod.month}`
      )
      if (response.ok) {
        const data = await response.json()
        setTimecards(data)
      }
    } catch (error) {
      console.error('Failed to fetch timecards:', error)
    }
  }

  const fetchEmployees = async () => {
    setLoadingEmps(true)
    try {
      const res = await fetch('/api/payroll/employees/all')
      if (res.ok) {
        const data = await res.json()
        setEmployees(data)
      }
    } catch (e) {
      console.error('Failed to fetch employees:', e)
    } finally {
      setLoadingEmps(false)
    }
  }

  const handleOpenAddDialog = () => {
    setEmpSearch('')
    setShowAddDialog(true)
    if (employees.length === 0) fetchEmployees()
  }

  const handleSelectEmployee = (emp: EmpLookup) => {
    setShowAddDialog(false)
    const blank = BLANK_TIMECARD(emp.emp_no, emp.emp_nm, emp.dep_no ?? '', currentPeriod.year, currentPeriod.month)
    setSelectedTimecard(blank)
    setIsNewEntry(true)
    setShowEdit(true)
  }

  const handleDelete = async (tc: Timecard) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll/timecards/${tc.emp_no}/${tc.period_year}/${tc.period_month}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchTimecards()
        setDeleteConfirm(null)
      } else {
        const err = await res.json()
        alert(`Error: ${err.message}`)
      }
    } catch {
      alert('Failed to delete timecard.')
    } finally {
      setLoading(false)
    }
  }

  if (!payrollType) {
    return (
      <div className="card">
        <h2>Timecard Entry</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Please select a payroll type (Regular or Casual) from the Main Menu ribbon first.
        </div>
      </div>
    )
  }

  const handleEdit = (tc: Timecard) => {
    setSelectedTimecard({ ...tc })
    setIsNewEntry(false)
    setShowEdit(true)
  }

  const handleSave = async () => {
    if (!selectedTimecard) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/payroll/timecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTimecard)
      })

      if (response.ok) {
        await fetchTimecards()
        setShowEdit(false)
        setIsNewEntry(false)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to save timecard:', error)
      alert('Failed to save timecard. Please check server connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Add/Edit Timecard ({payrollType === 'regular' ? 'Regular' : 'Casual'} Employees)</h2>
          <p className="subtitle">33-field data entry: hours, amounts, and deductions (A&#8211;AG)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleOpenAddDialog}>
            + Add New Timecard
          </button>
          <label style={{ fontSize: '14px', fontWeight: '500' }}>Period:</label>
          <select
            className="form-input"
            style={{ width: '100px' }}
            value={currentPeriod.month}
            onChange={(e) => setCurrentPeriod({ ...currentPeriod, month: Number(e.target.value) })}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
            ))}
          </select>
          <select
            className="form-input"
            style={{ width: '100px' }}
            value={currentPeriod.year}
            onChange={(e) => setCurrentPeriod({ ...currentPeriod, year: Number(e.target.value) })}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {timecards.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128203;</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No timecards for this period</div>
          <div style={{ marginBottom: '20px' }}>
            {currentPeriod.month}/{currentPeriod.year} &#8212; Use <strong>Initialize Timecard</strong> to set up a new payroll period,
            or click <strong>+ Add New Timecard</strong> to add entries manually.
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddDialog}>+ Add New Timecard</button>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Emp No.</th>
              <th>Employee Name</th>
              <th>Dept</th>
              <th style={{ textAlign: 'right' }}>Reg Hrs</th>
              <th style={{ textAlign: 'right' }}>OT Hrs</th>
              <th style={{ textAlign: 'right' }}>Gross Pay</th>
              <th style={{ textAlign: 'right' }}>Total Ded</th>
              <th style={{ textAlign: 'right' }}>Net Pay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timecards.map(tc => (
              <tr key={tc.emp_no}>
                <td><strong>{tc.emp_no}</strong></td>
                <td>{tc.emp_nm}</td>
                <td>{tc.dep_no}</td>
                <td style={{ textAlign: 'right' }}>{Number(tc.reg_hrs).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{Number(tc.rot_hrs).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{Number(tc.grs_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>{Number(tc.tot_ded).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}><strong>{Number(tc.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                <td>
                  <span className={`badge ${(tc as any).trn_flag === 'P' ? 'badge-success' : (tc as any).trn_flag === 'X' ? 'badge-primary' : 'badge-warning'}`}>
                    {(tc as any).trn_flag === 'P' ? 'Computed' : (tc as any).trn_flag === 'X' ? 'Posted' : 'Pending'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleEdit(tc)}>
                    Edit
                  </button>
                  <button className="btn" style={{ padding: '4px 10px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setDeleteConfirm(tc)}>
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: '700', background: 'var(--background)' }}>
              <td colSpan={5} style={{ padding: '8px 12px' }}>TOTALS ({timecards.length} employees)</td>
              <td style={{ textAlign: 'right', padding: '8px 12px' }}>
                {timecards.reduce((s, t) => s + Number(t.grs_pay), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ textAlign: 'right', padding: '8px 12px' }}>
                {timecards.reduce((s, t) => s + Number(t.tot_ded), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ textAlign: 'right', padding: '8px 12px' }}>
                {timecards.reduce((s, t) => s + Number(t.net_pay), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      )}

      {showEdit && selectedTimecard && (
        <ModalPortal onClick={() => { setShowEdit(false); setIsNewEntry(false) }}>
          <div className="modal timecard-modal" style={{ maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {isNewEntry ? 'Add Timecard' : 'Edit Timecard'} &#8212; {selectedTimecard.emp_nm} ({selectedTimecard.emp_no})
              </h3>
              <button onClick={() => { setShowEdit(false); setIsNewEntry(false) }} className="modal-close">&times;</button>
            </div>

            <div className="timecard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* EARNINGS SECTION (Fields A-P) */}
              <div>
                <h4 style={{ marginBottom: '16px', padding: '8px', background: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                  EARNINGS (A-P)
                </h4>
                
                <div className="form-group">
                  <label className="form-label">A. Regular Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.reg_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, reg_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">B. Absent Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.abs_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, abs_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">C. Regular OT Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.rot_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, rot_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">D. Special Holiday Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.sphp_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, sphp_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">E. Special Holiday OT Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.spot_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, spot_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">F. Legal Holiday Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.lghp_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, lghp_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">G. Legal Holiday OT Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.lgot_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, lgot_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">H. Night Shift Differential Hours</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.nsd_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, nsd_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">I. VL Days Used</label>
                  <input type="number" step="0.5" className="form-input" value={selectedTimecard.lv_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, lv_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">J. SL Days Used</label>
                  <input type="number" step="0.5" className="form-input" value={selectedTimecard.ls_hrs} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, ls_hrs: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">K. CTPA/SEA (Taxable Other Pay 1)</label>
<input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_pay1} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_pay1: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">L. Taxable Other Pay 2</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_pay2} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_pay2: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">M. Non-Taxable Other Pay 1</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_pay3} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_pay3: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">N. Non-Taxable Other Pay 2</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_pay4} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_pay4: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">O. VL Days Encash</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.lv_cashout} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, lv_cashout: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">P. SL Days Encash</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.ls_cashout} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, ls_cashout: Number(e.target.value) })} />
                </div>
              </div>

              {/* DEDUCTIONS SECTION (Fields Q-AG) */}
              <div>
                <h4 style={{ marginBottom: '16px', padding: '8px', background: '#dc3545', color: 'white', borderRadius: '4px' }}>
                  DEDUCTIONS (Q-AE)
                </h4>
                
                <div className="form-group">
                  <label className="form-label">Q. Salary Loan Deduction</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.sln_ded} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, sln_ded: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">R. HDMF Loan Deduction</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.hdmf_ded} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, hdmf_ded: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">S. SSS Calamity Loan Deduction</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.cal_ded} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, cal_ded: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">T. Company Loan Deduction</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.comp_ded} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, comp_ded: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">U. Company Deduction/Advances</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.comd_ded} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, comd_ded: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">V. Other Deduction 1</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded1} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded1: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">W. Other Deduction 2</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded2} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded2: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">X. Other Deduction 3</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded3} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded3: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y. Other Deduction 4</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded4} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded4: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z. Other Deduction 5</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded5} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded5: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">AA. Other Deduction 6</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded6} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded6: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">AB. Other Deduction 7</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded7} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded7: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">AC. Other Deduction 8</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded8} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded8: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">AD. Other Deduction 9</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.oth_ded9} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, oth_ded9: Number(e.target.value) })} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">AE. Additional Tax</label>
                  <input type="number" step="0.01" className="form-input" value={selectedTimecard.tax_add} 
                    onChange={(e) => setSelectedTimecard({ ...selectedTimecard, tax_add: Number(e.target.value) })} />
                </div>

                {/* Special Flags (AF-AG) */}
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                  <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>SPECIAL FLAGS (AF-AG)</h5>
                  
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="withbonus"
                      checked={selectedTimecard.withbonus}
                      onChange={(e) => setSelectedTimecard({ ...selectedTimecard, withbonus: e.target.checked })}
                    />
                    <label htmlFor="withbonus" style={{ marginBottom: 0 }}>AF. Include in 13th Month Pay</label>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">AG. 13th Month Amount (manual entry)</label>
                    <input type="number" step="0.01" className="form-input" value={selectedTimecard.bonus} 
                      onChange={(e) => setSelectedTimecard({ ...selectedTimecard, bonus: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Computed Summary Section */}
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid var(--primary)' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Computed Summary (Read-Only - Updated after Compute)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Earnings:</div>
                  <div>Reg Pay: &#8369;{selectedTimecard.reg_pay.toFixed(2)}</div>
                  <div>OT Pay: &#8369;{selectedTimecard.rot_pay.toFixed(2)}</div>
                  <div>SPH Pay: &#8369;{selectedTimecard.sphp_pay.toFixed(2)}</div>
                  <div>SPOT Pay: &#8369;{selectedTimecard.spot_pay.toFixed(2)}</div>
                  <div>LH Pay: &#8369;{selectedTimecard.lghp_pay.toFixed(2)}</div>
                  <div>LHOT Pay: &#8369;{selectedTimecard.lgot_pay.toFixed(2)}</div>
                  <div>NSD Pay: &#8369;{selectedTimecard.nsd_pay.toFixed(2)}</div>
                  <div>VL Pay: &#8369;{selectedTimecard.lv_pay.toFixed(2)}</div>
                  <div>SL Pay: &#8369;{selectedTimecard.ls_pay.toFixed(2)}</div>
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Government:</div>
                  <div>SSS (EE): &#8369;{selectedTimecard.sss_ee.toFixed(2)}</div>
                  <div>SSS (ER): &#8369;{selectedTimecard.sss_er.toFixed(2)}</div>
                  <div>Medicare (EE): &#8369;{selectedTimecard.med_ee.toFixed(2)}</div>
                  <div>Medicare (ER): &#8369;{selectedTimecard.med_er.toFixed(2)}</div>
                  <div>Pag-IBIG (EE): &#8369;{selectedTimecard.pgbg_ee.toFixed(2)}</div>
                  <div>Pag-IBIG (ER): &#8369;{selectedTimecard.pgbg_er.toFixed(2)}</div>
                  <div>EC (ER): &#8369;{selectedTimecard.ec_er.toFixed(2)}</div>
                  <div>Tax: &#8369;{selectedTimecard.tax_ee.toFixed(2)}</div>
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Totals:</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--primary)', marginTop: '8px' }}>
                    Gross: &#8369;{selectedTimecard.grs_pay.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#dc3545', marginTop: '8px' }}>
                    Deductions: &#8369;{selectedTimecard.tot_ded.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)', marginTop: '12px' }}>
                    NET PAY: &#8369;{selectedTimecard.net_pay.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>13th Month:</div>
                  <div>Bonus: &#8369;{selectedTimecard.bonus.toFixed(2)}</div>
                  <div>Bonus Tax: &#8369;{selectedTimecard.bonustax.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => { setShowEdit(false); setIsNewEntry(false) }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : isNewEntry ? 'Add Timecard' : 'Save Changes'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Add New Timecard ─ Employee Picker Dialog ──────────────── */}
      {showAddDialog && (
        <ModalPortal onClick={() => setShowAddDialog(false)}>
          <div className="modal" style={{ maxWidth: '600px', width: '95%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Select Employee</h3>
              <button className="modal-close" onClick={() => setShowAddDialog(false)}>&times;</button>
            </div>

            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <input
                className="form-input"
                style={{ width: '100%' }}
                placeholder="Search by name or employee number..."
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingEmps ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading employees...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Emp No.</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter(e =>
                        !empSearch ||
                        e.emp_no.toLowerCase().includes(empSearch.toLowerCase()) ||
                        e.emp_nm.toLowerCase().includes(empSearch.toLowerCase())
                      )
                      .filter(e => {
                        // Exclude employees already in the current period
                        return !timecards.some(t => t.emp_no === e.emp_no)
                      })
                      .map(emp => (
                        <tr key={emp.emp_no} style={{ cursor: 'pointer' }} onClick={() => handleSelectEmployee(emp)}>
                          <td><strong>{emp.emp_no}</strong></td>
                          <td>{emp.emp_nm}</td>
                          <td>{emp.dep_no}</td>
                          <td>
                            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Delete Confirmation ──────────────────────────────────── */}
      {deleteConfirm && (
        <ModalPortal onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p>Delete timecard for <strong>{deleteConfirm.emp_nm} ({deleteConfirm.emp_no})</strong>?</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }} onClick={() => handleDelete(deleteConfirm)} disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
