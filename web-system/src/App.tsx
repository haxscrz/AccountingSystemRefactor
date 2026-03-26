import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useCompanyStore } from './stores/companyStore'
import Login from './pages/Login'
import CompanySelection from './pages/CompanySelection'
import Dashboard from './pages/Dashboard'
import FSSystem from './pages/FSSystem'
import PayrollSystem from './pages/PayrollSystem'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const hasSelectedCompany = !!selectedCompanyCode

  return (
    <BrowserRouter>
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
        <Route path="/" element={<Navigate to={isAuthenticated ? (hasSelectedCompany ? '/dashboard' : '/select-company') : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
