import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useSystemHealth, useSystemTelemetry } from '../hooks/useSystemHealth'

function humanizeAudit(
  eventType: string, resource: string, success: boolean,
  details: string | null, username: string | null
): string {
  const user = username ?? 'Unknown user'
  const evt = eventType.toLowerCase()

  // Login / logout / refresh
  if (evt === 'login' && success) return `${user} signed in successfully`
  if (evt === 'login' && !success) {
    if (details?.includes('Locked out')) return `${user} was locked out after too many attempts`
    if (details?.includes('Invalid password')) return `${user} entered an incorrect password`
    if (details?.includes('Unknown')) return `Sign-in attempt with unknown username "${username ?? ''}"`
    return `${user} failed to sign in`
  }
  if (evt === 'logout') return `${user} signed out`
  if (evt === 'refresh') return `${user}'s session was refreshed`

  // Data operations
  if (evt === 'create') return `${user} created a new record in ${friendlyResource(resource)}`
  if (evt === 'update') return `${user} updated a record in ${friendlyResource(resource)}`
  if (evt === 'delete') return `${user} deleted a record from ${friendlyResource(resource)}`
  if (evt === 'post') return `${user} posted transactions in ${friendlyResource(resource)}`
  if (evt === 'import') return `${user} imported data into ${friendlyResource(resource)}`
  if (evt === 'export') return `${user} exported data from ${friendlyResource(resource)}`
  if (evt === 'backup') return `${user} created a database backup`
  if (evt === 'month-end') return `${user} ran month-end processing`

  // Fallback — strip SQL/technical content
  if (details && (details.includes('SELECT') || details.includes('INSERT') || details.includes('UPDATE') || details.includes('DELETE'))) {
    return `${user} performed a ${evt} operation on ${friendlyResource(resource)}`
  }

  // Generic
  const plainDetails = details && details.length < 80 && !details.includes('SELECT') ? ` — ${details}` : ''
  return `${user} performed "${evt}" on ${friendlyResource(resource)}${plainDetails}`
}

function friendlyResource(resource: string): string {
  if (!resource) return 'the system'
  // Strip API prefix
  const r = resource.replace(/^\/api\/(fs|admin|auth|health|payroll)\//, '')
  const map: Record<string, string> = {
    'login': 'authentication',
    'logout': 'session',
    'refresh': 'session',
    'checkmas': 'Check Disbursement',
    'checkvou': 'Check Vouchers',
    'cashrcpt': 'Cash Receipts',
    'salebook': 'Sales Book',
    'purcbook': 'Purchase Book',
    'journals': 'Journal Vouchers',
    'adjstmnt': 'Adjustments',
    'accounts': 'Chart of Accounts',
    'posting': 'Transaction Posting',
    'month-end': 'Month-End Processing',
    'audit-logs': 'Audit Logs',
    'users': 'User Management',
    'backup': 'Database Backup',
  }
  for (const [key, label] of Object.entries(map)) {
    if (r.includes(key)) return label
  }
  return r.split('/')[0] || 'the system'
}

function getTimeAgo(utcStr: string): string {
  const diff = Date.now() - new Date(utcStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Audit Trail — Hourly Bar Chart */}
            <div className={`${card} lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">security</span>
                  <div className={label}>AUDIT EVENTS (24H)</div>
                </div>
                <span className={`text-2xl font-black font-mono ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  <AnimatedNumber value={telemetry.recentAuditEvents} />
                </span>
              </div>
              {/* Hourly bar chart */}
              {telemetry.auditByHour && telemetry.auditByHour.length > 0 ? (() => {
                const data = telemetry.auditByHour
                const maxVal = Math.max(...data, 1)
                const nowHour = new Date().getHours()
                return (
                  <div className="flex items-end gap-[3px]" style={{ height: '80px' }}>
                    {data.map((count, hour) => {
                      const pct = (count / maxVal) * 100
                      const isCurrent = hour === nowHour
                      return (
                        <div
                          key={hour}
                          className="flex-1 rounded-t-sm transition-all relative group cursor-pointer"
                          style={{
                            height: `${Math.max(pct, 2)}%`,
                            background: isCurrent
                              ? 'linear-gradient(to top, #f59e0b, #fbbf24)'
                              : darkMode ? 'rgba(251,191,36,0.25)' : 'rgba(245,158,11,0.2)',
                            minWidth: '4px'
                          }}
                          title={`${String(hour).padStart(2,'0')}:00 — ${count} event${count !== 1 ? 's' : ''}`}
                        >
                          {isCurrent && (
                            <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                              {count}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })() : (
                <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>No audit data available</div>
              )}
              <div className="flex justify-between mt-1.5">
                <span className={`text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>00:00</span>
                <span className={`text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>12:00</span>
                <span className={`text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>23:00</span>
              </div>
            </div>

            {/* Table Row Counts */}
            <div className={card}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`material-symbols-outlined text-[20px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>table_chart</span>
                <div className={label}>DB TABLE ROWS</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(telemetry.tableRowCounts).map(([table, count]) => {
                  const shortName = table.replace('fs_', '').replace('pay_', 'P:')
                  return (
                    <div key={table} className={`px-2.5 py-2 rounded-xl ${darkMode ? 'bg-gray-800/60' : 'bg-slate-50'}`}>
                      <div className={`text-[8px] font-bold uppercase tracking-widest truncate ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                        {shortName}
                      </div>
                      <div className={`text-base font-black font-mono ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                        {count < 0 ? '—' : count.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Audit Log Feed */}
          {telemetry.recentLogs && telemetry.recentLogs.length > 0 && (
            <div className={card}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">history</span>
                <div className={label}>RECENT ACTIVITY</div>
              </div>
              <div className="space-y-1 max-h-[320px] overflow-y-auto">
                {telemetry.recentLogs.map(log => {
                  const humanDetail = humanizeAudit(log.eventType, log.resource, log.success, log.details, log.username)
                  const timeAgo = getTimeAgo(log.createdAtUtc)
                  return (
                    <div key={log.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-slate-50'
                    }`}>
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm leading-snug ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                          {humanDetail}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          {timeAgo} · {log.ipAddress ?? 'unknown IP'}
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
