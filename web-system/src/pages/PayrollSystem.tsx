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
    main: [
      {
        title: 'Payroll Type',
        items: [
          { label: 'Regular Employees', onClick: () => { setPayrollType('regular'); navigate('/payroll'); } },
          { label: 'Casual Employees', onClick: () => { setPayrollType('casual'); navigate('/payroll'); } }
        ]
      },
      {
        title: 'Timecard',
        items: [
          { label: 'Add/Edit Timecard', onClick: () => navigate('/payroll/timecard') },
          { label: 'Initialize Timecard', onClick: () => alert('Initialize Timecard') },
          { label: 'Append From Datafile', onClick: () => alert('Append Data') }
        ]
      },
      {
        title: 'Processing',
        items: [
          { label: 'Compute Payroll', onClick: () => navigate('/payroll/compute') },
          { label: 'Post Transactions', onClick: () => alert('Post Transactions') }
        ]
      },
      {
        title: 'Year-End',
        items: [
          { label: 'Compute 13th Month Pay', onClick: () => alert('13th Month') },
          { label: 'Compute Year-End Tax', onClick: () => alert('Year-End Tax') },
          { label: 'Enter OR/SBR Info (SSS)', onClick: () => alert('SSS OR/SBR') },
          { label: 'Enter OR/SBR Info (Pag-ibig)', onClick: () => alert('Pag-ibig OR/SBR') }
        ]
      }
    ],
    file: [
      {
        title: 'Reindex',
        items: [
          { label: 'Employee Master File', onClick: () => alert('Reindex Master') },
          { label: 'Timecard File', onClick: () => alert('Reindex Timecard') },
          { label: 'Department File', onClick: () => alert('Reindex Dept') },
          { label: 'Tax Code File', onClick: () => alert('Reindex Tax') },
          { label: 'All Files', onClick: () => alert('Reindex All') }
        ]
      },
      {
        title: 'Master Data',
        items: [
          { label: 'Employee Master File', onClick: () => navigate('/payroll/employees') },
          { label: 'Update Employee Rate', onClick: () => alert('Update Rate') },
          { label: 'Department File', onClick: () => alert('Departments') },
          { label: 'Tax Table File', onClick: () => alert('Tax Table') },
          { label: 'Systems ID', onClick: () => alert('System ID') }
        ]
      },
      {
        title: 'Administration',
        items: [
          { label: 'Initialize New Year', onClick: () => alert('New Year Init') },
          { label: 'Backup Databases', onClick: () => alert('Backup') },
          { label: 'Edit Database Path', onClick: () => alert('DB Path') }
        ]
      }
    ],
    query: [
      {
        title: 'Timecard',
        items: [
          { label: 'View Timecard', onClick: () => navigate('/payroll/timecard/view') },
          { label: 'Search Employees', onClick: () => alert('Search') }
        ]
      }
    ],
    report: [
      {
        title: 'Core Reports',
        items: [
          { label: 'Timecard Validation', onClick: () => navigate('/payroll/reports/timecard-validation') },
          { label: 'Payroll Register', onClick: () => navigate('/payroll/reports/register') },
          { label: 'Payroll Slips', onClick: () => navigate('/payroll/reports/payslips') },
          { label: 'Denomination Breakdown', onClick: () => navigate('/payroll/reports/denomination') }
        ]
      },
      {
        title: 'Monthly Reports',
        items: [
          { label: 'Monthly Payroll Recap', onClick: () => navigate('/payroll/reports/monthly-recap') },
          { label: 'SSS/PHIC/EC/Pag-ibig', onClick: () => navigate('/payroll/reports/monthly-contributions') },
          { label: 'Tax Withheld', onClick: () => navigate('/payroll/reports/monthly-tax') },
          { label: 'Dept Summary', onClick: () => navigate('/payroll/reports/dept-summary') },
          { label: 'Loan Deductions', onClick: () => navigate('/payroll/reports/loan-deductions') }
        ]
      },
      {
        title: 'Quarterly',
        items: [
          { label: 'Quarterly SSS/PHIC/EC', onClick: () => navigate('/payroll/reports/quarterly-sss') },
          { label: 'Quarterly Pag-ibig', onClick: () => navigate('/payroll/reports/quarterly-pbg') },
          { label: 'Quarterly Tax', onClick: () => navigate('/payroll/reports/quarterly-tax') },
          { label: 'PHIC Remittance', onClick: () => navigate('/payroll/reports/phic-remittance') }
        ]
      },
      {
        title: 'Year-End',
        items: [
          { label: 'Year-End Recap', onClick: () => navigate('/payroll/reports/yearly-recap') },
          { label: 'Bonus Reports', onClick: () => navigate('/payroll/reports/bonus') },
          { label: 'Tax Reconciliation', onClick: () => navigate('/payroll/reports/tax-recon') },
          { label: 'BIR Alpha List', onClick: () => navigate('/payroll/reports/alpha-list') },
          { label: 'BIR W2 Forms', onClick: () => navigate('/payroll/reports/w2') }
        ]
      },
      {
        title: 'Master Files',
        items: [
          { label: 'Employee Master List', onClick: () => navigate('/payroll/reports/employee-list') },
          { label: 'Personal Information', onClick: () => navigate('/payroll/reports/personal-info') },
          { label: 'Salary Rates', onClick: () => navigate('/payroll/reports/salary-rates') }
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
