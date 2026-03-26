import { useCompanyStore } from '../stores/companyStore'
import { getCompanyNameByCode } from '../config/companies'

export default function CompanyBadge() {
  const selectedCompanyCode = useCompanyStore((state) => state.selectedCompanyCode)
  const companyName = getCompanyNameByCode(selectedCompanyCode)

  return (
    <div className="company-badge" title={companyName}>
      <span className="company-badge-label">Company</span>
      <span className="company-badge-name">{companyName}</span>
    </div>
  )
}
