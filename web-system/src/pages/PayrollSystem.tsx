import { useEffect, useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import RibbonNav from '../components/RibbonNav'
import PayrollMainMenu from '../components/payroll/PayrollMainMenu'
import PayrollTypeSelector from '../components/payroll/PayrollTypeSelector'
import TimecardEntry from '../components/payroll/TimecardEntry'
import PayrollCompute from '../components/payroll/PayrollCompute'
import EmployeeMaster from '../components/payroll/EmployeeMaster'
import PayrollReports from '../components/payroll/PayrollReports'
import InitializeTimecard from '../components/payroll/InitializeTimecard'
import AppendFromDatafile from '../components/payroll/AppendFromDatafile'
import PostTransactions from '../components/payroll/PostTransactions'
import OrSbrEntry from '../components/payroll/OrSbrEntry'
import Compute13thMonth from '../components/payroll/Compute13thMonth'
import ComputeYearEndTax from '../components/payroll/ComputeYearEndTax'
import SystemIdEdit from '../components/payroll/SystemIdEdit'
import TaxTableEdit from '../components/payroll/TaxTableEdit'
import DepartmentEdit from '../components/payroll/DepartmentEdit'
import UpdateEmployeeRate from '../components/payroll/UpdateEmployeeRate'
import InitializeNewYear from '../components/payroll/InitializeNewYear'
import './PayrollSystem.css'

export default function PayrollSystem() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('main')
  const [payrollType, setPayrollType] = useState<'regular' | 'casual' | null>(null)
  const [isCompactHeader, setIsCompactHeader] = useState(false)
  const [statusPeriod, setStatusPeriod] = useState('Loading...')

  useEffect(() => {
    const onScroll = () => {
      setIsCompactHeader(window.scrollY > 40)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Refresh status bar period whenever payrollType is chosen or page loads
  useEffect(() => {
    if (!payrollType) return
    const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    fetch('/api/payroll/system-id')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setStatusPeriod(`${MONTHS[d.PresMo] ?? d.PresMo} ${d.PresYr}`)
      })
      .catch(() => setStatusPeriod('—'))
  }, [payrollType])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSelectType = (type: 'regular' | 'casual') => {
    setPayrollType(type)
    navigate('/payroll')
  }

  // ── No type selected: show full-screen selector before the ribbon ──
  if (!payrollType) {
    return (
      <div className="payroll-container">
        <header className={`topbar ${isCompactHeader ? 'topbar-compact' : ''}`}>
          <div className="brand">
            <div className="brand-mark-small"></div>
            <div>
              <h1>PAY Payroll System</h1>
              <p>Payroll Processing Module</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              &larr; Back to Dashboard
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </header>
        <PayrollTypeSelector onSelect={handleSelectType} />
      </div>
    )
  }

  const ribbonTabs = [
    { id: 'main', label: 'Main Menu' },
    { id: 'file', label: 'File Maintenance' },
    { id: 'query', label: 'Query' },
    { id: 'report', label: 'Report Generation' }
  ]

  const ribbonGroups = {
    // ── MAIN MENU ──────────────────────────────────────────────────────────────
    // Mirrors PAY.PRG m_main=1 block exactly.
    // Type selection is now handled at entry (PayrollTypeSelector).
    main: [
      {
        title: 'Process Timecard',
        items: [
          { label: 'Add/Edit Timecard',     onClick: () => navigate('/payroll/timecard') },
          { label: 'Initialize Timecard',   onClick: () => navigate('/payroll/initialize') },
          { label: 'Append From Datafile',  onClick: () => navigate('/payroll/append') }
        ]
      },
      {
        title: 'Compute / Post',
        items: [
          { label: 'Compute Payroll',   onClick: () => navigate('/payroll/compute') },
          { label: 'Post Transactions', onClick: () => navigate('/payroll/post-transactions') }
        ]
      },
      {
        title: 'Enter OR/SBR Info',
        items: [
          { label: 'SSS OR/SBR',     onClick: () => navigate('/payroll/or-sbr/sss') },
          { label: 'Pag-Ibig OR/SBR', onClick: () => navigate('/payroll/or-sbr/pagibig') }
        ]
      },
      {
        title: 'Year-End Processing',
        items: [
          { label: 'Compute 13th Month Pay', onClick: () => navigate('/payroll/13th-month') },
          { label: 'Compute Year-End Tax',   onClick: () => navigate('/payroll/yearend-tax') }
        ]
      }
    ],

    // ── FILE MAINTENANCE ───────────────────────────────────────────────────────
    // Mirrors PAY.PRG m_main=2 block exactly (items 1-1).
    file: [
      {
        title: 'Reindex Corrupted Files',
        items: [
          { label: 'Employee Master File',    onClick: () => alert('Reindex Employee Master File') },
          { label: 'Timecard File',           onClick: () => alert('Reindex Timecard File') },
          { label: 'Department File',         onClick: () => alert('Reindex Department File') },
          { label: 'Tax Code File',           onClick: () => alert('Reindex Tax Code File') },
          { label: 'Certification File',      onClick: () => alert('Reindex Certification File (premmast/prempaid)') },
          { label: 'Reindex All Files',       onClick: () => alert('Reindex All Files') }
        ]
      },
      {
        title: 'Master File Maintenance',
        items: [
          { label: 'Edit Employee Master File', onClick: () => navigate('/payroll/employees') },
          { label: 'Update Employee Rate',      onClick: () => navigate('/payroll/update-rate') },
          { label: 'Edit Department File',      onClick: () => navigate('/payroll/dept-file') },
          { label: 'Edit Tax Table File',       onClick: () => navigate('/payroll/tax-table') },
          { label: 'Edit Systems ID',           onClick: () => navigate('/payroll/system-id') }
        ]
      },
      {
        title: 'Administration',
        items: [
          { label: 'Initialize For a New Year', onClick: () => navigate('/payroll/initialize-new-year') },
          { label: 'Backup Databases',          onClick: () => alert('Backup Databases') },
          { label: 'Edit Database Path',        onClick: () => alert('Edit Database Path') },
          { label: 'Edit Employee Number',      onClick: () => alert('Edit Employee Number') },
          { label: 'Add/Edit Department',       onClick: () => navigate('/payroll/departments') }
        ]
      }
    ],

    // ── QUERY ──────────────────────────────────────────────────────────────────
    // PAY.PRG m_main=3: single call to quertime (view timecard on-screen).
    query: [
      {
        title: 'Timecard Query',
        items: [
          { label: 'View/Query Timecard', onClick: () => navigate('/payroll/timecard/view') }
        ]
      }
    ],

    // ── REPORT GENERATION ─────────────────────────────────────────────────────
    // Exactly 14 top-level items as shown in the original program.
    // Items with sub-menus navigate to a report page that renders the sub-options.
    report: [
      {
        title: 'Reports',
        items: [
          { label: 'Timecard Validation',    onClick: () => navigate('/payroll/reports/timecard-validation') },
          { label: 'Payroll Register',       onClick: () => navigate('/payroll/reports/register') },
          { label: 'Payroll Slip',           onClick: () => navigate('/payroll/reports/payslip') },
          { label: 'Denomination Breakdown', onClick: () => navigate('/payroll/reports/denomination') },
          { label: 'Deductions Report',      onClick: () => navigate('/payroll/reports/deductions') },
          { label: 'Monthly Reports',        onClick: () => navigate('/payroll/reports/monthly') },
          { label: 'Quarterly Reports',      onClick: () => navigate('/payroll/reports/quarterly') },
          { label: 'Qtrly SSS Ln (SSS Form)', onClick: () => navigate('/payroll/reports/quarterly-sss-form') },
          { label: 'Year-End Payroll Recap', onClick: () => navigate('/payroll/reports/yearly-recap') },
          { label: 'Employee Master File',   onClick: () => navigate('/payroll/reports/employee-master') },
          { label: 'Bonus',                  onClick: () => navigate('/payroll/reports/bonus') },
          { label: 'Year-End Tax/Refund',    onClick: () => navigate('/payroll/reports/year-end-tax') },
          { label: 'Premium Payment Certif', onClick: () => navigate('/payroll/reports/premium-cert') },
          { label: 'Set Printer Font',       onClick: () => alert('Set Printer Font') }
        ]
      }
    ]
  }

  return (
    <div className="payroll-container">
      <header className={`topbar ${isCompactHeader ? 'topbar-compact' : ''}`}>
        <div className="brand">
          <div className="brand-mark-small"></div>
          <div>
            <h1>PAY Payroll System</h1>
            <p>Payroll Processing Module {payrollType && `(${payrollType.toUpperCase()})`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            &larr; Back to Dashboard
          </button>
          <button
            onClick={() => setPayrollType(null)}
            className="btn btn-secondary"
            title="Change payroll type"
          >
            Switch Type
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <RibbonNav 
        tabs={ribbonTabs}
        groups={ribbonGroups}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="main-content">
        <Routes>
          <Route path="/" element={<PayrollMainMenu payrollType={payrollType} />} />
          <Route path="/timecard" element={<TimecardEntry payrollType={payrollType} />} />
          <Route path="/timecard/view" element={<div className="card"><h3>Timecard Query</h3></div>} />
          <Route path="/compute" element={<PayrollCompute />} />
          <Route path="/employees" element={<EmployeeMaster />} />
          <Route path="/reports/:reportType" element={<PayrollReports />} />
          <Route path="/initialize" element={<InitializeTimecard />} />
          <Route path="/append" element={<AppendFromDatafile />} />
          <Route path="/post-transactions" element={<PostTransactions />} />
          <Route path="/or-sbr/sss" element={<OrSbrEntry type="sss" />} />
          <Route path="/or-sbr/pagibig" element={<OrSbrEntry type="pagibig" />} />
          <Route path="/13th-month" element={<Compute13thMonth />} />
          <Route path="/yearend-tax" element={<ComputeYearEndTax />} />
          <Route path="/system-id" element={<SystemIdEdit />} />
          <Route path="/tax-table" element={<TaxTableEdit />} />
          <Route path="/departments" element={<DepartmentEdit />} />
          <Route path="/dept-file" element={<DepartmentEdit />} />
          <Route path="/update-rate" element={<UpdateEmployeeRate />} />
          <Route path="/initialize-new-year" element={<InitializeNewYear />} />
        </Routes>
      </div>

      <div className="status-bar">
        <span>PAY System | Company: CTSI | Period: {statusPeriod} | {payrollType === 'regular' ? 'Regular Employees' : 'Casual Employees'}</span>
        <span>{user?.username}</span>
      </div>
    </div>
  )
}
