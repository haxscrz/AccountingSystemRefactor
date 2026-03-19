import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FSSystem from './pages/FSSystem'
import PayrollSystem from './pages/PayrollSystem'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/fs/*" 
          element={isAuthenticated ? (user?.canAccessFs ? <FSSystem /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} 
        />
        <Route 
          path="/payroll/*" 
          element={isAuthenticated ? (user?.canAccessPayroll ? <PayrollSystem /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
