import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useCompanyStore } from './stores/companyStore'
import { useSettingsStore } from './stores/settingsStore'
import { useInactivityLogout } from './hooks/useInactivityLogout'
import Login from './pages/Login'
import CompanySelection from './pages/CompanySelection'
import Dashboard from './pages/Dashboard'
import FSSystem from './pages/FSSystem'
import PayrollSystem from './pages/PayrollSystem'
import UserManagement from './pages/UserManagement'

function InactivityModal() {
  const { showInactivityModal, dismissInactivityModal } = useInactivityLogout()
  
  if (!showInactivityModal) return null
  
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-600 text-[32px]">timer_off</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Session Expired</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            You have been automatically logged out due to <strong>5 minutes of inactivity</strong>. 
            This is a security measure to protect your financial data.
          </p>
          <button 
            onClick={dismissInactivityModal}
            className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, user } = useAuthStore()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const hasSelectedCompany = !!selectedCompanyCode

  return (
    <>
      <InactivityModal />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={hasSelectedCompany ? '/dashboard' : '/select-company'} /> : <Login />} />
        <Route
          path="/select-company"
          element={isAuthenticated ? <CompanySelection /> : <Navigate to="/login" />}
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? (hasSelectedCompany ? <Dashboard /> : <Navigate to="/select-company" />) : <Navigate to="/login" />} 
        />
        <Route 
          path="/fs/*" 
          element={isAuthenticated ? (hasSelectedCompany ? (user?.canAccessFs ? <FSSystem /> : <Navigate to="/dashboard" />) : <Navigate to="/select-company" />) : <Navigate to="/login" />} 
        />
        <Route 
          path="/payroll/*" 
          element={isAuthenticated ? (hasSelectedCompany ? (user?.canAccessPayroll ? <PayrollSystem /> : <Navigate to="/dashboard" />) : <Navigate to="/select-company" />) : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/users" 
          element={isAuthenticated ? (user?.role === 'superadmin' ? <UserManagement /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? (hasSelectedCompany ? '/dashboard' : '/select-company') : '/login'} />} />
      </Routes>
    </>
  )
}

function App() {
  const darkMode = useSettingsStore((s) => s.darkMode)
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  )
}

export default App
