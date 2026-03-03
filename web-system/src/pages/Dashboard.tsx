import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark-small"></div>
          <div>
            <h1>Accounting System</h1>
            <p>Welcome, {user?.username}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <h2>Select System</h2>
        <p className="dashboard-subtitle">Choose the module you want to access</p>

        <div className="system-grid">
          <div className="system-card" onClick={() => navigate('/fs')}>
            <div className="system-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <h3>Financial Statements</h3>
            <p>Accounting, vouchers, journals, financial reports, and chart of accounts management.</p>
            <ul className="feature-list">
              <li>Cash disbursement & receipts</li>
              <li>Journal entries & posting</li>
              <li>Balance sheet & income statement</li>
              <li>Month-end processing</li>
            </ul>
            <button className="btn btn-primary system-button">
              Open FS System →
            </button>
          </div>

          <div className="system-card" onClick={() => navigate('/payroll')}>
            <div className="system-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>Payroll System</h3>
            <p>Employee management, timecard processing, payroll computation, and government remittances.</p>
            <ul className="feature-list">
              <li>Timecard entry & computation</li>
              <li>SSS, PHIC, Pag-ibig, tax deductions</li>
              <li>Payslips & registers</li>
              <li>13th month & year-end processing</li>
            </ul>
            <button className="btn btn-primary system-button">
              Open Payroll System →
            </button>
          </div>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <strong>Company:</strong> CTSI
          </div>
          <div className="info-card">
            <strong>Current Period:</strong> February 2026
          </div>
          <div className="info-card">
            <strong>System Status:</strong> <span className="status-badge">Operational</span>
          </div>
        </div>
      </div>

      <div className="status-bar">
        <span>Accounting System v2.0 - Modernized from legacy FS and PAY programs</span>
        <span>Logged in as: {user?.username} ({user?.role})</span>
      </div>
    </div>
  )
}
