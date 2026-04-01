import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useCompanyStore } from './stores/companyStore'
import { useSettingsStore } from './stores/settingsStore'
import InactivityToast from './components/InactivityToast'
import Login from './pages/Login'
import CompanySelection from './pages/CompanySelection'
import Dashboard from './pages/Dashboard'
import FSSystem from './pages/FSSystem'
import PayrollSystem from './pages/PayrollSystem'
import UserManagement from './pages/UserManagement'
import DataImport from './pages/DataImport'
import SystemOptions from './pages/SystemOptions'
import AdminSettings from './pages/AdminSettings'

function AppContent() {
  const { isAuthenticated, user } = useAuthStore()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const hasSelectedCompany = !!selectedCompanyCode

  return (
    <>
      <InactivityToast />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/system-options" /> : <Login />} />
        
        {/* Step 1 After Login: System Options Hub */}
        <Route 
          path="/system-options" 
          element={isAuthenticated ? <SystemOptions /> : <Navigate to="/login" />} 
        />
        
        {/* Step 2 After DB/FS Selection: Company Selection */}
        <Route
          path="/select-company"
          element={isAuthenticated ? <CompanySelection /> : <Navigate to="/login" />}
        />
        
        {/* Step 3: Main Dashboard (Requires a selected company) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? (hasSelectedCompany ? <Dashboard /> : <Navigate to="/select-company" />) : <Navigate to="/login" />} 
        />
        
        {/* Feature Routes */}
        <Route 
          path="/fs/*" 
          element={isAuthenticated ? (hasSelectedCompany ? (user?.canAccessFs ? <FSSystem /> : <Navigate to="/dashboard" />) : <Navigate to="/select-company" />) : <Navigate to="/login" />} 
        />
        <Route 
          path="/payroll/*" 
          element={isAuthenticated ? (hasSelectedCompany ? (user?.canAccessPayroll ? <PayrollSystem /> : <Navigate to="/dashboard" />) : <Navigate to="/select-company" />) : <Navigate to="/login" />} 
        />
        
        {/* Admin/Settings Hub */}
        <Route 
          path="/admin-settings" 
          element={isAuthenticated ? <AdminSettings /> : <Navigate to="/login" />}
        />
        
        {/* Legacy Dedicated Routes */}
        <Route 
          path="/admin/users" 
          element={isAuthenticated ? (user?.role === 'superadmin' ? <UserManagement /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />}
        />
        
        <Route 
          path="/admin/import" 
          element={isAuthenticated ? <DataImport /> : <Navigate to="/login" />} 
        />
        
        <Route path="*" element={<Navigate to={isAuthenticated ? '/system-options' : '/login'} />} />
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
