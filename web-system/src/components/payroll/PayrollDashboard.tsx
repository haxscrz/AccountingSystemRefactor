import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

interface AuditLog {
  id?: number
  action: string
  details?: string
  createdAt?: string
  userName?: string
}

interface PayrollDashboardProps {
  payrollType: 'regular' | 'casual'
  statusPeriod: string
  onSwitchType: () => void
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function PayrollDashboard({ payrollType, statusPeriod, onSwitchType }: PayrollDashboardProps) {
  const navigate = useNavigate()
  const typeLabel = payrollType === 'regular' ? 'Regular Payroll' : 'Casual Payroll'

  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/payroll/system-id').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/payroll/audit-logs?limit=5').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([sysData, logsData]) => {
      if (sysData) setSysInfo(sysData)
      // Audit logs may return array or {data: [...]}
      const logs = Array.isArray(logsData) ? logsData : (logsData?.data ?? logsData?.items ?? [])
      if (logs.length > 0) setAuditLogs(logs.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [payrollType])

  const statusLabel = sysInfo
    ? (sysInfo.trnPrc === sysInfo.trnUpd && sysInfo.trnPrc > 0
        ? 'Posted'
        : sysInfo.trnPrc === sysInfo.trnCtr && sysInfo.trnCtr > 0
          ? 'Computed'
          : sysInfo.tcCount > 0 ? 'In Progress' : 'Not Started')
    : '—'

  const periodLabel = sysInfo
    ? `${MONTHS[sysInfo.presMo] ?? sysInfo.presMo} ${sysInfo.presYr}`
    : statusPeriod

  function formatLogTime(ts?: string): string {
    if (!ts) return '—'
    try {
      const d = new Date(ts)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return 'Just now'
      if (diffMin < 60) return `${diffMin}m ago`
      const diffH = Math.floor(diffMin / 60)
      if (diffH < 24) return `${diffH}h ago`
      const diffD = Math.floor(diffH / 24)
      if (diffD === 1) return 'Yesterday'
      return `${diffD} days ago`
    } catch {
      return ts
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-10">

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-display-md font-headline font-bold text-primary mb-2">Payroll Dashboard</h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
            Active payroll cycle management. Review pending timecards, trigger computation, and post transactions for the current period.
          </p>
        </div>

        {/* Active Period Widget */}
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 flex gap-12 items-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] flex-shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/70 mb-1">Active Period</div>
            <div className="flex items-center gap-2 font-headline text-lg font-bold text-on-surface">
              <span className="material-symbols-outlined">calendar_today</span>
              {loading ? <span className="w-24 h-5 bg-outline-variant/20 animate-pulse rounded" /> : periodLabel}
            </div>
          </div>
          <div className="h-10 w-px bg-outline-variant/20"></div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/70 mb-1">Type</div>
            <div className="text-[13px] font-bold text-[#3f89ff] tracking-wide uppercase">{payrollType}</div>
          </div>
        </div>
      </div>

      {/* Active Session Banner */}
      <div className="bg-[#05111E] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-full flex flex-col justify-end p-8 gap-3">
            <div className="bg-white h-2 w-3/4 rounded-full ml-auto"></div>
            <div className="bg-white h-2 w-1/2 rounded-full ml-auto"></div>
            <div className="bg-white h-2 w-2/3 rounded-full ml-auto"></div>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-4">Active Session</div>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-headline font-semibold text-white mb-2">
              {typeLabel} — {periodLabel}
            </h2>
            <p className="text-sm text-white/60 max-w-md leading-relaxed">
              Status: <span className="font-bold text-white/80">{statusLabel}</span>. 
              {sysInfo && sysInfo.empCount > 0 ? ` ${sysInfo.empCount} employees, ${sysInfo.tcCount} timecards in system.` : ' System is ready for entry.'}
            </p>
            <button 
              onClick={onSwitchType}
              className="mt-5 px-4 py-2 border border-white/20 text-white/80 hover:text-white hover:border-white/60 rounded-md text-xs font-bold tracking-wider transition-all"
            >
              ↕ Switch Type
            </button>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Timecards</div>
            {loading ? (
              <div className="w-16 h-14 bg-white/10 animate-pulse rounded" />
            ) : (
              <>
                <div className="text-6xl font-extrabold font-headline text-white tracking-tighter leading-none">
                  {sysInfo?.tcCount ?? 0}
                </div>
                <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">
                  {(sysInfo?.tcCount ?? 0) > 0 ? 'In System' : 'No Timecards'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-6 flex items-center">
          <span className="mr-4">Quick Actions</span>
          <div className="h-px bg-outline-variant/15 flex-grow"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Timecard Entry */}
          <button
            onClick={() => navigate('/payroll/timecard')}
            className="group text-left bg-white rounded-2xl p-6 border border-outline-variant/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
            </div>
            <h3 className="font-headline font-bold text-base text-on-surface mb-1">Timecard Entry</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Input daily attendance, overtime, and leave adjustments for the current cycle.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </button>

          {/* Compute Payroll */}
          <button
            onClick={() => navigate('/payroll/compute')}
            className="group text-left bg-white rounded-2xl p-6 border border-outline-variant/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">calculate</span>
            </div>
            <h3 className="font-headline font-bold text-base text-on-surface mb-1">Compute Payroll</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Run batch calculation engine to generate gross and net pay values for all timecards.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </button>

          {/* Employee Master */}
          <button
            onClick={() => navigate('/payroll/employees')}
            className="group text-left bg-white rounded-2xl p-6 border border-outline-variant/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">person_search</span>
            </div>
            <h3 className="font-headline font-bold text-base text-on-surface mb-1">Employee Master</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Manage employee profiles, tax status, bank accounts, and salary grades.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </button>

        </div>
      </div>

      {/* System Logs Section */}
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-6 flex items-center">
          <span className="mr-4">System Logs &amp; Transactions</span>
          <div className="h-px bg-outline-variant/15 flex-grow"></div>
        </div>
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 px-6 py-3 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            <span>Action</span>
            <span>Details</span>
            <span>User</span>
            <span className="text-right">Time</span>
          </div>
          {/* Rows */}
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="grid grid-cols-4 px-6 py-4 border-t border-outline-variant/10 gap-4">
                {[1,2,3,4].map(j => (
                  <div key={j} className="h-4 bg-outline-variant/20 animate-pulse rounded" />
                ))}
              </div>
            ))
          ) : auditLogs.length > 0 ? (
            auditLogs.map((log, i) => (
              <div
                key={log.id ?? i}
                className="grid grid-cols-4 px-6 py-4 border-t border-outline-variant/10 hover:bg-surface-container-lowest/60 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#3f89ff]"></span>
                  <span className="font-medium text-on-surface">{log.action}</span>
                </div>
                <span className="font-mono text-on-surface-variant text-xs self-center truncate">
                  {log.details ?? '—'}
                </span>
                <span className="text-on-surface-variant text-xs self-center">{log.userName ?? 'system'}</span>
                <span className="text-right text-xs text-on-surface-variant/60 self-center">
                  {formatLogTime(log.createdAt)}
                </span>
              </div>
            ))
          ) : (
            // Fallback static display when no logs in API yet
            [
              { action: 'System Ready', details: payrollType + ' payroll', userName: 'system', time: 'Now' },
            ].map((log, i) => (
              <div
                key={i}
                className="grid grid-cols-4 px-6 py-4 border-t border-outline-variant/10 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-outline-variant/30"></span>
                  <span className="font-medium text-on-surface">{log.action}</span>
                </div>
                <span className="font-mono text-on-surface-variant text-xs self-center">{log.details}</span>
                <span className="text-on-surface-variant text-xs self-center">{log.userName}</span>
                <span className="text-right text-xs text-on-surface-variant/60 self-center">{log.time}</span>
              </div>
            ))
          )}
          {/* Footer */}
          <div className="px-6 py-3 bg-surface-container-lowest border-t border-outline-variant/10">
            <button
              onClick={() => navigate('/payroll/reports/register')}
              className="text-xs font-bold text-primary/70 hover:text-primary transition-colors tracking-wide uppercase"
            >
              View Payroll Register →
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
