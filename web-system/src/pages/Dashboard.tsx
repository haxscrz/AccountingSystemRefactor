import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { useFsUnsavedStore } from '../stores/fsUnsavedStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getCompanyNameByCode } from '../config/companies'
import Breadcrumbs from '../components/Breadcrumbs'
import { useSystemHealth } from '../hooks/useSystemHealth'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const clearSelectedCompany = useCompanyStore((state) => state.clearSelectedCompany)
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const canPayroll = !!user?.canAccessPayroll
  const canFs = !!user?.canAccessFs
  const hasUnsavedChanges = useFsUnsavedStore((state) => state.hasUnsavedChanges)
  const selectedCompanyName = getCompanyNameByCode(selectedCompanyCode)
  const darkMode = useSettingsStore((state) => state.darkMode)
  const { health, latencyMs } = useSystemHealth()
  const isSuperAdmin = user?.role === 'superadmin'

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const handleSwitchCompany = () => {
    if (hasUnsavedChanges) {
      const proceed = window.confirm('You have unsaved FS changes. Switching company may lose your current edits. Continue?')
      if (!proceed) return
    }
    clearSelectedCompany()
    navigate('/select-company')
  }

  return (
    <div className={`font-body min-h-screen flex flex-col relative overflow-hidden ${darkMode ? 'bg-[#0a0f1e] text-gray-100' : 'bg-slate-50/50 text-on-surface'}`}>
      {/* Abstract Background */}
      <div className={`absolute top-[10%] left-[-10%] w-[50%] h-[70%] rounded-full blur-[120px] -z-10 animate-pulse ${darkMode ? 'bg-blue-900/20 mix-blend-screen' : 'bg-blue-500/10 mix-blend-multiply'}`} style={{ animationDuration: '8s' }}></div>
      <div className={`absolute bottom-[0%] right-[-10%] w-[40%] h-[60%] rounded-full blur-[100px] -z-10 animate-pulse ${darkMode ? 'bg-emerald-900/15 mix-blend-screen' : 'bg-emerald-400/10 mix-blend-multiply'}`} style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      <div className={`absolute top-[40%] left-[50%] w-[30%] h-[40%] rounded-full blur-[90px] -z-10 animate-pulse ${darkMode ? 'bg-indigo-900/15' : 'bg-indigo-400/10'}`} style={{ animationDuration: '12s' }}></div>

      {/* Top Navigation Bar */}
      <header className={`px-8 py-5 flex justify-between items-center w-full z-10 border-b backdrop-blur-md ${darkMode ? 'bg-[#0f172a]/80 border-gray-700' : 'bg-white/40 border-outline-variant/10'}`}>
        <div>
          <h1 className={`text-xl font-headline font-extrabold tracking-tight ${darkMode ? 'text-blue-400' : 'text-primary'}`}>Accounting and Workforce Management</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-0.5">Welcome, <strong className="text-on-surface">{user?.username}</strong></p>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold tracking-wide">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${darkMode ? 'text-gray-300 bg-[#1e293b] border-gray-700' : 'text-on-surface-variant bg-surface-container-low border-outline-variant/20'}`}>
            <span className="material-symbols-outlined text-[18px]">domain</span>
            {selectedCompanyName}
          </div>
          <div className="h-5 w-px bg-outline-variant/20"></div>
          <button onClick={handleSwitchCompany} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Switch Company
          </button>
          <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">logout</span> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-7xl">
          <Breadcrumbs segments={[
            { label: selectedCompanyName || 'Company', path: '/select-company', icon: 'domain' },
            { label: 'Dashboard' }
          ]} className="mb-6" />
          <div className="mb-12">
            <h2 className="font-headline text-display-md text-primary tracking-tight mb-2">Select System</h2>
            <p className="font-body text-body-lg text-on-surface-variant">Choose the module you want to access</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Financial Statements Card */}
            <div 
              onClick={() => {
                if (!canFs) {
                  window.alert('Your user level is not allowed to use the Financial Statements feature.')
                  return
                }
                navigate('/fs')
              }}
              className={`group relative rounded-[20px] p-8 flex flex-col h-full border transition-all duration-300 overflow-hidden ${
                canFs
                  ? `shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 cursor-pointer ${darkMode ? 'bg-[#1e293b] border-gray-700 hover:shadow-[0_20px_40px_rgba(96,165,250,0.1)] hover:border-blue-500/30' : 'bg-white border-outline-variant/10 hover:shadow-[0_20px_40px_rgba(30,64,175,0.08)]'}`
                  : `${darkMode ? 'bg-[#1e293b]/30 border-gray-700' : 'bg-surface-container-high/30 border-outline-variant/10'} opacity-70 cursor-not-allowed grayscale`
              }`}
            >
              {canFs && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors duration-300 ${
                canFs
                  ? 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white'
                  : 'bg-outline-variant/20 text-outline-variant border-outline-variant/30'
              }`}>
                <span className="material-symbols-outlined text-2xl">account_balance</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2 flex items-center gap-3">
                Financial Statements
                {!canFs && <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-error-container text-on-error-container uppercase">Restricted</span>}
              </h3>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed mb-6 min-h-[36px]">
                Accounting, vouchers, journals, financial reports, and chart of accounts management.
              </p>
              
              <ul className={`space-y-3 mb-8 flex-grow ${canFs ? '' : 'opacity-80'}`}>
                {[
                  'Check disbursement & receipts',
                  'Journal entries & posting',
                  'Balance sheet & income statement',
                  'Month-end processing'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface font-medium">
                    <span className={`material-symbols-outlined text-[14px] mt-0.5 ${canFs ? 'text-primary' : 'text-outline-variant'}`}>play_arrow</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className={`mt-auto flex items-center gap-2 font-bold text-sm tracking-wide transition-all ${
                canFs ? 'text-primary group-hover:gap-3' : 'text-outline-variant'
              }`}>
                {canFs ? 'Open FS System' : 'Access Denied'} 
                {canFs && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </div>
            </div>

            {/* Payroll System Card */}
            <div 
              onClick={() => {
                if (!canPayroll) {
                  window.alert('Your user level is not allowed to use the Payroll feature.')
                  return
                }
                navigate('/payroll')
              }}
              className={`group relative rounded-[20px] p-8 flex flex-col h-full border transition-all duration-300 overflow-hidden ${
                canPayroll 
                  ? `backdrop-blur-xl hover:-translate-y-1 cursor-pointer ${darkMode ? 'bg-[#1e293b]/60 border-gray-700 hover:bg-[#1e293b] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:border-emerald-500/30' : 'bg-surface-container-lowest/40 border-outline-variant/20 hover:bg-white hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)]'}` 
                  : `${darkMode ? 'bg-[#1e293b]/30 border-gray-700' : 'bg-surface-container-high/30 border-outline-variant/10'} opacity-70 cursor-not-allowed grayscale`
              }`}
            >
              {canPayroll && <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>}
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors duration-300 ${
                canPayroll 
                  ? 'bg-tertiary/10 text-tertiary border-tertiary/20 group-hover:bg-tertiary group-hover:text-white' 
                  : 'bg-outline-variant/20 text-outline-variant border-outline-variant/30'
              }`}>
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2 flex items-center gap-3">
                Payroll System
                {!canPayroll && <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-error-container text-on-error-container uppercase">Restricted</span>}
              </h3>
              
              <p className="text-on-surface-variant/80 text-sm leading-relaxed mb-6 min-h-[36px]">
                Employee management, timecard processing, payroll computation, and government remittances.
              </p>
              
              <ul className="space-y-3 mb-8 flex-grow opacity-80 group-hover:opacity-100 transition-opacity">
                {[
                  'Timecard entry & computation',
                  'SSS, PHIC, Pag-ibig, tax deductions',
                  'Payslips & registers',
                  '13th month & year-end processing'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface font-medium">
                    <span className={`material-symbols-outlined text-[14px] mt-0.5 ${canPayroll ? 'text-tertiary' : 'text-outline-variant'}`}>play_arrow</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className={`mt-auto flex items-center gap-2 font-bold text-sm tracking-wide transition-all ${
                canPayroll ? 'text-tertiary group-hover:gap-3' : 'text-outline-variant'
              }`}>
                {canPayroll ? 'Open Payroll System' : 'Access Denied'} 
                {canPayroll && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </div>
            </div>


            {/* Smart Importer Card (Available to all users) */}
              <div 
                onClick={() => navigate('/admin/import')}
                className={`group relative rounded-[20px] p-8 flex flex-col h-full border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1 ${darkMode ? 'bg-[#1e293b] border-gray-700 hover:shadow-[0_20px_40px_rgba(168,85,247,0.1)] hover:border-purple-500/30' : 'bg-white border-outline-variant/10 hover:shadow-[0_20px_40px_rgba(168,85,247,0.08)]'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-2">Data Import</h3>
                <p className="text-on-surface-variant/80 text-sm leading-relaxed mb-6 min-h-[36px]">
                  Smart Uploader to drag-and-drop legacy dBASE III data archives into the system.
                </p>

                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    'Bulk file ingestion via UI',
                    'Automatic DBF schema mapping',
                    'Live streaming progress',
                    'Real-time error handling'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface font-medium">
                      <span className="material-symbols-outlined text-[14px] text-purple-500 mt-0.5">play_arrow</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center gap-2 text-purple-500 font-bold text-sm tracking-wide group-hover:gap-3 transition-all">
                  Launch Importer <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>

          </div>

          {/* Bottom Info */}
          <div className="mt-16 pt-8 border-t border-outline-variant/10 flex flex-wrap gap-8 justify-between items-center text-sm font-medium">
            <div className="text-on-surface-variant">
              <span className="font-bold text-on-surface mr-2 tracking-wide uppercase text-xs">Company</span>
              {selectedCompanyName}
            </div>
            <div className="text-on-surface-variant flex gap-8">
              <button 
                onClick={() => isSuperAdmin ? navigate('/admin-settings?tab=health') : null}
                className={`flex items-center gap-3 transition-all ${isSuperAdmin ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
              >
                <span className="font-bold text-on-surface tracking-wide uppercase text-xs">System Status</span>
                <span className={`px-2.5 py-1 border rounded font-bold text-[10px] tracking-widest uppercase shadow-sm flex items-center gap-1.5 ${
                  health?.status === 'healthy'
                    ? (darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700' : 'bg-emerald-100/50 text-emerald-800 border-emerald-200')
                    : health?.status === 'degraded'
                      ? (darkMode ? 'bg-amber-900/30 text-amber-400 border-amber-700' : 'bg-amber-100/50 text-amber-800 border-amber-200')
                      : (darkMode ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-100/50 text-red-800 border-red-200')
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : health?.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  {health?.status ?? 'Checking...'}
                  {latencyMs > 0 && <span className="opacity-60">({latencyMs}ms)</span>}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <div className={`absolute bottom-0 left-0 right-0 px-6 py-1.5 flex justify-between text-[11px] font-mono font-medium z-20 border-t ${darkMode ? 'bg-[#0f172a] border-gray-700 text-gray-500' : 'bg-surface-container-highest border-outline-variant/10 text-on-surface-variant/60'}`}>
        <span>AWM V 3.3.0-UI — {selectedCompanyName}</span>
        <span>Logged in as: {user?.username} ({user?.role})</span>
      </div>
    </div>
  )
}
