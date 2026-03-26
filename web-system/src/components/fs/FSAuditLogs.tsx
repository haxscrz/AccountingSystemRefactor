import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

interface AuditLog {
  id: number
  username: string | null
  eventType: string
  resource: string
  success: boolean
  ipAddress: string | null
  details: string | null
  createdAtUtc: string
}

function toCsv(rows: AuditLog[]): string {
  const header = ['ID', 'Username', 'EventType', 'Resource', 'Success', 'IP', 'Details', 'CreatedAtUtc']
  const body = rows.map((r) => [
    r.id,
    r.username ?? '',
    r.eventType,
    r.resource,
    r.success ? 'Yes' : 'No',
    r.ipAddress ?? '',
    (r.details ?? '').split('"').join('""'),
    r.createdAtUtc
  ])

  const lines = [header, ...body].map((cols) => cols.map((c) => `"${String(c)}"`).join(','))
  return lines.join('\n')
}

export default function FSAuditLogs() {
  const [rows, setRows] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [eventType, setEventType] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number | boolean> = { page, pageSize }
      if (username.trim()) params.username = username.trim()
      if (eventType.trim()) params.eventType = eventType.trim()
      if (resultFilter === 'success') params.success = true
      if (resultFilter === 'failed') params.success = false
      if (from) params.from = new Date(`${from}T00:00:00`).toISOString()
      if (to) params.to = new Date(`${to}T23:59:59`).toISOString()

      const resp = await axios.get('/api/admin/audit-logs', { params })
      setRows(resp.data?.data ?? [])
      setTotal(resp.data?.total ?? 0)
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [page, pageSize])

  const exportCsv = () => {
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_page_${page}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h2>Audit Logs</h2>
      <p className="subtitle">Filter security and data operation events with quick export.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', gap: 10, marginBottom: 12 }}>
        <input className="form-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="form-input" placeholder="Event type" value={eventType} onChange={(e) => setEventType(e.target.value)} />
        <select className="form-input" value={resultFilter} onChange={(e) => setResultFilter(e.target.value as 'all' | 'success' | 'failed')}>
          <option value="all">All Results</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn btn-primary" onClick={() => { setPage(1); void loadData() }}>Apply Filters</button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <button className="btn btn-secondary" onClick={exportCsv}>Export Current Page CSV</button>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{total} total log(s)</span>
      </div>

      {error && <div style={{ color: '#991b1b', marginBottom: 8 }}>{error}</div>}
      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>When (UTC)</th>
                <th>User</th>
                <th>Event</th>
                <th>Resource</th>
                <th>Result</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No logs found.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAtUtc).toLocaleString()}</td>
                  <td>{r.username ?? 'system'}</td>
                  <td>{r.eventType}</td>
                  <td>{r.resource}</td>
                  <td style={{ color: r.success ? '#166534' : '#991b1b' }}>{r.success ? 'Success' : 'Failed'}</td>
                  <td>{r.ipAddress ?? ''}</td>
                  <td>{r.details ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span style={{ fontSize: 12 }}>Page {page} of {totalPages}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1) }}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
