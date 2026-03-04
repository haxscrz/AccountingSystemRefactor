import { useEffect, useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import RibbonNav from '../components/RibbonNav'
import PayrollMainMenu from '../components/payroll/PayrollMainMenu'
import TimecardEntry from '../components/payroll/TimecardEntry'
import PayrollCompute from '../components/payroll/PayrollCompute'
import EmployeeMaster from '../components/payroll/EmployeeMaster'
import PayrollReports from '../components/payroll/PayrollReports'
import './PayrollSystem.css'

export default function PayrollSystem() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('main')
  const [payrollType, setPayrollType] = useState<'regular' | 'casual' | null>(null)
  const [isCompactHeader, setIsCompactHeader] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsCompactHeader(window.scrollY > 40)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
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
    main: [
      {
        title: 'Select Payroll Type',
        items: [
          { label: 'Regular Employees', onClick: () => { setPayrollType('regular'); navigate('/payroll'); } },
          { label: 'Casual Employees',  onClick: () => { setPayrollType('casual');  navigate('/payroll'); } }
        ]
      },
      {
        title: 'Process Timecard',
        items: [
          { label: 'Add/Edit Timecard',     onClick: () => navigate('/payroll/timecard') },
          { label: 'Initialize Timecard',   onClick: () => alert('Initialize Timecard') },
          { label: 'Append From Datafile',  onClick: () => alert('Append From Datafile') }
        ]
      },
      {
        title: 'Compute / Post',
        items: [
          { label: 'Compute Payroll',   onClick: () => navigate('/payroll/compute') },
          { label: 'Post Transactions', onClick: () => alert('Post Transactions') }
        ]
      },
      {
        title: 'Enter OR/SBR Info',
        items: [
          { label: 'SSS OR/SBR',     onClick: () => alert('Enter OR/SBR Info – SSS') },
          { label: 'Pag-Ibig OR/SBR', onClick: () => alert('Enter OR/SBR Info – Pag-Ibig') }
        ]
      },
      {
        title: 'Year-End Processing',
        items: [
          { label: 'Compute 13th Month Pay', onClick: () => alert('Compute 13th Month Pay') },
          { label: 'Compute Year-End Tax',   onClick: () => alert('Compute Year-End Tax') }
        ]
      }
    ],

    // ── FILE MAINTENANCE ───────────────────────────────────────────────────────
    // Mirrors PAY.PRG m_main=2 block exactly (items 1–11).
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
          { label: 'Update Employee Rate',      onClick: () => alert('Update Employee Rate') },
          { label: 'Edit Department File',      onClick: () => alert('Edit Department File') },
          { label: 'Edit Tax Table File',       onClick: () => alert('Edit Tax Table File') },
          { label: 'Edit Systems ID',           onClick: () => alert('Edit Systems ID') }
        ]
      },
      {
        title: 'Administration',
        items: [
          { label: 'Initialize For a New Year', onClick: () => alert('Initialize For a New Year') },
          { label: 'Backup Databases',          onClick: () => alert('Backup Databases') },
          { label: 'Edit Database Path',        onClick: () => alert('Edit Database Path') },
          { label: 'Edit Employee Number',      onClick: () => alert('Edit Employee Number') },
          { label: 'Add/Edit Department',       onClick: () => alert('Add/Edit Department') }
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
    // Mirrors PAY.PRG m_main=4 items 1–14 exactly.
    report: [
      {
        // Items 1–5 in original
        title: 'Core Reports',
        items: [
          { label: 'Timecard Validation',   onClick: () => navigate('/payroll/reports/timecard-validation') },
          { label: 'Payroll Register',      onClick: () => navigate('/payroll/reports/register') },
          { label: 'Payroll Slips',         onClick: () => navigate('/payroll/reports/payslips') },
          { label: 'Denomination Breakdown', onClick: () => navigate('/payroll/reports/denomination') },
          { label: 'Deductions Report',     onClick: () => navigate('/payroll/reports/deductions') }
        ]
      },
      {
        // Payroll Slip sub-options (item 3 sub-menu)
        title: 'Payroll Slip Options',
        items: [
          { label: 'All Pay Slips w/ Summary', onClick: () => navigate('/payroll/reports/payslips?mode=all') },
          { label: 'Selected Pay Slips',       onClick: () => navigate('/payroll/reports/payslips?mode=selected') },
          { label: 'Pay Slip Summary Only',    onClick: () => navigate('/payroll/reports/payslips?mode=summary') },
          { label: 'ATM Payroll Summary',      onClick: () => navigate('/payroll/reports/payslips?mode=atm') }
        ]
      },
      {
        // Item 6 sub-menu (14 sub-items in original)
        title: 'Monthly Reports',
        items: [
          { label: 'Monthly Payroll Recap',          onClick: () => navigate('/payroll/reports/monthly-recap') },
          { label: 'Monthly SSS/PHIC/EC/PGBG/Tax',   onClick: () => navigate('/payroll/reports/monthly-all') },
          { label: 'Monthly SSS/PHIC/EC/PGBG',       onClick: () => navigate('/payroll/reports/monthly-pbg') },
          { label: 'Monthly SSS, PHIC & EC',         onClick: () => navigate('/payroll/reports/monthly-sss') },
          { label: 'Monthly SSS & EC',               onClick: () => navigate('/payroll/reports/monthly-sss-ec') },
          { label: 'Monthly Philhealth',             onClick: () => navigate('/payroll/reports/monthly-phic') },
          { label: 'Monthly Pag-Ibig',               onClick: () => navigate('/payroll/reports/monthly-pagibig') },
          { label: 'Monthly Tax Withheld',           onClick: () => navigate('/payroll/reports/monthly-tax') },
          { label: 'Monthly Dept. Summary',          onClick: () => navigate('/payroll/reports/dept-summary') },
          { label: 'Monthly Loan Deduction Summary', onClick: () => navigate('/payroll/reports/loan-deductions') },
          { label: 'SSS-LMS Diskette Project',       onClick: () => alert('SSS-LMS Diskette Project') },
          { label: 'SSS R-3 Tape Diskette Project',  onClick: () => alert('SSS R-3 Tape Diskette Project') },
          { label: 'HDMF Loan Diskette Project',     onClick: () => alert('HDMF Loan Diskette Project') },
          { label: 'Philhealth Regular RF-1',        onClick: () => navigate('/payroll/reports/phic-rf1') }
        ]
      },
      {
        // Item 7 sub-menu (7 sub-items in original) + item 8 (top-level quarterly SSS loan)
        title: 'Quarterly Reports',
        items: [
          { label: 'Quarterly SSS, PHIC & EC',          onClick: () => navigate('/payroll/reports/quarterly-sss') },
          { label: 'Quarterly Pag-Ibig Premium',        onClick: () => navigate('/payroll/reports/quarterly-pbg') },
          { label: 'Quarterly Withholding Tax',         onClick: () => navigate('/payroll/reports/quarterly-tax') },
          { label: 'Quarterly SSS Loan Payments',       onClick: () => navigate('/payroll/reports/quarterly-sss-loan') },
          { label: 'Quarterly Pag-Ibig Loan Payments',  onClick: () => navigate('/payroll/reports/quarterly-pbg-loan') },
          { label: 'PHIC Remittance (Hard Copy)',        onClick: () => navigate('/payroll/reports/phic-remittance') },
          { label: 'PHIC Remittance (Diskette)',         onClick: () => alert('PHIC Quarterly Remittance Diskette') },
          { label: 'Qtrly SSS Loan – SSS Form',         onClick: () => navigate('/payroll/reports/quarterly-sss-form') }
        ]
      },
      {
        // Item 9
        title: 'Year-End Recap',
        items: [
          { label: 'Year-End Payroll Recap', onClick: () => navigate('/payroll/reports/yearly-recap') }
        ]
      },
      {
        // Item 10 sub-menu (5 sub-items in original)
        title: 'Employee Master File',
        items: [
          { label: 'Employee Master List',    onClick: () => navigate('/payroll/reports/employee-list') },
          { label: 'Personal Information',    onClick: () => navigate('/payroll/reports/personal-info') },
          { label: 'Employee Salary Rate',    onClick: () => navigate('/payroll/reports/salary-rates') },
          { label: 'Employee Loan Balance',   onClick: () => navigate('/payroll/reports/loan-balance') },
          { label: 'Employee VL/SL Balance',  onClick: () => navigate('/payroll/reports/vl-sl-balance') }
        ]
      },
      {
        // Item 11 sub-menu (7 sub-items in original)
        title: 'Bonus Reports',
        items: [
          { label: 'Advance Bonus P.Slip/Sheet',  onClick: () => navigate('/payroll/reports/bonus-advance') },
          { label: 'Bonus Pay Sheet',             onClick: () => navigate('/payroll/reports/bonus-sheet') },
          { label: 'Bonus ATM Summary',           onClick: () => navigate('/payroll/reports/bonus-atm') },
          { label: 'All Bonus Slips w/ Summary',  onClick: () => navigate('/payroll/reports/bonus-slips?mode=all') },
          { label: 'Selected Bonus Slips',        onClick: () => navigate('/payroll/reports/bonus-slips?mode=selected') },
          { label: 'Bonus Slip Summary Only',     onClick: () => navigate('/payroll/reports/bonus-slips?mode=summary') },
          { label: 'Bonus Denomination Breakdown', onClick: () => navigate('/payroll/reports/bonus-denomination') }
        ]
      },
      {
        // Item 12 sub-menu (9 sub-items in original)
        title: 'Year-End Tax / Refund',
        items: [
          { label: "Tax Recon – Taxable Income",      onClick: () => navigate('/payroll/reports/tax-recon?type=taxable') },
          { label: "Tax Recon – Non-Taxable Income",  onClick: () => navigate('/payroll/reports/tax-recon?type=nontaxable') },
          { label: 'Tax Refund Report',               onClick: () => navigate('/payroll/reports/tax-refund') },
          { label: 'Tax Refund Den. Breakdown',       onClick: () => navigate('/payroll/reports/tax-refund-den') },
          { label: 'Tax Refund Slip',                 onClick: () => navigate('/payroll/reports/tax-refund-slip') },
          { label: 'BIR Tax Withheld Report',         onClick: () => navigate('/payroll/reports/bir-tax-withheld') },
          { label: 'Individual BIR W2 Form',          onClick: () => navigate('/payroll/reports/w2') },
          { label: 'Alpha List',                      onClick: () => navigate('/payroll/reports/alpha-list') },
          { label: 'Form 1604CF – Schedule 7.3',      onClick: () => navigate('/payroll/reports/1604cf-73') },
          { label: 'Form 1604CF – Schedule 7.1',      onClick: () => navigate('/payroll/reports/1604cf-71') }
        ]
      },
      {
        // Item 13 sub-menu (4 sub-items in original)
        title: 'Premium Payment Certification',
        items: [
          { label: 'SSS Premium Certification',      onClick: () => navigate('/payroll/reports/premium-cert?type=sss') },
          { label: 'Medicare Premium Certification', onClick: () => navigate('/payroll/reports/premium-cert?type=med') },
          { label: 'Pag-Ibig Premium Certification', onClick: () => navigate('/payroll/reports/premium-cert?type=pbg') },
          { label: 'All Premiums Certification',     onClick: () => navigate('/payroll/reports/premium-cert?type=all') }
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
            ← Back to Dashboard
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
          <Route path="/" element={<PayrollMainMenu onSelectType={setPayrollType} />} />
          <Route path="/timecard" element={<TimecardEntry payrollType={payrollType} />} />
          <Route path="/timecard/view" element={<div className="card"><h3>Timecard Query</h3></div>} />
          <Route path="/compute" element={<PayrollCompute />} />
          <Route path="/employees" element={<EmployeeMaster />} />
          <Route path="/reports/:reportType" element={<PayrollReports />} />
        </Routes>
      </div>

      <div className="status-bar">
        <span>PAY System | Company: CTSI | Period: February 2026 | Type: {payrollType || 'Not Selected'}</span>
        <span>{user?.username}</span>
      </div>
    </div>
  )
}
