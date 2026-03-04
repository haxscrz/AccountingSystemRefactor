import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { buildLegacyReportPreview, downloadPreviewAsCsv, downloadPreviewAsExcel, downloadPreviewAsPdf, type ReportPreviewData } from '../../services/legacyData'

// â”€â”€ Sub-option definitions (from PAY.PRG) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SUB_OPTIONS: Record<string, { label: string; key: string }[]> = {
  payslip: [
    { label: 'All Pay Slips w/ Summary', key: 'all' },
    { label: 'Selected Pay Slips',       key: 'selected' },
    { label: 'Pay Slip Summary Only',    key: 'summary' },
    { label: 'ATM Payroll Summary',      key: 'atm' },
  ],
  monthly: [
    { label: 'Monthly Payroll Recap',           key: 'recap' },
    { label: 'Monthly SSS/PHIC/EC/PGBG/Tax',    key: 'all' },
    { label: 'Monthly SSS/PHIC/EC/PGBG',        key: 'pbg' },
    { label: 'Monthly SSS, PHIC & EC',          key: 'sss-phic-ec' },
    { label: 'Monthly SSS & EC',                key: 'sss-ec' },
    { label: 'Monthly Philhealth',              key: 'phic' },
    { label: 'Monthly Pag-Ibig',               key: 'pagibig' },
    { label: 'Monthly Tax Withheld',            key: 'tax' },
    { label: 'Monthly Dept. Summary',           key: 'dept' },
    { label: 'Monthly Loan Deduction Summary',  key: 'loan' },
    { label: 'SSS-LMS Diskette Project',        key: 'sss-lms' },
    { label: 'SSS R-3 Tape Diskette Project',   key: 'sss-r3' },
    { label: 'HDMF Loan Diskette Project',      key: 'hdmf' },
    { label: 'Philhealth Regular RF-1',         key: 'rf1' },
  ],
  quarterly: [
    { label: 'Quarterly SSS, Philhealth & EC',   key: 'sss-phic-ec' },
    { label: 'Quarterly Pag-Ibig Premium',       key: 'pbg' },
    { label: 'Quarterly Withholding Tax',        key: 'tax' },
    { label: 'Quarterly SSS Loan Payments',      key: 'sss-loan' },
    { label: 'Quarterly Pag-Ibig Loan Payments', key: 'pbg-loan' },
    { label: 'PHIC Remittance (Hard Copy)',       key: 'phic-hard' },
    { label: 'PHIC Remittance (Diskette)',        key: 'phic-disk' },
  ],
  'employee-master': [
    { label: 'Employee Master List',   key: 'list' },
    { label: 'Personal Information',   key: 'personal' },
    { label: 'Employee Salary Rate',   key: 'salary' },
    { label: 'Employee Loan Balance',  key: 'loan' },
    { label: 'Employee VL/SL Balance', key: 'vlsl' },
  ],
  bonus: [
    { label: 'Advance Bonus P.Slip/Sheet',   key: 'advance' },
    { label: 'Bonus Pay Sheet',              key: 'sheet' },
    { label: 'Bonus ATM Summary',            key: 'atm' },
    { label: 'All Bonus Slips w/ Summary',   key: 'all' },
    { label: 'Selected Bonus Slips',         key: 'selected' },
    { label: 'Bonus Slip Summary Only',      key: 'summary' },
    { label: 'Denomination Breakdown',       key: 'den' },
  ],
  'year-end-tax': [
    { label: "Tax Recon - Emp.'s Taxable Income",     key: 'recon-taxable' },
    { label: "Tax Recon - Emp.'s Non-Taxable Income", key: 'recon-nontaxable' },
    { label: 'Tax Refund Report',                     key: 'refund' },
    { label: 'Tax Refund Denomination Breakdown',     key: 'refund-den' },
    { label: 'Tax Refund Slip',                       key: 'refund-slip' },
    { label: 'BIR Tax Withheld Report',               key: 'bir-withheld' },
    { label: 'Individual BIR W2 Form',                key: 'w2' },
    { label: 'Alpha List',                            key: 'alpha' },
    { label: 'Form 1604CF - Schedule 7.3',            key: '1604cf-73' },
    { label: 'Form 1604CF - Schedule 7.1',            key: '1604cf-71' },
  ],
  'premium-cert': [
    { label: 'SSS Premium Payment Certification',      key: 'sss' },
    { label: 'Medicare Premium Payment Certification', key: 'med' },
    { label: 'Pag-Ibig Premium Payment Certification', key: 'pbg' },
    { label: 'All Premiums Payment Certification',     key: 'all' },
  ],
}

const REPORT_TITLES: Record<string, string> = {
  'timecard-validation': 'Timecard Validation',
  'register':            'Payroll Register',
  'payslip':             'Payroll Slip',
  'denomination':        'Denomination Breakdown',
  'deductions':          'Deductions Report',
  'monthly':             'Monthly Reports',
  'quarterly':           'Quarterly Reports',
  'quarterly-sss-form':  'Quarterly SSS Loan (SSS Form)',
  'yearly-recap':        'Year-End Payroll Recap',
  'employee-master':     'Employee Master File',
  'bonus':               'Bonus',
  'year-end-tax':        'Year-End Tax/Refund',
  'premium-cert':        'Premium Payment Certification',
}

