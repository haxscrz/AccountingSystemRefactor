import { useEffect, useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { getCompanyNameByCode } from '../config/companies'
import RibbonNav from '../components/RibbonNav'
import CompanyBadge from '../components/CompanyBadge'
import FSMainMenu from '../components/fs/FSMainMenu'
import FSVoucherEntry from '../components/fs/FSVoucherEntry'
import FSJournalEntry from '../components/fs/FSJournalEntry'
import FSChartOfAccounts from '../components/fs/FSChartOfAccounts'
import FSReports from '../components/fs/FSReports'
import FSPosting from '../components/fs/FSPosting'
import FSMonthEnd from '../components/fs/FSMonthEnd'
import FSGroupCodes from '../components/fs/FSGroupCodes'
import FSSubsidiaryGroups from '../components/fs/FSSubsidiaryGroups'
import FSQueryBrowser from '../components/fs/FSQueryBrowser'
import FSAuditLogs from '../components/fs/FSAuditLogs'
import './FSSystem.css'

export default function FSSystem() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const [activeTab, setActiveTab] = useState('main')
  const [isCompactHeader, setIsCompactHeader] = useState(false)
  const selectedCompanyName = getCompanyNameByCode(selectedCompanyCode)

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

  const handleBackup = async () => {
    try {
      const resp = await fetch('/api/fs/backup')
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`)
      const blob = await resp.blob()
      const now = new Date()
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `accounting_backup_${stamp}.db`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`)
    }
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
        title: 'Data Entry',
        items: [
          { label: 'Cash Disbursement', onClick: () => navigate('/fs/voucher') },
          { label: 'Cash Receipts', onClick: () => navigate('/fs/journal/receipt') },
          { label: 'Sales Book Journals', onClick: () => navigate('/fs/journal/sales') },
          { label: 'Journal Vouchers', onClick: () => navigate('/fs/journal/general') },
          { label: 'Purchase Book Journals', onClick: () => navigate('/fs/journal/purchase') },
          { label: 'Adjustments', onClick: () => navigate('/fs/journal/adjustment') }
        ]
      },
      {
        title: 'Processing',
        items: [
          { label: 'Post All Transactions', onClick: () => navigate('/fs/posting') },
          { label: 'Enter Advance CDB', onClick: () => navigate('/fs/voucher/advance') }
        ]
      }
    ],
    file: [
      {
        title: 'Master Files',
        items: [
          { label: 'Chart of Accounts', onClick: () => navigate('/fs/chart-of-accounts') },
          { label: 'Group Codes', onClick: () => navigate('/fs/group-codes') },
          { label: 'Subsidiary Groups', onClick: () => navigate('/fs/subsidiary-groups') }
        ]
      },
      {
        title: 'Administration',
        items: [
          { label: 'Backup Database', onClick: () => handleBackup() },
          { label: 'Month-End Processing', onClick: () => navigate('/fs/month-end') },
          { label: 'Audit Logs', onClick: () => navigate('/fs/audit-logs') }
        ]
      }
    ],
    query: [
      {
        title: 'Quick View',
        items: [
          { label: 'Chart of Accounts', onClick: () => navigate('/fs/query/accounts') }
        ]
      },
      {
        title: 'Transactions',
        items: [
          { label: 'Check Disbursement Vouchers', onClick: () => navigate('/fs/query/cdv') },
          { label: 'Cash Receipts Transactions', onClick: () => navigate('/fs/query/receipt') },
          { label: 'Sales Book Journals', onClick: () => navigate('/fs/query/sales') },
          { label: 'Journal Vouchers', onClick: () => navigate('/fs/query/general') },
          { label: 'Purchase Book Journals', onClick: () => navigate('/fs/query/purchase') },
          { label: 'Adjustments', onClick: () => navigate('/fs/query/adjustment') }
        ]
      }
    ],
    report: [
      {
        title: 'Registers',
        items: [
          { label: 'Cash Disbursement Voucher', onClick: () => navigate('/fs/reports/cdv') },
          { label: 'Cash Disbursement Summary', onClick: () => navigate('/fs/reports/cds') },
          { label: 'CDS by Code', onClick: () => navigate('/fs/reports/cds-code') }
        ]
      },
      {
        title: 'Journals',
        items: [
          { label: 'Cash Receipts', onClick: () => navigate('/fs/reports/receipts') },
          { label: 'Sales Book', onClick: () => navigate('/fs/reports/sales') },
          { label: 'Journal Vouchers', onClick: () => navigate('/fs/reports/journals') },
          { label: 'Purchase Book', onClick: () => navigate('/fs/reports/purchase') },
          { label: 'Adjustments', onClick: () => navigate('/fs/reports/adjustments') }
        ]
      },
      {
        title: 'Statements',
        items: [
          { label: 'Detailed Trial Balance', onClick: () => navigate('/fs/reports/trial-balance-detail') },
          { label: 'Trial Balance', onClick: () => navigate('/fs/reports/trial-balance') },
          { label: 'Income Statement', onClick: () => navigate('/fs/reports/income-statement') },
          { label: 'Balance Sheet', onClick: () => navigate('/fs/reports/balance-sheet') }
        ]
      },
      {
        title: 'Code Files',
        items: [
          { label: 'Chart of Accounts', onClick: () => navigate('/fs/reports/coa') },
          { label: 'Accounts Grouping', onClick: () => navigate('/fs/reports/groups') },
          { label: 'Subsidiary Schedules', onClick: () => navigate('/fs/reports/schedules') }
        ]
      }
    ]
  }

  return (
    <div className="fs-container">
      <header className={`topbar ${isCompactHeader ? 'topbar-compact' : ''}`}>
        <div className="brand">
          <div className="brand-mark-small"></div>
          <div>
            <h1>FS Accounting System</h1>
            <p>Financial Statements Module</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CompanyBadge />
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
          <Route path="/" element={<FSMainMenu />} />
          <Route path="/voucher" element={<FSVoucherEntry type="current" />} />
          <Route path="/voucher/advance" element={<FSVoucherEntry type="advance" />} />
          <Route path="/journal/:type" element={<FSJournalEntry />} />
          <Route path="/chart-of-accounts" element={<FSChartOfAccounts />} />
          <Route path="/group-codes" element={<FSGroupCodes />} />
          <Route path="/subsidiary-groups" element={<FSSubsidiaryGroups />} />
          <Route path="/posting" element={<FSPosting />} />
          <Route path="/month-end" element={<FSMonthEnd />} />
          <Route path="/reports/:reportType" element={<FSReports />} />
          <Route path="/query/:queryType" element={<FSQueryBrowser />} />
          <Route path="/audit-logs" element={<FSAuditLogs />} />
        </Routes>
      </div>

      <div className="status-bar">
        <span>FS System | Company: {selectedCompanyName} | Period: February 2026</span>
        <span>{user?.username}</span>
      </div>
    </div>
  )
}
