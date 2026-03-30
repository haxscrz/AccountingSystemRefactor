import { useState, useEffect, useRef } from 'react'
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
import FSAuditLogs from '../components/fs/FSAuditLogs'

export default function FSSystem() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const { accessToken, user } = useAuthStore()
  const { darkMode, profilePhoto, displayName, dateFormat, numberFormat, showStatusBar,
    toggleDarkMode, setProfilePhoto, setDisplayName, setDateFormat, setNumberFormat, setShowStatusBar
  } = useSettingsStore()

  const [statusPeriod, setStatusPeriod] = useState('')
  const [backingUp, setBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(-1)
  const [backupStatus, setBackupStatus] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'appearance' | 'profile' | 'preferences'>('appearance')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const syncProfileToApi = async (photoDataUrl: string | null) => {
    try {
      await fetch('/api/admin/my-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: photoDataUrl, preferencesJson: null })
      })
    } catch { /* best-effort sync */ }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setProfilePhoto(dataUrl)
      syncProfileToApi(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    syncProfileToApi(null)
  }

  const shellTabs = [
    { id: 'main', label: 'Main' },
    { id: 'file', label: 'File' },
    { id: 'query', label: 'Query/Report' }
  ]

  // Build administration items based on role
  const adminItems: any[] = [
    { label: 'Month-End Processing', icon: 'event', onClick: () => navigate('/fs/month-end'), route: '/fs/month-end' },
  ]
  // Only show Audit Logs for superadmin
  if (isSuperAdmin) {
    adminItems.push({ label: 'Audit Logs', icon: 'history', onClick: () => navigate('/fs/audit-logs'), route: '/fs/audit-logs' })
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
        companyCode={selectedCompanyCode}
        statusPeriod={statusPeriod}
        tabs={shellTabs}
        groups={shellGroups}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewEntry={() => navigate('/fs/voucher')}
        newEntryLabel="New Voucher"
        onOpenSettings={() => setShowSettings(true)}
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
          {isSuperAdmin && <Route path="/audit-logs" element={<FSAuditLogs />} />}
        </Routes>

        {/* Database Backup Progress Overlay */}
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

      {/* ── Settings Panel ── */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6" onClick={() => setShowSettings(false)}>
          <div 
            className={`w-full max-w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${darkMode ? 'bg-[#1e2a4a] text-gray-100' : 'bg-white text-on-surface'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Settings Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-600' : 'border-outline-variant/15'}`}>
              <h3 className="font-headline font-bold text-lg">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg hover:bg-gray-200/20 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Settings Tabs */}
            <div className={`flex border-b ${darkMode ? 'border-gray-600' : 'border-outline-variant/10'}`}>
              {[
                { id: 'appearance' as const, label: 'Appearance', icon: 'palette' },
                { id: 'profile' as const, label: 'Profile', icon: 'person' },
                { id: 'preferences' as const, label: 'Preferences', icon: 'tune' },
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setSettingsTab(t.id)}
                  className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                    settingsTab === t.id 
                      ? 'text-primary border-primary' 
                      : `${darkMode ? 'text-gray-400 border-transparent hover:text-gray-200' : 'text-on-surface-variant/60 border-transparent hover:text-on-surface'}`
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar space-y-6">
              
              {settingsTab === 'appearance' && (
                <>
                  {/* Dark Mode Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px] text-primary">{darkMode ? 'dark_mode' : 'light_mode'}</span>
                      <div>
                        <p className="font-semibold text-sm">Dark Mode</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>Switch between light and dark themes</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleDarkMode}
                      className={`w-12 h-7 rounded-full transition-all relative ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Show Status Bar */}
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px] text-primary">bottom_navigation</span>
                      <div>
                        <p className="font-semibold text-sm">Status Bar</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>Show the bottom status bar</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowStatusBar(!showStatusBar)}
                      className={`w-12 h-7 rounded-full transition-all relative ${showStatusBar ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${showStatusBar ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </>
              )}

              {settingsTab === 'profile' && (
                <>
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-outline-variant/30 bg-surface-container-high'}`}>
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined text-[40px] ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>person</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Upload Photo
                      </button>
                      {profilePhoto && (
                        <button 
                          onClick={() => handleRemovePhoto()}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>Max 2MB. JPG, PNG, or WebP.</p>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Display Name</label>
                    <input 
                      type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      placeholder={user?.username || 'Your name'}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all border-none ${darkMode ? 'bg-gray-700 text-gray-100 placeholder:text-gray-500' : 'bg-surface-container-low placeholder:text-outline-variant'}`}
                    />
                    <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>Shown in reports and printouts</p>
                  </div>

                  {/* Account Info (read-only) */}
                  <div className={`p-4 rounded-xl border space-y-2 ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>Account Information</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>Username</span>
                        <span className="font-semibold">{user?.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>Role</span>
                        <span className="font-semibold">{user?.role === 'superadmin' ? 'Super Admin' : 'Senior Accountant'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>FS Access</span>
                        <span className={`font-semibold ${user?.canAccessFs ? 'text-emerald-500' : 'text-red-500'}`}>{user?.canAccessFs ? 'Granted' : 'Denied'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>Payroll Access</span>
                        <span className={`font-semibold ${user?.canAccessPayroll ? 'text-emerald-500' : 'text-red-500'}`}>{user?.canAccessPayroll ? 'Granted' : 'Denied'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {settingsTab === 'preferences' && (
                <>
                  {/* Date Format */}
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Date Format</label>
                    <select 
                      value={dateFormat} onChange={e => setDateFormat(e.target.value as any)}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all border-none ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-surface-container-low'}`}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>

                  {/* Number Format */}
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Number Format</label>
                    <select 
                      value={numberFormat} onChange={e => setNumberFormat(e.target.value as any)}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all border-none ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-surface-container-low'}`}
                    >
                      <option value="en-PH">1,234,567.89 (Philippine)</option>
                      <option value="en-US">1,234,567.89 (US)</option>
                    </select>
                  </div>

                  {/* Session Info */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-500">timer</span>
                      <p className="font-semibold text-sm">Session Security</p>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>
                      Your session will automatically expire after <strong>5 minutes</strong> of inactivity for security purposes. All unsaved changes will be lost.
                    </p>
                  </div>

                  {/* App Version */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">info</span>
                      <p className="font-semibold text-sm">About</p>
                    </div>
                    <div className={`space-y-1 text-xs ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>
                      <p>Accounting and Workforce Management</p>
                      <p>Version <strong>V 3.3.0-UI</strong></p>
                      <p>© 2026 iSupplyTech Co. Ltd.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings Footer */}
            <div className={`px-6 py-4 border-t flex justify-end ${darkMode ? 'border-gray-600' : 'border-outline-variant/10'}`}>
              <button onClick={() => setShowSettings(false)} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