// â”€â”€ Sub-option selector panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SubOptionSelector({
  parentTitle,
  options,
  onSelect,
}: {
  parentTitle: string
  options: { label: string; key: string }[]
  onSelect: (key: string, label: string) => void
}) {
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
          Report Generation
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          {parentTitle}
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map((opt, i) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key, opt.label)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              cursor: 'pointer', textAlign: 'left', transition: 'all var(--t-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 18, fontVariantNumeric: 'tabular-nums' }}>{i + 1}.</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{opt.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>&gt;</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PayrollReports() {
  const { reportType } = useParams<{ reportType: string }>()
  const [subOption, setSubOption] = useState<{ key: string; label: string } | null>(null)

  const subOptions = SUB_OPTIONS[reportType || ''] ?? []
  const parentTitle = REPORT_TITLES[reportType || ''] || 'Payroll Report'
  const activeTitle = subOption ? subOption.label : parentTitle

  // Reset sub-option when reportType changes
  useEffect(() => { setSubOption(null) }, [reportType])

  // Show sub-option selector if this report has sub-options and none is picked yet
  if (subOptions.length > 0 && !subOption) {
    return (
      <SubOptionSelector
        parentTitle={parentTitle}
        options={subOptions}
        onSelect={(key, label) => setSubOption({ key, label })}
      />
    )
  }

  // â”€â”€ Report viewer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <ReportViewer
      reportType={reportType || ''}
      subOptionKey={subOption?.key}
      title={activeTitle}
      onBack={subOptions.length > 0 ? () => setSubOption(null) : undefined}
    />
  )
}

// â”€â”€ Report viewer (existing logic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReportViewer({
  reportType,
  subOptionKey,
  title,
  onBack,
}: {
  reportType: string
  subOptionKey?: string
  title: string
  onBack?: () => void
}) {
  const [period, setPeriod] = useState('2026-02')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<ReportPreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const preferredKeys = useMemo(() => {
    switch (reportType) {
      case 'employee-master':
        return ['pay_master', 'pay_masterfile']
      case 'monthly':
        if (subOptionKey === 'loan') return ['pay_history', 'pay_prempaid']
        if (['all','pbg','sss-phic-ec','sss-ec','phic','pagibig','tax'].includes(subOptionKey || ''))
          return ['pay_premmast', 'pay_ssstable', 'pay_phitable']
        return ['pay_master', 'pay_history']
      case 'quarterly':
        return ['pay_premmast', 'pay_ssstable', 'pay_phitable']
      case 'year-end-tax':
        return ['pay_taxtab', 'pay_taxdue', 'pay_oldtax']
      case 'premium-cert':
        return ['pay_premmast', 'pay_prempaid']
      default:
        return ['pay_tmcard', 'pay_history', 'pay_master']
    }
  }, [reportType, subOptionKey])

  const refreshPreview = async () => {
    setPreviewLoading(true)
    setPreviewError('')
    const [year, month] = period.split('-')
    const payload = await buildLegacyReportPreview({
      title,
      preferredKeys,
      dateFrom: `${year}-${month}-01`,
      dateTo:   `${year}-${month}-31`,
    })
    if (!payload) {
      setPreview(null)
      setPreviewError('Legacy migrated data not found. Run npm run import:legacy first.')
    } else {
      setPreview(payload)
    }
    setPreviewLoading(false)
  }

  useEffect(() => { void refreshPreview() }, [period, preferredKeys, title])

  const handleGenerate = (format: 'pdf' | 'excel' | 'csv') => {
    if (!preview) { setPreviewError('No preview data available to export.'); return }
    setGenerating(true)
    const baseName = `${reportType}${subOptionKey ? '-' + subOptionKey : ''}-${period}`
    try {
      if (format === 'pdf')        downloadPreviewAsPdf(preview, `${baseName}.pdf`)
      else if (format === 'excel') downloadPreviewAsExcel(preview, `${baseName}.xlsx`)
      else                         downloadPreviewAsCsv(preview, `${baseName}.csv`)
    } catch (err) {
      console.error(err)
      setPreviewError(`Failed to generate ${format.toUpperCase()} file.`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="card">
      {onBack && (
        <button
          onClick={onBack}
          className="btn btn-secondary"
          style={{ marginBottom: 16, fontSize: 12 }}
        >
          â† Back
        </button>
      )}
      <h2>{title}</h2>
      <p className="subtitle">Generate payroll report with export options</p>

      <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Report Parameters</h4>
        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Period</label>
            <input type="month" className="form-input" value={period} onChange={e => setPeriod(e.target.value)} />
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
          <button className="btn btn-secondary" onClick={() => void refreshPreview()} disabled={previewLoading}>Refresh Preview</button>
          <button className="btn btn-primary"   onClick={() => handleGenerate('pdf')}   disabled={generating}>Generate PDF</button>
          <button className="btn btn-secondary" onClick={() => handleGenerate('excel')} disabled={generating}>Export to Excel</button>
          <button className="btn btn-secondary" onClick={() => handleGenerate('csv')}   disabled={generating}>Export to CSV</button>
        </div>
        {generating && <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Generating report...</div>}
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
                <thead><tr>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>{preview.columns.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}</tr>
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
