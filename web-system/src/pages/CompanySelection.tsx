import { useNavigate } from 'react-router-dom'
import { COMPANIES } from '../config/companies'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import CompanyBadge from '../components/CompanyBadge'
import './CompanySelection.css'

export default function CompanySelection() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { setSelectedCompany } = useCompanyStore()

  const handleSelectCompany = (companyCode: (typeof COMPANIES)[number]['code']) => {
    setSelectedCompany(companyCode)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="company-selection-container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark-small"></div>
          <div>
            <h1>Select Company</h1>
            <p>Signed in as {user?.username}. Choose a company workspace to continue.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CompanyBadge />
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="company-selection-main">
        <h2>Company Workspace</h2>
        <p>Records and report data are isolated per selected company.</p>

        <div className="company-grid">
          {COMPANIES.map((company) => (
            <button
              key={company.code}
              className="company-card"
              onClick={() => handleSelectCompany(company.code)}
            >
              <span className="company-pill">{company.code.toUpperCase()}</span>
              <h3>{company.name}</h3>
              <span className="company-open">Open Workspace &rarr;</span>
            </button>
          ))}
        </div>
      </main>

      <div className="status-bar">
        <span>Accounting System v2.0</span>
        <span>Company selection required after login</span>
      </div>
    </div>
  )
}
