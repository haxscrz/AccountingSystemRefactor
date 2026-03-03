import { useEffect, useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import RibbonNav from '../components/RibbonNav'
import FSMainMenu from '../components/fs/FSMainMenu'
import FSVoucherEntry from '../components/fs/FSVoucherEntry'
import FSJournalEntry from '../components/fs/FSJournalEntry'
import FSChartOfAccounts from '../components/fs/FSChartOfAccounts'
import FSReports from '../components/fs/FSReports'
import FSPosting from '../components/fs/FSPosting'
import FSMonthEnd from '../components/fs/FSMonthEnd'
import FSGroupCodes from '../components/fs/FSGroupCodes'
import FSSubsidiaryGroups from '../components/fs/FSSubsidiaryGroups'
import './FSSystem.css'

export default function FSSystem() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('main')
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
        title: 'Reindex',
        items: [
          { label: 'Reindex Accounts File', onClick: () => alert('Not required: SQLite manages indexes automatically. No manual reindex is needed.') },
          { label: 'Reindex Transaction File', onClick: () => alert('Not required: SQLite manages indexes automatically. No manual reindex is needed.') },
          { label: 'Reindex All Files', onClick: () => alert('Not required: SQLite manages indexes automatically. No manual reindex is needed.') }
        ]
      },
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
          { label: 'Backup Databases', onClick: () => alert('Database Backup: To back up the database, copy the accounting.db file from the server directory to a safe location.') },
          { label: 'Month-End Processing', onClick: () => navigate('/fs/month-end') },
          { label: 'Transfer Advance CDB', onClick: () => alert('Transfer Advance CDB: This function transfers advance CDB entries to the current accounting period. Contact your system administrator to run this process.') }
        ]
      }
    ],
    query: [
      {
        title: 'Quick View',
        items: [
          { label: 'View Spooled File', onClick: () => alert('View Spooled File is not available in the web version. Reports are generated directly on screen.') },
          { label: 'Charts of Accounts', onClick: () => navigate('/fs/chart-of-accounts') }
        ]
      },
      {
        title: 'Transactions',
        items: [
          { label: 'Check Disbursement Vouchers', onClick: () => navigate('/fs/voucher') },
          { label: 'Cash Receipts', onClick: () => navigate('/fs/journal/receipt') },
          { label: 'Sales Book Journals', onClick: () => navigate('/fs/journal/sales') },
          { label: 'Journal Vouchers', onClick: () => navigate('/fs/journal/general') },
          { label: 'Purchase Book', onClick: () => navigate('/fs/journal/purchase') },
          { label: 'Adjustments', onClick: () => navigate('/fs/journal/adjustment') }
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
        </Routes>
      </div>

      <div className="status-bar">
        <span>FS System | Company: CTSI | Period: February 2026</span>
        <span>{user?.username}</span>
      </div>
    </div>
  )
}
