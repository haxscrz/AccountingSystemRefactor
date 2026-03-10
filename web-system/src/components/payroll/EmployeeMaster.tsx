import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface Employee {
  // Basic Info (Screen 1)
  emp_no: string
  emp_nm: string
  dep_no: string
  position: string
  b_rate: number
  cola: number
  emp_stat: string // R=Regular, C=Casual, F=Confidential, E=Executive
  status: string // A=Active, R=Resigned, L=On Leave
  date_hire: string
  date_resign: string
  
  // Government IDs (Screen 1)
  sss_no: string
  tin_no: string
  phic_no: string
  pgbg_no: string
  sss_member: boolean
  pgbg: boolean
  
  // Salary Loan (Screen 1)
  sln_bal: number
  sln_amt: number
  sln_term: number
  sln_date: string
  
  // HDMF Loan (Screen 1)
  hdmf_bal: number
  hdmf_amt: number
  hdmf_term: number
  hdmf_date: string
  
  // SSS Calamity Loan (Screen 1)
  cal_bal: number
  cal_amt: number
  cal_term: number
  cal_date: string
  
  // Company Loan (Screen 1)
  comp_bal: number
  comp_amt: number
  comp_term: number
  comp_date: string
  
  // Company Deduction Loan (Screen 1)
  comd_bal: number
  comd_amt: number
  comd_term: number
  comd_date: string
  
  // Leave Credits (Screen 1)
  sick_leave: number
  vacation_leave: number
  
  // Monthly Counters (Screen 2) - Display only
  m_basic: number
  m_cola: number
  m_hol: number
  m_ot: number
  m_leave: number
  m_gross: number
  m_ssee: number
  m_sser: number
  m_medee: number
  m_meder: number
  m_pgee: number
  m_pger: number
  m_ecer: number
  m_tax: number
  m_othp1: number
  m_othp2: number
  m_othp3: number
  m_othp4: number
  m_netpay: number
  
  // Quarterly Counters (Screen 3) - Display only
  q1_gross: number
  q1_ssee: number
  q1_medee: number
  q1_pgee: number
  q1_tax: number
  q2_gross: number
  q2_ssee: number
  q2_medee: number
  q2_pgee: number
  q2_tax: number
  q3_gross: number
  q3_ssee: number
  q3_medee: number
  q3_pgee: number
  q3_tax: number
  
  // Yearly Counters (Screen 4) - Display only
  y_basic: number
  y_cola: number
  y_hol: number
  y_ot: number
  y_leave: number
  y_gross: number
  y_ssee: number
  y_sser: number
  y_medee: number
  y_meder: number
  y_pgee: number
  y_pger: number
  y_ecer: number
  y_tax: number
  y_othp1: number
  y_othp2: number
  y_othp3: number
  y_othp4: number
  y_bonus: number
  y_btax: number
  y_netpay: number
  
  // Personal Info (Screen 5)
  spouse: string
  address: string
  birthdate: string
}

const emptyEmployee: Employee = {
  emp_no: '', emp_nm: '', dep_no: '', position: '', b_rate: 0, cola: 0,
  emp_stat: 'R', status: 'A', date_hire: '', date_resign: '',
  sss_no: '', tin_no: '', phic_no: '', pgbg_no: '',
  sss_member: true, pgbg: false,
  sln_bal: 0, sln_amt: 0, sln_term: 0, sln_date: '',
  hdmf_bal: 0, hdmf_amt: 0, hdmf_term: 0, hdmf_date: '',
  cal_bal: 0, cal_amt: 0, cal_term: 0, cal_date: '',
  comp_bal: 0, comp_amt: 0, comp_term: 0, comp_date: '',
  comd_bal: 0, comd_amt: 0, comd_term: 0, comd_date: '',
  sick_leave: 0, vacation_leave: 0,
  m_basic: 0, m_cola: 0, m_hol: 0, m_ot: 0, m_leave: 0, m_gross: 0,
  m_ssee: 0, m_sser: 0, m_medee: 0, m_meder: 0, m_pgee: 0, m_pger: 0, m_ecer: 0,
  m_tax: 0, m_othp1: 0, m_othp2: 0, m_othp3: 0, m_othp4: 0, m_netpay: 0,
  q1_gross: 0, q1_ssee: 0, q1_medee: 0, q1_pgee: 0, q1_tax: 0,
  q2_gross: 0, q2_ssee: 0, q2_medee: 0, q2_pgee: 0, q2_tax: 0,
  q3_gross: 0, q3_ssee: 0, q3_medee: 0, q3_pgee: 0, q3_tax: 0,
  y_basic: 0, y_cola: 0, y_hol: 0, y_ot: 0, y_leave: 0, y_gross: 0,
  y_ssee: 0, y_sser: 0, y_medee: 0, y_meder: 0, y_pgee: 0, y_pger: 0, y_ecer: 0,
  y_tax: 0, y_othp1: 0, y_othp2: 0, y_othp3: 0, y_othp4: 0,
  y_bonus: 0, y_btax: 0, y_netpay: 0,
  spouse: '', address: '', birthdate: ''
}

