import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { buildLegacyReportPreview, downloadPreviewAsCsv, downloadPreviewAsExcel, downloadPreviewAsPdf, type ReportPreviewData } from '../../services/legacyData'

const reportTitles: Record<string, string> = {
  'timecard-validation': 'Timecard Validation Report',
  'register': 'Payroll Register',
  'payslips': 'Payroll Slips',
  'denomination': 'Denomination Breakdown',
  'monthly-recap': 'Monthly Payroll Recapitulation',
  'monthly-contributions': 'Monthly SSS/PHIC/EC/Pag-ibig Report',
  'monthly-tax': 'Monthly Tax Withheld',
  'dept-summary': 'Departmental Summary',
  'loan-deductions': 'Loan Deduction Summary',
  'quarterly-sss': 'Quarterly SSS/PHIC/EC Report',
  'quarterly-pbg': 'Quarterly Pag-ibig Premium',
  'quarterly-tax': 'Quarterly Withholding Tax',
  'phic-remittance': 'PHIC Quarterly Remittance',
  'yearly-recap': 'Year-End Payroll Recapitulation',
  'bonus': 'Bonus Reports',
  'tax-recon': 'Tax Reconciliation Report',
  'alpha-list': 'BIR Alpha List',
  'w2': 'BIR W2 Forms',
  'employee-list': 'Employee Master List',
  'personal-info': 'Personal Information Report',
  'salary-rates': 'Salary Rate Report'
}

export default function PayrollReports() {
  const { reportType } = useParams<{ reportType: string }>()
  const reportTitle = reportTitles[reportType || ''] || 'Payroll Report'
  
  const [period, setPeriod] = useState('2026-02')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<ReportPreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const preferredKeys = useMemo(() => {
    const type = reportType || ''
    switch (type) {
      case 'employee-list':
      case 'personal-info':
      case 'salary-rates':
        return ['pay_master', 'pay_masterfile']
      case 'loan-deductions':
        return ['pay_history', 'pay_prempaid']
      case 'monthly-contributions':
      case 'quarterly-sss':
      case 'quarterly-pbg':
      case 'phic-remittance':
        return ['pay_premmast', 'pay_ssstable', 'pay_phitable']
      case 'monthly-tax':
      case 'quarterly-tax':
      case 'tax-recon':
      case 'alpha-list':
      case 'w2':
        return ['pay_taxtab', 'pay_taxdue', 'pay_oldtax']
      default:
        return ['pay_tmcard', 'pay_history', 'pay_master']
    }
  }, [reportType])

  const refreshPreview = async () => {
    setPreviewLoading(true)
    setPreviewError('')

    const [year, month] = period.split('-')
    const dateFrom = `${year}-${month}-01`
    const dateTo = `${year}-${month}-31`

    const payload = await buildLegacyReportPreview({
      title: reportTitle,
      preferredKeys,
      dateFrom,
      dateTo
    })

    if (!payload) {
      setPreview(null)
      setPreviewError('Legacy migrated data not found. Run npm run import:legacy first.')
      setPreviewLoading(false)
      return
    }

    setPreview(payload)
    setPreviewLoading(false)
  }

  useEffect(() => {
    void refreshPreview()
  }, [period, preferredKeys, reportTitle])

  const handleGenerate = (format: 'pdf' | 'excel' | 'csv') => {
    if (!preview) {
      setPreviewError('No preview data available to export.')
      return
    }

    setGenerating(true)
    const baseName = `${reportType || 'payroll-report'}-${period}`

    try {
      if (format === 'pdf') {
        downloadPreviewAsPdf(preview, `${baseName}.pdf`)
      } else if (format === 'excel') {
        downloadPreviewAsExcel(preview, `${baseName}.xlsx`)
      } else {
        downloadPreviewAsCsv(preview, `${baseName}.csv`)
      }
    } catch (error) {
      console.error(`Error generating ${format} report:`, error)
      setPreviewError(`Failed to generate ${format.toUpperCase()} file. Check console for details.`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="card">
      <h2>{reportTitle}</h2>
      <p className="subtitle">Generate payroll report with export options</p>

      <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Report Parameters</h4>
        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Period</label>
            <input
              type="month"
              className="form-input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Employee Range</label>
            <select className="form-input">
              <option>All Employees</option>
              <option>By Department</option>
              <option>By Employee Number</option>
              <option>Selected Employees</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select className="form-input">
              <option>Employee Number</option>
              <option>Employee Name</option>
              <option>Department</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--panel-2)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Export Options</h4>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => void refreshPreview()}
            disabled={previewLoading}
          >
            🔄 Refresh Preview
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleGenerate('pdf')}
            disabled={generating}
          >
            📄 Generate PDF
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleGenerate('excel')}
            disabled={generating}
          >
            📊 Export to Excel
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleGenerate('csv')}
            disabled={generating}
          >
            📋 Export to CSV
          </button>
        </div>
        {generating && (
          <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Generating report...
          </div>
        )}
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Report Preview</h4>
        {previewLoading && <p style={{ color: 'var(--text-secondary)' }}>Loading preview...</p>}
        {!previewLoading && previewError && <p style={{ color: 'var(--error)' }}>{previewError}</p>}
        {!previewLoading && preview && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
              Source: {preview.sourceTable} | Rows shown: {preview.rows.length}
            </p>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {preview.columns.map(column => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, idx) => (
                    <tr key={idx}>
                      {preview.columns.map(column => (
                        <td key={`${idx}-${column}`}>{String(row[column] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
