import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useSystemHealth, useSystemTelemetry } from '../hooks/useSystemHealth'

function humanizeAudit(
  eventType: string, resource: string, success: boolean,
  details: string | null, username: string | null
): string {
  const user = username || 'System'
  const evt = eventType.toLowerCase()
  const res = friendlyResource(resource)
  const company = extractCompany(details)
  const companyTag = company ? ` [${company}]` : ''
  const statusTag = !success ? ' (failed)' : ''

  // Authentication events
  if (evt === 'login' && success) return `${user} signed in successfully`
  if (evt === 'login' && !success) {
    if (details?.includes('Locked out')) return `${user} was locked out after too many failed attempts`
    if (details?.includes('Invalid password')) return `${user} entered an incorrect password`
    if (details?.includes('Unknown')) return `Sign-in attempt with unknown username "${username || '?'}"`
    return `${user} failed to sign in`
  }
  if (evt === 'logout') return `${user} signed out`
  if (evt === 'refresh') return `${user}'s session was refreshed`

  // CRUD operations
  if (evt === 'create') return `${user} created a new ${res} entry${companyTag}${statusTag}`
  if (evt === 'update') return `${user} updated a ${res} record${companyTag}${statusTag}`
  if (evt === 'delete') return `${user} deleted a ${res} record${companyTag}${statusTag}`
  if (evt === 'restore') return `${user} restored a ${res} record from recycle bin${companyTag}`

  // Batch / processing operations
  if (evt === 'clone') return `${user} cloned a ${res} record${companyTag}`
  if (evt === 'post') return `${user} posted all transactions${companyTag}`
  if (evt === 'month-end') return `${user} ran month-end processing${companyTag}`
  if (evt === 'backup') return `${user} created a database backup`
  if (evt === 'import') return `${user} imported data into ${res}${companyTag}`
  if (evt === 'export') return `${user} exported data from ${res}${companyTag}`

  // Legacy fallback for old api_write entries
  if (evt === 'api_write') return `${user} made a data change in ${res}${companyTag}${statusTag}`

  // Generic fallback
  return `${user} performed "${evt}" on ${res}${companyTag}${statusTag}`
}

function extractCompany(details: string | null): string | null {
  if (!details) return null
  const match = details.match(/company=([^;]+)/)
  return match ? match[1] : null
}