export default function EmployeeMaster() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [activeScreen, setActiveScreen] = useState(1) // 1-5 for 5 screens
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [modalMsg, setModalMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/payroll/employees/all')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const handleAdd = () => {
    setEditingEmp({ ...emptyEmployee })
    setActiveScreen(1)
    setModalMsg(null)
    setShowModal(true)
  }

  const handleEdit = (emp: Employee) => {
    setEditingEmp({ ...emp })
    setActiveScreen(1)
    setModalMsg(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editingEmp) return
    
    setLoading(true)
    setModalMsg(null)
    try {
      const isNew = !employees.find(e => e.emp_no === editingEmp.emp_no)
      const url = isNew 
        ? '/api/payroll/employees'
        : `/api/payroll/employees/${editingEmp.emp_no}`
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEmp)
      })

      if (response.ok) {
        await fetchEmployees()
        setShowModal(false)
        setEditingEmp(null)
        setMsg({ text: isNew ? 'Employee created successfully.' : 'Employee updated successfully.', ok: true })
      } else {
        const error = await response.json()
        setModalMsg({ text: error.message || 'Save failed.', ok: false })
      }
    } catch (error) {
      console.error('Failed to save employee:', error)
      setModalMsg({ text: 'Failed to save employee. Please check server connection.', ok: false })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return
    const empNo = deleteTarget
    setDeleteTarget(null)
    try {
      const response = await fetch(`/api/payroll/employees/${empNo}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEmployees()
        setMsg({ text: `Employee ${empNo} deleted.`, ok: true })
      } else {
        const error = await response.json()
        setMsg({ text: error.message || 'Delete failed.', ok: false })
      }
    } catch (error) {
      console.error('Failed to delete employee:', error)
      setMsg({ text: 'Failed to delete employee.', ok: false })
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Employee Master File - MASTEDIT</h2>
          <p className="subtitle">Comprehensive employee records with 5-screen data entry</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Employee
        </button>
      </div>

      {msg && (
        <div style={{ padding: '8px 12px', borderRadius: 4, marginBottom: 12,
          background: msg.ok ? 'rgba(46,160,67,0.15)' : 'rgba(220,53,53,0.15)',
          border: `1px solid ${msg.ok ? 'var(--success)' : '#dc3545'}`,
          color: msg.ok ? 'var(--success)' : '#dc3545', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', padding: '0 4px' }}>&times;</button>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Emp No.</th>
            <th>Employee Name</th>
            <th>Dept</th>
            <th>Position</th>
            <th style={{ textAlign: 'right' }}>Basic Rate</th>
            <th style={{ textAlign: 'right' }}>COLA</th>
            <th>Hire Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.emp_no}>
              <td><strong>{emp.emp_no}</strong></td>
              <td>{emp.emp_nm}</td>
              <td>{emp.dep_no}</td>
              <td>{emp.position}</td>
              <td style={{ textAlign: 'right' }}>&#8369; {emp.b_rate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}>&#8369; {emp.cola.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
              <td>{emp.date_hire}</td>
              <td><span className="badge badge-success">{emp.status === 'A' ? 'Active' : emp.status === 'R' ? 'Resigned' : 'On Leave'}</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px', marginRight: '4px' }} onClick={() => handleEdit(emp)}>
                  Edit
                </button>
                <button className="btn" style={{ padding: '4px 12px', fontSize: '12px', background: '#dc3545', color: 'white' }} onClick={() => setDeleteTarget(emp.emp_no)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && editingEmp && (
        <ModalPortal onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEmp.emp_no ? `Edit Employee - ${editingEmp.emp_no}` : 'Add Employee'}
              </h3>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>

            {/* 5-Screen Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
              {[
                { num: 1, label: 'Basic Info & Loans' },
                { num: 2, label: 'Monthly Counters' },
                { num: 3, label: 'Quarterly Counters' },
                { num: 4, label: 'Yearly Counters' },
                { num: 5, label: 'Personal Info' }
              ].map(screen => (
                <button
                  key={screen.num}
                  onClick={() => setActiveScreen(screen.num)}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: activeScreen === screen.num ? 'var(--primary)' : 'transparent',
                    color: activeScreen === screen.num ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: activeScreen === screen.num ? '600' : '400',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.2s'
                  }}
                >
                  {screen.num}. {screen.label}
                </button>
              ))}
            </div>

            {/* Screen 1: Basic Info & Loans */}
            {activeScreen === 1 && (
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Screen 1: Basic Information & Loan Details</h4>
                
                {/* Employee Number & Name */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employee Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingEmp.emp_no}
                      onChange={(e) => setEditingEmp({ ...editingEmp, emp_no: e.target.value })}
                      maxLength={20}
                      disabled={!!employees.find(e => e.emp_no === editingEmp.emp_no)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Employee Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingEmp.emp_nm}
                      onChange={(e) => setEditingEmp({ ...editingEmp, emp_nm: e.target.value })}
                      maxLength={160}
                    />
                  </div>
                </div>

                {/* Department, Position, Rate, COLA */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dept No.</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingEmp.dep_no}
                      onChange={(e) => setEditingEmp({ ...editingEmp, dep_no: e.target.value })}
                      maxLength={30}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingEmp.position}
                      onChange={(e) => setEditingEmp({ ...editingEmp, position: e.target.value })}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Basic Rate *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editingEmp.b_rate}
                      onChange={(e) => setEditingEmp({ ...editingEmp, b_rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">COLA per Hour</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editingEmp.cola}
                      onChange={(e) => setEditingEmp({ ...editingEmp, cola: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Government IDs */}
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                  <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Government IDs</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">SSS Number (99-9999999-9)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingEmp.sss_no}
                        onChange={(e) => setEditingEmp({ ...editingEmp, sss_no: e.target.value })}
                        maxLength={30}
                        placeholder="12-3456789-0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">TIN (999-999-999)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingEmp.tin_no}
                        onChange={(e) => setEditingEmp({ ...editingEmp, tin_no: e.target.value })}
                        maxLength={30}
                        placeholder="123-456-789"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">PHIC Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingEmp.phic_no}
                        onChange={(e) => setEditingEmp({ ...editingEmp, phic_no: e.target.value })}
                        maxLength={30}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAG-IBIG Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingEmp.pgbg_no}
                        onChange={(e) => setEditingEmp({ ...editingEmp, pgbg_no: e.target.value })}
                        maxLength={30}
                      />
                    </div>
                  </div>
                </div>

                {/* Employee Type & Status */}
                <div className="form-row" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Employee Type</label>
                    <select
                      className="form-input"
                      value={editingEmp.emp_stat}
                      onChange={(e) => setEditingEmp({ ...editingEmp, emp_stat: e.target.value })}
                    >
                      <option value="R">R - Regular</option>
                      <option value="C">C - Casual</option>
                      <option value="F">F - Confidential</option>
                      <option value="E">E - Executive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employment Status</label>
                    <select
                      className="form-input"
                      value={editingEmp.status}
                      onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value })}
                    >
                      <option value="A">A - Active</option>
                      <option value="R">R - Resigned</option>
                      <option value="L">L - On Leave</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date Hired</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingEmp.date_hire}
                      onChange={(e) => setEditingEmp({ ...editingEmp, date_hire: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date Resigned</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingEmp.date_resign}
                      onChange={(e) => setEditingEmp({ ...editingEmp, date_resign: e.target.value })}
                    />
                  </div>
                </div>

                {/* Membership Flags */}
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="sss_member"
                      checked={editingEmp.sss_member}
                      onChange={(e) => setEditingEmp({ ...editingEmp, sss_member: e.target.checked })}
                    />
                    <label htmlFor="sss_member" style={{ marginBottom: 0 }}>SSS Member</label>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="pgbg_member"
                      checked={editingEmp.pgbg}
                      onChange={(e) => setEditingEmp({ ...editingEmp, pgbg: e.target.checked })}
                    />
                    <label htmlFor="pgbg_member" style={{ marginBottom: 0 }}>PAG-IBIG Member</label>
                  </div>
                </div>

                {/* Leave Credits */}
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                  <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Leave Credits</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Vacation Leave Credits</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-input"
                        value={editingEmp.vacation_leave}
                        onChange={(e) => setEditingEmp({ ...editingEmp, vacation_leave: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sick Leave Credits</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-input"
                        value={editingEmp.sick_leave}
                        onChange={(e) => setEditingEmp({ ...editingEmp, sick_leave: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* 5 Loan Types */}
                <div style={{ marginTop: '16px' }}>
                  <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Loan Balances</h5>
                  
                  {/* Salary Loan */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                    <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>1. Salary Loan</h6>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.sln_amt} onChange={(e) => setEditingEmp({ ...editingEmp, sln_amt: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Balance</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.sln_bal} onChange={(e) => setEditingEmp({ ...editingEmp, sln_bal: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Term (months)</label>
                        <input type="number" className="form-input" value={editingEmp.sln_term} onChange={(e) => setEditingEmp({ ...editingEmp, sln_term: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Loan Date</label>
                        <input type="date" className="form-input" value={editingEmp.sln_date} onChange={(e) => setEditingEmp({ ...editingEmp, sln_date: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* SSS Calamity Loan */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                    <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>2. SSS Calamity Loan</h6>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.cal_amt} onChange={(e) => setEditingEmp({ ...editingEmp, cal_amt: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Balance</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.cal_bal} onChange={(e) => setEditingEmp({ ...editingEmp, cal_bal: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Term (months)</label>
                        <input type="number" className="form-input" value={editingEmp.cal_term} onChange={(e) => setEditingEmp({ ...editingEmp, cal_term: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Loan Date</label>
                        <input type="date" className="form-input" value={editingEmp.cal_date} onChange={(e) => setEditingEmp({ ...editingEmp, cal_date: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* HDMF Loan */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                    <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>3. HDMF/Pag-IBIG Loan</h6>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.hdmf_amt} onChange={(e) => setEditingEmp({ ...editingEmp, hdmf_amt: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Balance</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.hdmf_bal} onChange={(e) => setEditingEmp({ ...editingEmp, hdmf_bal: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Term (months)</label>
                        <input type="number" className="form-input" value={editingEmp.hdmf_term} onChange={(e) => setEditingEmp({ ...editingEmp, hdmf_term: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Loan Date</label>
                        <input type="date" className="form-input" value={editingEmp.hdmf_date} onChange={(e) => setEditingEmp({ ...editingEmp, hdmf_date: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Company Loan */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                    <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>4. Company Loan</h6>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.comp_amt} onChange={(e) => setEditingEmp({ ...editingEmp, comp_amt: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Balance</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.comp_bal} onChange={(e) => setEditingEmp({ ...editingEmp, comp_bal: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Term (months)</label>
                        <input type="number" className="form-input" value={editingEmp.comp_term} onChange={(e) => setEditingEmp({ ...editingEmp, comp_term: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Loan Date</label>
                        <input type="date" className="form-input" value={editingEmp.comp_date} onChange={(e) => setEditingEmp({ ...editingEmp, comp_date: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Company Deduction Loan */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                    <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>5. Company Deduction/Advances</h6>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.comd_amt} onChange={(e) => setEditingEmp({ ...editingEmp, comd_amt: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Balance</label>
                        <input type="number" step="0.01" className="form-input" value={editingEmp.comd_bal} onChange={(e) => setEditingEmp({ ...editingEmp, comd_bal: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Term (months)</label>
                        <input type="number" className="form-input" value={editingEmp.comd_term} onChange={(e) => setEditingEmp({ ...editingEmp, comd_term: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Loan Date</label>
                        <input type="date" className="form-input" value={editingEmp.comd_date} onChange={(e) => setEditingEmp({ ...editingEmp, comd_date: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2: Monthly Counters (Display Only) */}
            {activeScreen === 2 && (
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Screen 2: Monthly Counters (Display Only)</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  These values are automatically updated when payroll is posted
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Basic Pay</label>
                    <input type="text" className="form-input" value={editingEmp.m_basic.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">COLA</label>
                    <input type="text" className="form-input" value={editingEmp.m_cola.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Holiday</label>
                    <input type="text" className="form-input" value={editingEmp.m_hol.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overtime</label>
                    <input type="text" className="form-input" value={editingEmp.m_ot.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Leave</label>
                    <input type="text" className="form-input" value={editingEmp.m_leave.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gross Pay</label>
                    <input type="text" className="form-input" value={editingEmp.m_gross.toFixed(2)} readOnly style={{ background: '#f5f5f5', fontWeight: '600' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SSS EE</label>
                    <input type="text" className="form-input" value={editingEmp.m_ssee.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SSS ER</label>
                    <input type="text" className="form-input" value={editingEmp.m_sser.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medicare EE</label>
                    <input type="text" className="form-input" value={editingEmp.m_medee.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medicare ER</label>
                    <input type="text" className="form-input" value={editingEmp.m_meder.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pag-IBIG EE</label>
                    <input type="text" className="form-input" value={editingEmp.m_pgee.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pag-IBIG ER</label>
                    <input type="text" className="form-input" value={editingEmp.m_pger.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">EC</label>
                    <input type="text" className="form-input" value={editingEmp.m_ecer.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax</label>
                    <input type="text" className="form-input" value={editingEmp.m_tax.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 1</label>
                    <input type="text" className="form-input" value={editingEmp.m_othp1.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 2</label>
                    <input type="text" className="form-input" value={editingEmp.m_othp2.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 3</label>
                    <input type="text" className="form-input" value={editingEmp.m_othp3.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 4</label>
                    <input type="text" className="form-input" value={editingEmp.m_othp4.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Net Pay</label>
                    <input type="text" className="form-input" value={editingEmp.m_netpay.toFixed(2)} readOnly style={{ background: '#f5f5f5', fontWeight: '600' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Screen 3: Quarterly Counters (Display Only) */}
            {activeScreen === 3 && (
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Screen 3: Quarterly Counters (Display Only)</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Quarterly aggregations updated during month-end posting
                </p>

                <table className="data-table" style={{ marginTop: '16px' }}>
                  <thead>
                    <tr>
                      <th>Counter</th>
                      <th style={{ textAlign: 'right' }}>Q1</th>
                      <th style={{ textAlign: 'right' }}>Q2</th>
                      <th style={{ textAlign: 'right' }}>Q3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Gross Income</strong></td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q1_gross.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q2_gross.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q3_gross.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>SSS (EE)</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q1_ssee.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q2_ssee.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q3_ssee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Medicare (EE)</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q1_medee.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q2_medee.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q3_medee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Pag-IBIG (EE)</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q1_pgee.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q2_pgee.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{editingEmp.q3_pgee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td><strong>Tax Withheld</strong></td>
                      <td style={{ textAlign: 'right' }}><strong>{editingEmp.q1_tax.toFixed(2)}</strong></td>
                      <td style={{ textAlign: 'right' }}><strong>{editingEmp.q2_tax.toFixed(2)}</strong></td>
                      <td style={{ textAlign: 'right' }}><strong>{editingEmp.q3_tax.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Screen 4: Yearly Counters (Display Only) */}
            {activeScreen === 4 && (
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Screen 4: Yearly Counters (Display Only)</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Year-to-date totals for annual reporting
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Basic Pay</label>
                    <input type="text" className="form-input" value={editingEmp.y_basic.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">COLA</label>
                    <input type="text" className="form-input" value={editingEmp.y_cola.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Holiday</label>
                    <input type="text" className="form-input" value={editingEmp.y_hol.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overtime</label>
                    <input type="text" className="form-input" value={editingEmp.y_ot.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Leave</label>
                    <input type="text" className="form-input" value={editingEmp.y_leave.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gross Pay</label>
                    <input type="text" className="form-input" value={editingEmp.y_gross.toFixed(2)} readOnly style={{ background: '#f5f5f5', fontWeight: '600' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SSS EE</label>
                    <input type="text" className="form-input" value={editingEmp.y_ssee.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SSS ER</label>
                    <input type="text" className="form-input" value={editingEmp.y_sser.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medicare EE</label>
                    <input type="text" className="form-input" value={editingEmp.y_medee.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medicare ER</label>
                    <input type="text" className="form-input" value={editingEmp.y_meder.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pag-IBIG EE</label>
                    <input type="text" className="form-input" value={editingEmp.y_pgee.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pag-IBIG ER</label>
                    <input type="text" className="form-input" value={editingEmp.y_pger.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">EC</label>
                    <input type="text" className="form-input" value={editingEmp.y_ecer.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax</label>
                    <input type="text" className="form-input" value={editingEmp.y_tax.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 1</label>
                    <input type="text" className="form-input" value={editingEmp.y_othp1.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 2</label>
                    <input type="text" className="form-input" value={editingEmp.y_othp2.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 3</label>
                    <input type="text" className="form-input" value={editingEmp.y_othp3.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Pay 4</label>
                    <input type="text" className="form-input" value={editingEmp.y_othp4.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">13th Month Bonus</label>
                    <input type="text" className="form-input" value={editingEmp.y_bonus.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bonus Tax</label>
                    <input type="text" className="form-input" value={editingEmp.y_btax.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Net Pay</label>
                    <input type="text" className="form-input" value={editingEmp.y_netpay.toFixed(2)} readOnly style={{ background: '#f5f5f5', fontWeight: '600' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Screen 5: Personal Information */}
            {activeScreen === 5 && (
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Screen 5: Personal Information</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Spouse Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingEmp.spouse}
                      onChange={(e) => setEditingEmp({ ...editingEmp, spouse: e.target.value })}
                      maxLength={160}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingEmp.birthdate}
                      onChange={(e) => setEditingEmp({ ...editingEmp, birthdate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingEmp.address}
                    onChange={(e) => setEditingEmp({ ...editingEmp, address: e.target.value })}
                    maxLength={300}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {modalMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 4, marginTop: 16,
                background: modalMsg.ok ? 'rgba(46,160,67,0.15)' : 'rgba(220,53,53,0.15)',
                border: `1px solid ${modalMsg.ok ? 'var(--success)' : '#dc3545'}`,
                color: modalMsg.ok ? 'var(--success)' : '#dc3545', fontSize: 13 }}>
                {modalMsg.text}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeScreen > 1 && (
                  <button className="btn btn-secondary" onClick={() => setActiveScreen(activeScreen - 1)}>
                    &larr; Previous Screen
                  </button>
                )}
                {activeScreen < 5 && (
                  <button className="btn btn-secondary" onClick={() => setActiveScreen(activeScreen + 1)}>
                    Next Screen &rarr;
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ModalPortal onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Employee?</h3>
              <button onClick={() => setDeleteTarget(null)} className="modal-close">&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Permanently delete employee <strong style={{ color: 'var(--text)' }}>{deleteTarget}</strong>? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn" onClick={handleDeleteConfirmed}
                  style={{ background: 'rgba(220,53,53,0.2)', color: '#dc3545', border: '1px solid #dc3545' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
