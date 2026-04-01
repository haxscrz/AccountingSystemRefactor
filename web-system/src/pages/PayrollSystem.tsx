import { useEffect, useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { useCompanyStore } from '../stores/companyStore'

import AppShell from '../components/AppShell'
import PayrollTypeSelector from '../components/payroll/PayrollTypeSelector'
import PayrollDashboard from '../components/payroll/PayrollDashboard'
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
import BackupDatabases from '../components/payroll/BackupDatabases'
import EditEmployeeNumber from '../components/payroll/EditEmployeeNumber'
import TimecardQuery from '../components/payroll/TimecardQuery'

export default function PayrollSystem() {
  const navigate = useNavigate()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const [activeTab, setActiveTab] = useState('main')
  const [payrollType, setPayrollType] = useState<'regular' | 'casual' | null>(null)
  const [statusPeriod, setStatusPeriod] = useState('Oct 2023')

  // Fetch active period from system ID
  useEffect(() => {
    if (!payrollType) return
    const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    fetch('/api/payroll/system-id')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.PresMo && d.PresYr) {
          setStatusPeriod(`${MONTHS[d.PresMo] ?? d.PresMo} ${d.PresYr}`)
        } else {
          setStatusPeriod('Oct 2023')
        }
      })
      .catch(() => setStatusPeriod('Oct 2023'))
  }, [payrollType, selectedCompanyCode])

  const handleSelectType = (type: 'regular' | 'casual') => {
    setPayrollType(type)
    navigate('/payroll')
  }

  const shellTabs = [
    { id: 'main', label: 'Main' },
    { id: 'file', label: 'File' },
    { id: 'query', label: 'Query/Report' },
    { id: 'yearend', label: 'Year-End' },
  ]

  const shellGroups = {
    main: [
      {
        title: 'Payroll Dashboard',
        items: [
          { label: 'Dashboard', icon: 'dashboard', onClick: () => navigate('/payroll') },
        ]
      },
      {
        title: 'Process Timecard',
        items: [
          { label: 'Add/Edit Timecard', icon: 'edit_note', onClick: () => navigate('/payroll/timecard') },
          { label: 'Initialize Timecard', icon: 'restart_alt', onClick: () => navigate('/payroll/initialize') },
          { label: 'Append From Datafile', icon: 'upload_file', onClick: () => navigate('/payroll/append') },
        ]
      },
      {
        title: 'Compute / Post',
        items: [
          { label: 'Compute Payroll', icon: 'calculate', onClick: () => navigate('/payroll/compute') },
          { label: 'Post Transactions', icon: 'send', onClick: () => navigate('/payroll/post-transactions') },
        ]
      },
      {
        title: 'OR/SBR Info',
        items: [
          { label: 'SSS OR/SBR', icon: 'receipt_long', onClick: () => navigate('/payroll/or-sbr/sss') },
          { label: 'Pag-Ibig OR/SBR', icon: 'receipt_long', onClick: () => navigate('/payroll/or-sbr/pagibig') },
        ]
      },
    ],
    file: [
      {
        title: 'Master File Maintenance',
        items: [
          { label: 'Employee Master File', icon: 'person_search', onClick: () => navigate('/payroll/employees') },
          { label: 'Update Employee Rate', icon: 'price_change', onClick: () => navigate('/payroll/update-rate') },
          { label: 'Edit Tax Table', icon: 'table_chart', onClick: () => navigate('/payroll/tax-table') },
          { label: 'Edit Systems ID', icon: 'settings', onClick: () => navigate('/payroll/system-id') },
          { label: 'SSS Loan from Disk', icon: 'upload', onClick: () => navigate('/payroll/sss-loan-disk') },
          { label: 'PhilHealth from Disk', icon: 'upload_file', onClick: () => navigate('/payroll/philhealth-disk') },
        ]
      },
      {
        title: 'Administration',
        items: [
          { label: 'Initialize New Year', icon: 'celebration', onClick: () => navigate('/payroll/initialize-new-year') },
          { label: 'Backup Databases', icon: 'save', onClick: () => navigate('/payroll/backup') },
          { label: 'Edit Employee Number', icon: 'tag', onClick: () => navigate('/payroll/edit-employee-number') },
          { label: 'Add/Edit Department', icon: 'corporate_fare', onClick: () => navigate('/payroll/departments') },
        ]
      },
    ],
    query: [
      {
        title: 'Timecard Query',
        items: [
          { label: 'View/Query Timecard', icon: 'search', onClick: () => navigate('/payroll/timecard/view') },
        ]
      },
      {
        title: 'Reports',
        items: [
          { label: 'Timecard Validation', icon: 'fact_check', onClick: () => navigate('/payroll/reports/timecard-validation') },
          { label: 'Payroll Register', icon: 'article', onClick: () => navigate('/payroll/reports/register') },
          { label: 'Payroll Slip', icon: 'receipt', onClick: () => navigate('/payroll/reports/payslip') },
          { label: 'Denomination Breakdown', icon: 'payments', onClick: () => navigate('/payroll/reports/denomination') },
          { label: 'Deductions Report', icon: 'remove_circle_outline', onClick: () => navigate('/payroll/reports/deductions') },
          { label: 'Monthly Reports', icon: 'calendar_month', onClick: () => navigate('/payroll/reports/monthly') },
          { label: 'Quarterly Reports', icon: 'bar_chart', onClick: () => navigate('/payroll/reports/quarterly') },
          { label: 'Qtrly SSS Ln (SSS Form)', icon: 'description', onClick: () => navigate('/payroll/reports/quarterly-sss-form') },
          { label: 'Year-End Payroll Recap', icon: 'summarize', onClick: () => navigate('/payroll/reports/yearly-recap') },
          { label: 'Employee Master File', icon: 'person', onClick: () => navigate('/payroll/reports/employee-master') },
          { label: 'Bonus', icon: 'redeem', onClick: () => navigate('/payroll/reports/bonus') },
          { label: 'Year-End Tax/Refund', icon: 'request_quote', onClick: () => navigate('/payroll/reports/year-end-tax') },
          { label: 'Premium Payment Certif.', icon: 'verified', onClick: () => navigate('/payroll/reports/premium-cert') },
          { label: 'R3 Project Reports', icon: 'folder_special', onClick: () => navigate('/payroll/reports/r3-project') },
          { label: 'Set Printer Font', icon: 'print', disabled: true, onClick: () => {} },
        ]
      },
    ],
    yearend: [
      {
        title: 'Year-End Processing',
        items: [
          { label: 'Compute 13th Month Pay', icon: 'event_available', onClick: () => navigate('/payroll/13th-month') },
          { label: 'Compute Year-End Tax', icon: 'account_balance', onClick: () => navigate('/payroll/yearend-tax') },
          { label: 'Year-End Payroll Recap', icon: 'summarize', onClick: () => navigate('/payroll/reports/yearly-recap') },
          { label: 'Year-End Tax/Refund', icon: 'request_quote', onClick: () => navigate('/payroll/reports/year-end-tax') },
          { label: 'Qtrly SSS Ln (SSS Form)', icon: 'description', onClick: () => navigate('/payroll/reports/quarterly-sss-form') },
        ]
      },
    ],
  }

  // ── When no type selected: show full AppShell with type selector as content ──
  return (
    <>
    <AppShell
      moduleName="PAYROLL"
      breadcrumbSegments={[
        { label: selectedCompanyCode || 'Company', path: '/select-company', icon: 'domain' },
        { label: 'Payroll' }
      ]}
      companyCode={selectedCompanyCode}
      statusPeriod={statusPeriod}
      tabs={shellTabs}
      groups={shellGroups}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenSettings={() => navigate('/admin-settings')}
    >
      <Routes>
        <Route
          path="/"
          element={
            !payrollType
              ? <PayrollTypeSelector onSelect={handleSelectType} />
              : <PayrollDashboard
                  payrollType={payrollType}
                  statusPeriod={statusPeriod}
                  onSwitchType={() => { setPayrollType(null); navigate('/payroll') }}
                />
          }
        />
        <Route path="/timecard" element={<TimecardEntry payrollType={payrollType} />} />
        <Route path="/timecard/view" element={<TimecardQuery />} />
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
        <Route path="/update-rate" element={<UpdateEmployeeRate />} />
        <Route path="/initialize-new-year" element={<InitializeNewYear />} />
        <Route path="/backup" element={<BackupDatabases />} />
        <Route path="/edit-employee-number" element={<EditEmployeeNumber />} />
        <Route path="/sss-loan-disk" element={<SssLoanDiskStub />} />
        <Route path="/philhealth-disk" element={<PhilhealthDiskStub />} />
        <Route path="/reports/r3-project" element={<PayrollReports />} />
      </Routes>
    </AppShell>
    </>
  )
}