function friendlyResource(resource: string): string {
  if (!resource) return 'the system'
  const r = resource.toLowerCase().replace(/^\//, '')

  // New middleware format: "module/entity" or "module/entity/sub-entity"
  const resourceMap: Record<string, string> = {
    // FS module
    'fs/accounts': 'Chart of Accounts',
    'fs/vouchers/masters': 'Check Disbursement (Header)',
    'fs/vouchers/lines': 'Check Disbursement (Line Item)',
    'fs/vouchers/restore': 'Check Disbursement',
    'fs/vouchers/clone': 'Check Disbursement',
    'fs/vouchers': 'Check Disbursement',
    'fs/journals/receipts': 'Cash Receipt',
    'fs/journals/sales': 'Sales Book',
    'fs/journals/general': 'Journal Voucher',
    'fs/journals/purchase': 'Purchase Book',
    'fs/journals/adjustments': 'Adjustment',
    'fs/journals': 'Journal Entry',
    'fs/posting': 'Transaction Posting',
    'fs/month-end': 'Month-End Processing',
    'fs/backup': 'Database Backup',
    'fs/banks': 'Bank',
    'fs/suppliers': 'Supplier',
    'fs/signatories': 'Signatory',
    'fs/system-info': 'System Info',
    // Payroll module
    'payroll/employees': 'Employee',
    'payroll/timecards': 'Timecard',
    'payroll/departments': 'Department',
    'payroll/tax-table': 'Tax Table',
    'payroll/computation': 'Payroll Computation',
    'payroll/premium': 'Premium Payment',
    'payroll/system-info': 'Payroll System Info',
    // Admin module
    'admin/users': 'User Account',
    'admin/import': 'Data Import',
    'admin/audit-logs': 'Audit Logs',
  }

  for (const [key, label] of Object.entries(resourceMap)) {
    if (r.startsWith(key)) return label
  }

  // Fallback: clean up the path
  const segments = r.split('/')
  if (segments.length >= 2) return segments.slice(0, 2).join(' / ')
  return r || 'the system'
}

function formatAuditTime(utcStr: string): string {
  // SQLite dates might lack 'Z'. Append it to ensure it's parsed as UTC.
  const safeStr = utcStr.endsWith('Z') ? utcStr : `${utcStr}Z`
  const date = new Date(safeStr)
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

function AnimatedNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value < 0) { setDisplay(value); return }
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) { setDisplay(value); clearInterval(timer) }
      else setDisplay(current)
    }, 20)
    return () => clearInterval(timer)
  }, [value])
  return <>{display < 0 ? '—' : `${decimals ? display.toFixed(decimals) : Math.round(display)}${suffix}`}</>
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const h = 40
  const w = 200
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,${h} ${points} ${w},${h}`

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) / (data.length - 1) * w}
          cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
          r="3" fill={color}
        />
      )}
    </svg>
  )
}

function UptimeDisplay({ seconds }: { seconds: number }) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return (
    <div className="flex items-baseline gap-1 font-mono">
      {days > 0 && <><span className="text-3xl font-black">{days}</span><span className="text-sm opacity-60">d</span></>}
      <span className="text-3xl font-black">{String(hours).padStart(2, '0')}</span>
      <span className="text-sm opacity-60">h</span>
      <span className="text-3xl font-black">{String(mins).padStart(2, '0')}</span>
      <span className="text-sm opacity-60">m</span>
      <span className="text-3xl font-black">{String(secs).padStart(2, '0')}</span>
      <span className="text-sm opacity-60">s</span>
    </div>
  )
}

function InteractiveTimeline({ logs, darkMode }: { logs: any[], darkMode: boolean }) {
  const [hoverData, setHoverData] = useState<{ x: number, y: number, px: number, log: any } | null>(null)
  
  if (!logs || logs.length === 0) {
    return <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>No recent logs</div>
  }

  // Reverse so oldest is first (left to right)
  const sortedLogs = [...logs].reverse()
  const h = 90

  // We map the X axis across the pure 24-hour day
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000

  const getPercentX = (ts: string) => {
    const t = new Date(ts.endsWith('Z') ? ts : ts + 'Z').getTime()
    return Math.max(0, Math.min(100, ((t - startOfDay) / (endOfDay - startOfDay)) * 100))
  }

  const getYPercent = (log: any, i: number) => {
    const evt = (log.eventType || '').toLowerCase()
    let base = 50
    if (evt === 'login' || evt === 'logout') base = 20
    else if (evt === 'create' || evt === 'delete') base = 80
    
    // Slight stagger so multiple rapid events don't totally eclipse each other
    const stagger = (i % 3 - 1) * 10
    return Math.max(10, Math.min(90, base + stagger))
  }

  const handleNodeClick = (logId: number) => {
    const el = document.getElementById(`audit-log-${logId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bg-amber-500/20')
      setTimeout(() => el.classList.remove('bg-amber-500/20'), 2000)
    }
  }

  return (
    <div className="relative group w-full px-2" style={{ height: h }}>
      {/* Background Grid Lines representing quarters of the day */}
      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20" style={{ zIndex: 0 }}>
        {[0, 1, 2, 3, 4].map(idx => (
          <div key={idx} className={`h-full w-px border-l border-dashed ${darkMode ? 'border-gray-500' : 'border-slate-400'}`} />
        ))}
      </div>
      
      {/* Container for SVGs and tooltips */}
      <div className="relative w-full h-full z-10" 
           onMouseLeave={() => setHoverData(null)}>
        {sortedLogs.map((log, i) => {
          const px = getPercentX(log.createdAtUtc)
          const py = getYPercent(log, i)
          const fill = log.success ? (darkMode ? '#10b981' : '#10b981') : (darkMode ? '#ef4444' : '#ef4444')
          return (
            <div
              key={log.id}
              className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full cursor-pointer transition-transform duration-200 hover:scale-150 ring-2 ${darkMode ? 'ring-[#1e293b]' : 'ring-white'}`}
              style={{ left: `${px}%`, top: `${py}%`, backgroundColor: fill }}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect()
                const clickX = rect ? (px / 100) * rect.width : 0
                setHoverData({ x: px, px: clickX, y: py, log })
              }}
              onClick={() => handleNodeClick(log.id)}
            />
          )
        })}
      </div>

      {/* Tooltip Overlay */}
      {hoverData && (
        <div 
          className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-full z-50 p-3 rounded-xl shadow-xl border w-64 backdrop-blur-md transition-all ${
            darkMode ? 'bg-[#1e293b]/95 border-gray-600 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
          style={{ 
            left: `${hoverData.x}%`, 
            top: `calc(${hoverData.y}% - 12px)`,
            // Prevent tooltip from overflowing screen left/right
            transform: hoverData.px < 130 ? 'translate(0%, -100%)' : (hoverData.px > (window.innerWidth - 130) ? 'translate(-100%, -100%)' : 'translate(-50%, -100%)')
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-2 h-2 rounded-full ${hoverData.log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{hoverData.log.eventType}</span>
          </div>
          <div className="text-sm font-medium leading-snug line-clamp-3 mb-1.5">
             {humanizeAudit(hoverData.log.eventType, hoverData.log.resource, hoverData.log.success, hoverData.log.details, hoverData.log.username)}
          </div>
          <div className={`text-[10px] font-mono ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            {formatAuditTime(hoverData.log.createdAtUtc)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SystemHealth() {
  const darkMode = useSettingsStore(s => s.darkMode)
  const { health, latencyMs, latencyHistory, memoryHistory, isLoading: healthLoading, refetch } = useSystemHealth(10000)
  const { telemetry, sessionHistory, isLoading: telLoading } = useSystemTelemetry(15000)
  const [liveUptime, setLiveUptime] = useState(0)

  // Live uptime ticker
  useEffect(() => {
    if (!health) return
    setLiveUptime(health.uptimeSeconds)
    const interval = setInterval(() => setLiveUptime(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [health?.uptimeSeconds])

  const statusColor = (s?: string) => {
    switch (s) {
      case 'healthy': return { bg: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/30', bgLight: 'bg-emerald-500/10' }
      case 'degraded': return { bg: 'bg-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/30', bgLight: 'bg-amber-500/10' }
      default: return { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/30', bgLight: 'bg-red-500/10' }
    }
  }

  const sc = statusColor(health?.status)

  const card = `rounded-2xl border p-6 transition-all ${
    darkMode ? 'bg-[#1e293b]/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
  }`

  const label = `text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Connecting to backend services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold mb-1">System Health & Telemetry</h2>
          <p className={darkMode ? 'text-gray-400 text-sm' : 'text-slate-500 text-sm'}>
            Real-time infrastructure monitoring for the AWM platform.
          </p>
        </div>
        <button onClick={refetch} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
        }`}>
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Status Hero Bar */}
      <div className={`${card} relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${sc.bg}`} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl ${sc.bgLight} flex items-center justify-center relative`}>
              <div className={`absolute inset-0 rounded-2xl ${sc.bg} opacity-20 animate-ping`} style={{ animationDuration: '3s' }} />
              <span className={`material-symbols-outlined text-[32px] ${sc.text}`}>
                {health?.status === 'healthy' ? 'check_circle' : health?.status === 'degraded' ? 'warning' : 'error'}
              </span>
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold capitalize">{health?.status ?? 'Unknown'}</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                All systems {health?.status === 'healthy' ? 'operational' : 'require attention'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={label}>UPTIME</div>
            <UptimeDisplay seconds={liveUptime} />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* API Latency */}
        <div className={card}>
          <div className={label}>API LATENCY</div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`text-3xl font-black font-mono ${
              latencyMs < 100 ? 'text-emerald-500' : latencyMs < 300 ? 'text-amber-500' : 'text-red-500'
            }`}>
              <AnimatedNumber value={latencyMs} />
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>ms</span>
          </div>
          <div className="mt-3">
            <MiniSparkline data={latencyHistory} color={latencyMs < 100 ? '#10b981' : latencyMs < 300 ? '#f59e0b' : '#ef4444'} />
          </div>
        </div>

        {/* Database */}
        <div className={card}>
          <div className={label}>DATABASE</div>
          <div className="mt-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${health?.checks.database.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg ${
              health?.checks.database.status === 'healthy' ? 'shadow-emerald-500/40' : 'shadow-red-500/40'
            }`} />
            <span className={`text-xl font-bold capitalize ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}>
              {health?.checks.database.status ?? '—'}
            </span>
          </div>
          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
            Query latency: <strong>{health?.checks.database.latencyMs ?? '—'}ms</strong>
          </p>
        </div>

        {/* Storage */}
        <div className={card}>
          <div className={label}>STORAGE</div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`text-3xl font-black font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <AnimatedNumber value={health?.checks.diskUsage.dbFileSizeMb ?? 0} decimals={1} />
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>MB</span>
          </div>
          {/* Progress bar (assuming 500MB capacity) */}
          <div className={`mt-3 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
              style={{ width: `${Math.min(((health?.checks.diskUsage.dbFileSizeMb ?? 0) / 500) * 100, 100)}%` }}
            />
          </div>
          <p className={`text-[10px] mt-1.5 ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>of 500 MB capacity</p>
        </div>

        {/* Memory */}
        <div className={card}>
          <div className={label}>MEMORY (PROCESS)</div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`text-3xl font-black font-mono ${
              (health?.checks.runtime.memoryMb ?? 0) < 200 ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              <AnimatedNumber value={health?.checks.runtime.memoryMb ?? 0} decimals={1} />
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>MB</span>
          </div>
          <div className="mt-2 text-[10px] font-mono flex items-center justify-between">
            <span className={darkMode ? 'text-gray-600' : 'text-slate-400'}>
              GC Gen0: {health?.checks.runtime.gcGen0} · Gen1: {health?.checks.runtime.gcGen1} · Gen2: {health?.checks.runtime.gcGen2}
            </span>
          </div>
          <div className="mt-3">
            <MiniSparkline data={memoryHistory} color={(health?.checks.runtime.memoryMb ?? 0) < 200 ? '#10b981' : '#f59e0b'} />
          </div>
        </div>
      </div>

      {/* Extended Telemetry */}
      {!telLoading && telemetry && (
        <>
          {/* Session & User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={card}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <span className="material-symbols-outlined text-blue-500 text-[22px]">group</span>
                </div>
                <div className={label}>ACTIVE SESSIONS</div>
              </div>
              <span className={`text-4xl font-black font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <AnimatedNumber value={telemetry.activeSessionCount} />
              </span>
              <div className="mt-3">
                <MiniSparkline data={sessionHistory} color="#3b82f6" />
              </div>
            </div>

            <div className={card}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <span className="material-symbols-outlined text-purple-500 text-[22px]">person</span>
                </div>
                <div className={label}>REGISTERED USERS</div>
              </div>
              <span className={`text-4xl font-black font-mono ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                <AnimatedNumber value={telemetry.totalUsers} />
              </span>
            </div>

            <div className={card}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <span className="material-symbols-outlined text-emerald-500 text-[22px]">domain</span>
                </div>
                <div className={label}>ORGANIZATIONS</div>
              </div>
              <span className={`text-4xl font-black font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <AnimatedNumber value={telemetry.totalCompanies} />
              </span>
            </div>
          </div>

          {/* Audit & Table Row Counts */}
          <div className="grid grid-cols-1 gap-4">
            {/* Table Row Counts */}
            <div className={card}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`material-symbols-outlined text-[20px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>table_chart</span>
                <div className={label}>DB TABLE ROWS</div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-8 gap-2">
                {Object.entries(telemetry.tableRowCounts).map(([table, count]) => {
                  const shortName = table.replace('fs_', '').replace('pay_', 'P:')
                  return (
                    <div key={table} className={`px-2.5 py-2 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-slate-50 border-slate-200/50'}`}>
                      <div className={`text-[8px] font-bold uppercase tracking-widest truncate ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                        {shortName}
                      </div>
                      <div className={`text-base font-black font-mono mt-0.5 ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                        {count < 0 ? '—' : count.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Audit Trail — Hourly Area Chart */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">security</span>
                  <div className={label}>AUDIT EVENTS (24H)</div>
                </div>
                <span className={`text-2xl font-black font-mono ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  <AnimatedNumber value={telemetry.recentAuditEvents} />
                </span>
              </div>
              <div className="mt-4 border-b border-t py-4 relative">
                 <InteractiveTimeline logs={telemetry.recentLogs || []} darkMode={darkMode} />
              </div>
              <div className="flex justify-between mt-2 px-2">
                <span className={`text-[9px] font-mono font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>00:00 (Midnight)</span>
                <span className={`text-[9px] font-mono ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>06:00</span>
                <span className={`text-[9px] font-mono ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>12:00</span>
                <span className={`text-[9px] font-mono ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>18:00</span>
                <span className={`text-[9px] font-mono font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>24:00</span>
              </div>
            </div>
          </div>

          {/* Recent Audit Log Feed */}
                {telemetry?.recentLogs && telemetry.recentLogs.length > 0 && (
            <div className={card}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">history</span>
                <div className={label}>RECENT ACTIVITY</div>
              </div>
              <div className="space-y-1 max-h-[480px] overflow-y-auto">
                {telemetry.recentLogs.map(log => {
                  const humanDetail = humanizeAudit(log.eventType, log.resource, log.success, log.details, log.username)
                  const formattedTime = formatAuditTime(log.createdAtUtc)
                  return (
                    <div 
                      id={`audit-log-${log.id}`}
                      key={log.id} 
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-500 ${
                      darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-slate-50'
                    }`}>
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm leading-snug ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                          {humanDetail}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          {formattedTime} · {log.ipAddress ?? 'unknown IP'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Last updated footer */}
      <div className={`text-center text-[10px] font-mono ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
        Last polled: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'} · Auto-refresh: 10s
      </div>
    </div>
  )
}
