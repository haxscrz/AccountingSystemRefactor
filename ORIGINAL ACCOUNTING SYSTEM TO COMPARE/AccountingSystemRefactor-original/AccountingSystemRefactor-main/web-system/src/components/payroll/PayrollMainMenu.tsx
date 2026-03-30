import { useState, useEffect } from 'react'

interface SysInfo {
  presMo: number
  presYr: number
  payType: number
  begDate: string
  endDate: string
  trnCtr: number
  trnPrc: number
  trnUpd: number
  empCount: number
  tcCount: number
}

interface PayrollMainMenuProps {
  payrollType: 'regular' | 'casual'
}

const TYPE_COLOR = {
  regular: 'var(--primary)',
  casual:  'var(--accent)',
}

const TYPE_LABEL = {
  regular: 'Regular Employees',
  casual:  'Casual Employees',
}

const TYPE_DESC = {
  regular: 'Monthly salary computation with full statutory benefits.',
  casual:  'Daily / project-based pay with pro-rated benefits.',
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function PayrollMainMenu({ payrollType }: PayrollMainMenuProps) {
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null)
  const color = TYPE_COLOR[payrollType]

  useEffect(() => {
    fetch('/api/payroll/system-id')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSysInfo(d))
      .catch(() => {})
  }, [])

  const periodLabel = sysInfo
    ? `${MONTHS[sysInfo.presMo] ?? sysInfo.presMo} ${sysInfo.presYr}`
    : '—'

  const payTypeLabel = sysInfo
    ? (sysInfo.payType === 1 ? '1st Half' : sysInfo.payType === 2 ? '2nd Half' : 'Monthly')
    : '—'

  const statusLabel = sysInfo
    ? (sysInfo.trnPrc === sysInfo.trnUpd && sysInfo.trnPrc > 0
        ? 'Posted'
        : sysInfo.trnPrc === sysInfo.trnCtr && sysInfo.trnCtr > 0
          ? 'Computed'
          : sysInfo.tcCount > 0 ? 'In Progress' : 'Not Started')
    : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Active session banner */}
      <div style={{
        background: 'var(--surface)',
        border: `2px solid ${color}`,
        borderRadius: 'var(--radius)',
        padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: 4, background: color,
        }} />
        <div style={{ paddingLeft: 8 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color, marginBottom: 4,
          }}>
            Active Session
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            {TYPE_LABEL[payrollType]}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {TYPE_DESC[payrollType]}
          </div>
        </div>
      </div>

      {/* Period info row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {[
          { label: 'Period',     value: periodLabel },
          { label: 'Pay Type',   value: payTypeLabel },
          { label: 'Status',     value: statusLabel },
          { label: 'Employees',  value: sysInfo ? String(sysInfo.empCount) : '—' },
          { label: 'Timecards',  value: sysInfo ? String(sysInfo.tcCount) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px 14px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4,
            }}>
              {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Quick-action hint */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 18px',
        fontSize: 12, color: 'var(--text-secondary)',
        borderLeft: '3px solid var(--border-strong)',
      }}>
        Use the ribbon tabs above to process timecards, compute payroll, run reports, and manage master files.
        To switch between Regular and Casual, click <strong>Switch Type</strong> in the header.
      </div>

    </div>
  )
}

