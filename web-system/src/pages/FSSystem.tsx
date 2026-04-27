import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'

import { useCompanyStore } from '../stores/companyStore'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import AppShell from '../components/AppShell'
import FSFiscalNarrative from '../components/fs/FSFiscalNarrative'
import FSVoucherEntry from '../components/fs/FSVoucherEntry'
import FSJournalEntry from '../components/fs/FSJournalEntry'
import FSTransferAdvanceCDB from '../components/fs/FSTransferAdvanceCDB'
import FSChartOfAccounts from '../components/fs/FSChartOfAccounts'
import FSReports from '../components/fs/FSReports'
import FSPosting from '../components/fs/FSPosting'
import FSMonthEnd from '../components/fs/FSMonthEnd'
import FSGroupCodes from '../components/fs/FSGroupCodes'
import FSSubsidiaryGroups from '../components/fs/FSSubsidiaryGroups'
import FSBanks from '../components/fs/FSBanks'
import FSSuppliers from '../components/fs/FSSuppliers'
import FSSignatories from '../components/fs/FSSignatories'
import FSQueryBrowser from '../components/fs/FSQueryBrowser'

export default function FSSystem() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const { accessToken, user } = useAuthStore()
  const { darkMode } = useSettingsStore()

  const [statusPeriod, setStatusPeriod] = useState('')
  const [backingUp, setBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(-1)
  const [backupStatus, setBackupStatus] = useState('')

  const isSuperAdmin = user?.role === 'superadmin'

  const deriveActiveTab = () => {
    const path = location.pathname
    if (path.includes('/chart-of-accounts') || path.includes('/group-codes') || path.includes('/subsidiary-groups') || path.includes('/banks') || path.includes('/suppliers') || path.includes('/signatories') || path.includes('/month-end') || path.includes('/audit-logs') || path.includes('/backup')) return 'file'
    if (path.includes('/query/') || path.includes('/reports/')) return 'query'
    return 'main'
  }
  const [activeTab, setActiveTab] = useState(deriveActiveTab)

  useEffect(() => {
    setActiveTab(deriveActiveTab())
  }, [location.pathname])

  const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  useEffect(() => {
    const fetchInfo = () => {
      fetch('/api/fs/system-info', {
        headers: {
          'Authorization': `Bearer ${accessToken ?? ''}`,
          'X-Company-Code': selectedCompanyCode ?? '',
        }
      })
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          if (!res) return
          const d = res?.data ?? res
          const mo = d.currentMonth ?? d.current_month ?? 0
          const yr = d.currentYear ?? d.current_year ?? 0
          if (mo && yr) setStatusPeriod(`${MONTH_NAMES[mo] ?? mo} ${yr}`)
        })
        .catch(() => {})
    }

    fetchInfo()

    window.addEventListener('fs-system-info-updated', fetchInfo)
    return () => window.removeEventListener('fs-system-info-updated', fetchInfo)
  }, [accessToken, selectedCompanyCode])

  const handleBackup = async () => {
    setBackingUp(true)
    setBackupProgress(0)
    setBackupStatus('Connecting to remote database servers...')
    try {
      const resp = await fetch('/api/fs/backup', {
        headers: {
          'Authorization': `Bearer ${accessToken ?? ''}`,
          'X-Company-Code': selectedCompanyCode ?? '',
        }
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body?.error ?? `Server error ${resp.status}`)
      }

      setBackupStatus('Receiving datastream...')
      const contentLength = resp.headers.get('content-length')
      const total = parseInt(contentLength || '0', 10) || 25 * 1024 * 1024 
      
      let loaded = 0
      const reader = resp.body!.getReader()
      const chunks: BlobPart[] = []
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          loaded += value.length
          const p = Math.min(100, Math.round((loaded / total) * 100))
          setBackupProgress(p)
          setBackupStatus(`Downloading... ${(loaded / 1024 / 1024).toFixed(1)} MB`)
        }
      }

      setBackupStatus('Finalizing secure local payload...')
      
      const blob = new Blob(chunks, { type: resp.headers.get('content-type') || 'application/octet-stream' })
      const now = new Date()
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `accounting_backup_${selectedCompanyCode ?? 'db'}_${stamp}.db`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)

      setBackupProgress(100)
      setBackupStatus('Database secure! Backup downloaded successfully.')
      setTimeout(() => {
        setBackupProgress(-1)
        setBackupStatus('')
        setBackingUp(false)
      }, 3500)
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`)
      setBackupProgress(-1)
      setBackupStatus('')
      setBackingUp(false)
    }
  }

  const shellTabs = [
    { id: 'main', label: 'Main' },
    { id: 'file', label: 'File' },
    { id: 'query', label: 'Query/Report' }
  ]

  const adminItems: any[] = [
    { label: 'Month-End Processing', icon: 'event', onClick: () => navigate('/fs/month-end'), route: '/fs/month-end' },
  ]
  if (isSuperAdmin) {
    // Audit logs moved to administrative settings
  }
  adminItems.push({ label: backingUp ? 'Backing up…' : 'Backup Database', icon: 'save', onClick: () => handleBackup(), disabled: backingUp })

  const shellGroups = {
    main: [
      {
        title: 'Data Entry',
        items: [
          { label: 'Fiscal Narrative', icon: 'dashboard', onClick: () => navigate('/fs'), route: '/fs' },
          { label: 'Check Disbursement', icon: 'receipt_long', onClick: () => navigate('/fs/voucher'), route: '/fs/voucher' },
          { label: 'Cash Receipts', icon: 'payments', onClick: () => navigate('/fs/journal/receipt'), route: '/fs/journal/receipt' },
          { label: 'Sales Book Journals', icon: 'sell', onClick: () => navigate('/fs/journal/sales'), route: '/fs/journal/sales' },
          { label: 'Journal Vouchers', icon: 'receipt', onClick: () => navigate('/fs/journal/general'), route: '/fs/journal/general' },
          { label: 'Purchase Book Journals', icon: 'shopping_cart', onClick: () => navigate('/fs/journal/purchase'), route: '/fs/journal/purchase' },
          { label: 'Adjustments', icon: 'tune', onClick: () => navigate('/fs/journal/adjustment'), route: '/fs/journal/adjustment' }
        ]
      },
      {
        title: 'Quick Reports',
        items: [
          { label: 'Check Disbursement Register (Detailed)', icon: 'description', onClick: () => navigate('/fs/reports/cdv'), route: '/fs/reports/cdv' },
          { label: 'Check Disbursement Register (Summary)', icon: 'tag', onClick: () => navigate('/fs/reports/cds'), route: '/fs/reports/cds' }
        ]
      },
      {
        title: 'Processing',
        items: [
          { label: 'Post All Transactions', icon: 'publish', onClick: () => navigate('/fs/posting'), route: '/fs/posting' },
          { label: 'Enter Advance CDB', icon: 'forward_to_inbox', onClick: () => navigate('/fs/voucher/advance'), route: '/fs/voucher/advance' },
          { label: 'Transfer Advance CDB', icon: 'compare_arrows', onClick: () => navigate('/fs/transfer-advance'), route: '/fs/transfer-advance' }
        ]
      }
    ],
    file: [
      {
        title: 'Master Files',
        items: [
          { label: 'Chart of Accounts', icon: 'account_tree', onClick: () => navigate('/fs/chart-of-accounts'), route: '/fs/chart-of-accounts' },
          { label: 'Group Codes', icon: 'folder_open', onClick: () => navigate('/fs/group-codes'), route: '/fs/group-codes' },
          { label: 'Subsidiary Groups', icon: 'people', onClick: () => navigate('/fs/subsidiary-groups'), route: '/fs/subsidiary-groups' },
          { label: 'Banks', icon: 'account_balance', onClick: () => navigate('/fs/banks'), route: '/fs/banks' },
          { label: 'Suppliers', icon: 'store', onClick: () => navigate('/fs/suppliers'), route: '/fs/suppliers' },
          { label: 'Signatories', icon: 'draw', onClick: () => navigate('/fs/signatories'), route: '/fs/signatories' }
        ]
      },
      {
        title: 'Administration',
        items: adminItems
      }
    ],
    query: [
      {
        title: 'Query Data',
        items: [
          { label: 'Chart of Accounts', icon: 'search', onClick: () => navigate('/fs/query/accounts'), route: '/fs/query/accounts' },
          { label: 'Check Disbursement', icon: 'search', onClick: () => navigate('/fs/query/cdv'), route: '/fs/query/cdv' },
          { label: 'Cash Receipts', icon: 'search', onClick: () => navigate('/fs/query/receipt'), route: '/fs/query/receipt' },
          { label: 'Sales Book', icon: 'search', onClick: () => navigate('/fs/query/sales'), route: '/fs/query/sales' },
          { label: 'Journal Vouchers', icon: 'search', onClick: () => navigate('/fs/query/general'), route: '/fs/query/general' },
          { label: 'Purchase Book', icon: 'search', onClick: () => navigate('/fs/query/purchase'), route: '/fs/query/purchase' },
          { label: 'Adjustments', icon: 'search', onClick: () => navigate('/fs/query/adjustment'), route: '/fs/query/adjustment' }
        ]
      },
      {
        title: 'Report Generation',
        items: [
          { label: 'Check Disbursement Register (Detail)', icon: 'description', onClick: () => navigate('/fs/reports/cdv'), route: '/fs/reports/cdv' },
          { label: 'Check Disbursement Register (Summary)', icon: 'tag', onClick: () => navigate('/fs/reports/cds'), route: '/fs/reports/cds' },
          { label: 'Cash Receipts Transactions', icon: 'payments', onClick: () => navigate('/fs/reports/receipts'), route: '/fs/reports/receipts' },
          { label: 'Sales Book Journals', icon: 'sell', onClick: () => navigate('/fs/reports/sales'), route: '/fs/reports/sales' },
          { label: 'Journal Vouchers', icon: 'receipt', onClick: () => navigate('/fs/reports/journals'), route: '/fs/reports/journals' },
          { label: 'Purchase Book Journals', icon: 'shopping_cart', onClick: () => navigate('/fs/reports/purchase'), route: '/fs/reports/purchase' },
          { label: 'Adjustments', icon: 'tune', onClick: () => navigate('/fs/reports/adjustments'), route: '/fs/reports/adjustments' },
          { label: 'Detailed Trial Balance', icon: 'table_rows', onClick: () => navigate('/fs/reports/trial-balance-detail'), route: '/fs/reports/trial-balance-detail' },
          { label: 'Trial Balance', icon: 'balance', onClick: () => navigate('/fs/reports/trial-balance'), route: '/fs/reports/trial-balance' },
          { label: 'Income Statement', icon: 'monitoring', onClick: () => navigate('/fs/reports/income-statement'), route: '/fs/reports/income-statement' },
          { label: 'Balance Sheet', icon: 'account_balance', onClick: () => navigate('/fs/reports/balance-sheet'), route: '/fs/reports/balance-sheet' },
          { label: 'Subsidiary Schedule', icon: 'subject', onClick: () => navigate('/fs/reports/subsidiary-schedule'), route: '/fs/reports/subsidiary-schedule' },
          { label: 'Code Files - COA', icon: 'account_tree', onClick: () => navigate('/fs/reports/coa'), route: '/fs/reports/coa' },
          { label: 'Code Files - Grouping', icon: 'folder_open', onClick: () => navigate('/fs/reports/groups'), route: '/fs/reports/groups' },
          { label: 'Code Files - Schedules', icon: 'people', onClick: () => navigate('/fs/reports/schedules'), route: '/fs/reports/schedules' }
        ]
      }
    ]
  }

  return (
    <>
      <AppShell 
        moduleName="FINANCIAL STATEMENTS"
        breadcrumbSegments={[
          { label: selectedCompanyCode || 'Company', path: '/select-company', icon: 'domain' },
          { label: 'Financial Statements' }
        ]}
        companyCode={selectedCompanyCode}
        statusPeriod={statusPeriod}
        tabs={shellTabs}
        groups={shellGroups}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewEntry={() => navigate('/fs/voucher')}
        newEntryLabel="New Voucher"
        onOpenSettings={() => navigate('/admin-settings')}
      >
        <Routes>
          <Route path="/" element={<FSFiscalNarrative />} />
          <Route path="/voucher" element={<FSVoucherEntry type="current" />} />
          <Route path="/voucher/advance" element={<FSVoucherEntry type="advance" />} />
          <Route path="/transfer-advance" element={<FSTransferAdvanceCDB />} />
          <Route path="/journal/:type" element={<FSJournalEntry />} />
          <Route path="/chart-of-accounts" element={<FSChartOfAccounts />} />
          <Route path="/group-codes" element={<FSGroupCodes />} />
          <Route path="/subsidiary-groups" element={<FSSubsidiaryGroups />} />
          <Route path="/banks" element={<FSBanks />} />
          <Route path="/suppliers" element={<FSSuppliers />} />
          <Route path="/signatories" element={<FSSignatories />} />
          <Route path="/posting" element={<FSPosting />} />
          <Route path="/month-end" element={<FSMonthEnd />} />
          <Route path="/reports/:reportType" element={<FSReports />} />
          <Route path="/query/:queryType" element={<FSQueryBrowser />} />
          {/* Audit logs moved to Admin Hub */}
        </Routes>

        {backupProgress >= 0 && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '320px', background: darkMode ? '#1e2a4a' : '#fff',
            borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, padding: '16px', zIndex: 9999,
            color: darkMode ? '#e5e7eb' : '#1a1a2e'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>Securing Database to Local</h4>
            <p style={{ margin: '0 0 12px', fontSize: '12px', opacity: 0.7 }}>{backupStatus}</p>
            <div style={{ width: '100%', height: '6px', background: darkMode ? '#374151' : '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${backupProgress}%`, height: '100%', 
                background: backupProgress === 100 ? '#166534' : '#0ea5e9',
                transition: 'width 0.3s ease, background 0.3s ease' 
              }} />
            </div>
            <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '11px', fontWeight: 700 }}>
              {backupProgress}%
            </div>
          </div>
        )}
      </AppShell>
    </>
  )
}
