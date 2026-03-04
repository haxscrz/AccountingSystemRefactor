﻿import { useState, useEffect } from 'react'
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

export default function TimecardEntry({ payrollType }: TimecardEntryProps) {
  const [timecards, setTimecards] = useState<Timecard[]>([])
  const [selectedTimecard, setSelectedTimecard] = useState<Timecard | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

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

  if (!payrollType) {
    return (
      <div className="card">
        <h2>Timecard Entry - EDITTIME</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Please select a payroll type (Regular or Casual) from the Main Menu ribbon first.
        </div>
      </div>
    )
  }

  const handleEdit = (tc: Timecard) => {
    setSelectedTimecard({ ...tc })
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
        alert('Timecard saved successfully!')
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
          <h2>Timecard Entry - EDITTIME ({payrollType === 'regular' ? 'Regular' : 'Casual'} Employees)</h2>
          <p className="subtitle">33-field data entry with hours, amounts, and deductions (A-AG)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {timecards.map(tc => (
            <tr key={tc.emp_no}>
              <td><strong>{tc.emp_no}</strong></td>
              <td>{tc.emp_nm}</td>
              <td>{tc.dep_no}</td>
              <td style={{ textAlign: 'right' }}>{tc.reg_hrs.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{tc.rot_hrs.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{tc.grs_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}>{tc.tot_ded.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}><strong>{tc.net_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleEdit(tc)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEdit && selectedTimecard && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal timecard-modal" style={{ maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Timecard - {selectedTimecard.emp_nm} ({selectedTimecard.emp_no})</h3>
              <button onClick={() => setShowEdit(false)} className="modal-close">—</button>
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
                  <div>Reg Pay: â‚±{selectedTimecard.reg_pay.toFixed(2)}</div>
                  <div>OT Pay: â‚±{selectedTimecard.rot_pay.toFixed(2)}</div>
                  <div>SPH Pay: â‚±{selectedTimecard.sphp_pay.toFixed(2)}</div>
                  <div>SPOT Pay: â‚±{selectedTimecard.spot_pay.toFixed(2)}</div>
                  <div>LH Pay: â‚±{selectedTimecard.lghp_pay.toFixed(2)}</div>
                  <div>LHOT Pay: â‚±{selectedTimecard.lgot_pay.toFixed(2)}</div>
                  <div>NSD Pay: â‚±{selectedTimecard.nsd_pay.toFixed(2)}</div>
                  <div>VL Pay: â‚±{selectedTimecard.lv_pay.toFixed(2)}</div>
                  <div>SL Pay: â‚±{selectedTimecard.ls_pay.toFixed(2)}</div>
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Government:</div>
                  <div>SSS (EE): â‚±{selectedTimecard.sss_ee.toFixed(2)}</div>
                  <div>SSS (ER): â‚±{selectedTimecard.sss_er.toFixed(2)}</div>
                  <div>Medicare (EE): â‚±{selectedTimecard.med_ee.toFixed(2)}</div>
                  <div>Medicare (ER): â‚±{selectedTimecard.med_er.toFixed(2)}</div>
                  <div>Pag-IBIG (EE): â‚±{selectedTimecard.pgbg_ee.toFixed(2)}</div>
                  <div>Pag-IBIG (ER): â‚±{selectedTimecard.pgbg_er.toFixed(2)}</div>
                  <div>EC (ER): â‚±{selectedTimecard.ec_er.toFixed(2)}</div>
                  <div>Tax: â‚±{selectedTimecard.tax_ee.toFixed(2)}</div>
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Totals:</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--primary)', marginTop: '8px' }}>
                    Gross: â‚±{selectedTimecard.grs_pay.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#dc3545', marginTop: '8px' }}>
                    Deductions: â‚±{selectedTimecard.tot_ded.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)', marginTop: '12px' }}>
                    NET PAY: â‚±{selectedTimecard.net_pay.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>13th Month:</div>
                  <div>Bonus: â‚±{selectedTimecard.bonus.toFixed(2)}</div>
                  <div>Bonus Tax: â‚±{selectedTimecard.bonustax.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Timecard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