// ── Inline stubs for legacy PRG features not yet fully implemented ──

function SssLoanDiskStub() {
  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-lg flex flex-col gap-6">
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-2">MASTER FILE MAINTENANCE / SSS LOAN FROM DISK</div>
        <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">SSS Loan from Disk</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Import SSS loan deduction data from a disk file (SSLNDISK). This feature reads the SSS-provided data file and updates employee loan balances accordingly.
        </p>
      </div>
      <div className="px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] mr-2 align-middle">info</span>
        Upload functionality requires the SSS-formatted data file. Contact your system administrator for the correct file format.
      </div>
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-surface-container border border-outline-variant/30 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors" disabled>
          <span className="material-symbols-outlined text-[16px] mr-1 align-middle">upload</span>
          Upload File (Coming Soon)
        </button>
      </div>
    </div>
  )
}

function PhilhealthDiskStub() {
  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-lg flex flex-col gap-6">
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-2">MASTER FILE MAINTENANCE / PHILHEALTH FROM DISK</div>
        <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">PhilHealth from Disk</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Import PhilHealth premium payment data from a disk file (PHILHELT). This feature reads the PhilHealth-provided data file and updates employee premium records accordingly.
        </p>
      </div>
      <div className="px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] mr-2 align-middle">info</span>
        Upload functionality requires the PhilHealth-formatted data file. Contact your system administrator for the correct file format.
      </div>
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-surface-container border border-outline-variant/30 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors" disabled>
          <span className="material-symbols-outlined text-[16px] mr-1 align-middle">upload_file</span>
          Upload File (Coming Soon)
        </button>
      </div>
    </div>
  )
}
