import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

// A_QUEACT.PRG — f_a_queact(m_which)
// Read-only browse component for all 7 query types (m_which 1–7).
// m_which=1 → accounts   (acct_code, open_bal, cur_debit, cur_credit, end_bal)
// m_which=2 → cdv        (j_jv_no, j_ck_no, j_ck_amt, j_pay_to, bank_no, sup_no, j_desc)
// m_which=3–7 → journals (j_date, j_jv_no, acct_code, j_ck_amt, j_d_or_c)

const API_BASE = '/api/fs'

type QueryType = 'accounts' | 'cdv' | 'receipt' | 'sales' | 'general' | 'purchase' | 'adjustment'

interface ColumnDef {
  key: string
  label: string
  align?: 'right' | 'left' | 'center'
  format?: (val: any) => string
  mono?: boolean
}

function fmtAmt(v: any): string {
  const n = parseFloat(v ?? 0)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(v: any): string {
  if (!v) return ''
  const dt = new Date(v)
  if (isNaN(dt.getTime())) return String(v)
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

// Columns for journal types 3–7 (identical in original)
const JOURNAL_COLS: ColumnDef[] = [
  { key: 'jDate',    label: 'Date',                 format: fmtDate },
  { key: 'jJvNo',    label: 'Reference',             mono: true },
  { key: 'acctCode', label: 'Acct#',                 mono: true },
  { key: 'jCkAmt',   label: 'Amount',    align: 'right', format: fmtAmt },
  { key: 'jDOrC',    label: 'Debit(D)/Credit(C)', align: 'center' },
]

const COLUMNS: Record<QueryType, ColumnDef[]> = {
  accounts: [
    { key: 'acctCode',  label: 'ACCT.CODE',   mono: true },
    { key: 'openBal',   label: 'OPEN.BAL.',   align: 'right', format: fmtAmt },
    { key: 'curDebit',  label: 'TTL.DEBIT',   align: 'right', format: fmtAmt },
    { key: 'curCredit', label: 'TTL.CREDIT',  align: 'right', format: fmtAmt },
    { key: 'endBal',    label: 'END.BAL.',    align: 'right', format: fmtAmt },
  ],
  cdv: [
    { key: 'jJvNo',  label: 'CDV NO.',     mono: true },
    { key: 'jCkNo',  label: 'CHECK NO.',   mono: true },
    { key: 'jCkAmt', label: 'CHK.AMT.',    align: 'right', format: fmtAmt },
    { key: 'jPayTo', label: 'PAYEE' },
    { key: 'bankNo', label: 'BC',          align: 'center' },
    { key: 'supNo',  label: 'SUP#',        align: 'center' },
    { key: 'jDesc',  label: 'EXPLANATION' },
  ],
  receipt:    JOURNAL_COLS,
  sales:      JOURNAL_COLS,
  general:    JOURNAL_COLS,
  purchase:   JOURNAL_COLS,
  adjustment: JOURNAL_COLS,
}

const TITLES: Record<QueryType, string> = {
  accounts:   'Chart of Accounts Query',
  cdv:        'Check Disbursement Vouchers Query',
  receipt:    'Cash Receipts Transactions',
  sales:      'Sales Book Journals',
  general:    'Journal Vouchers',
  purchase:   'Purchase Book Journals',
  adjustment: 'Adjustments',
}

const SEARCH_LABEL: Record<QueryType, string> = {
  accounts:   'Enter Account Code:',
  cdv:        'Enter CDV No.:',
  receipt:    'Enter Date:',
  sales:      'Enter Date:',
  general:    'Enter Date:',
  purchase:   'Enter Date:',
  adjustment: 'Enter Date:',
}

// Which field is searched / seeked (matches original index-based seek)
export default function FSQueryBrowser() {
  const { queryType } = useParams<{ queryType: string }>()
  const qt = (queryType ?? 'accounts') as QueryType
  const columns  = COLUMNS[qt]     ?? JOURNAL_COLS
  const title    = TITLES[qt]      ?? 'Query'
  const searchLabel = SEARCH_LABEL[qt] ?? 'Search:'

  const [rows,     setRows]     = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search,   setSearch]   = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [total, setTotal] = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // Re-fetch whenever the query type changes
  useEffect(() => {
    setLoading(true)
    setError('')
    setSearch('')
    setFromDate('')
    setToDate('')
    setIncludeDeleted(false)
    setPage(1)
    setRows([])
    setFiltered([])

    setLoading(false)
  }, [qt])

  // Server-side filtering/pagination for large datasets
  useEffect(() => {
    setLoading(true)
    setError('')
    axios.get(`${API_BASE}/query/${qt}`, {
      params: {
        search: search.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        pageSize,
        includeDeleted
      }
    })
      .then(resp => {
        const data = resp.data?.data ?? []
        setRows(data)
        setFiltered(data)
        setTotal(resp.data?.total ?? data.length)
      })
      .catch(e => setError(e.response?.data?.error ?? e.message ?? 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [qt, search, fromDate, toDate, page, pageSize, includeDeleted])

  const getCellVal = (row: any, col: ColumnDef): string => {
    const raw = row[col.key]
    if (col.format) return col.format(raw)
    return raw == null ? '—' : String(raw)
  }

  return (
    <div className="card">
      {/* ── Header ── */}
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '2px solid var(--border)' }}>
        <h2>{title}</h2>
        <p className="subtitle">
          Read-only view · {rows.length} record{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: '8px 12px', background: 'rgba(196,43,28,0.06)',
          border: '1px solid rgba(196,43,28,0.25)',
          borderLeft: '3px solid var(--error)',
          borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12, color: 'var(--error)'
        }}>
          {error}
        </div>
      )}

      {/* ── Seek / filter bar (mirrors original's @24 GET prompt) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <label className="form-label" style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>{searchLabel}</label>
        <input
          type="text"
          className="form-input"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value) }}
          placeholder="Type to seek…"
          style={{ width: 220 }}
        />
        <input type="date" className="form-input" value={fromDate} onChange={e => { setPage(1); setFromDate(e.target.value) }} style={{ width: 160 }} />
        <input type="date" className="form-input" value={toDate} onChange={e => { setPage(1); setToDate(e.target.value) }} style={{ width: 160 }} />
        {qt !== 'accounts' && (
          <label style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={includeDeleted} onChange={e => { setPage(1); setIncludeDeleted(e.target.checked) }} />
            Recycle Bin
          </label>
        )}
        {search && (
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setSearch('')}>
            Clear
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>
          {total} record(s)
        </span>
      </div>

      {/* ── Browse table ── */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{
                    textAlign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left'
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id ?? i}>
                    {columns.map(col => (
                      <td key={col.key} style={{
                        textAlign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
                        whiteSpace: (col.key === 'jDesc' || col.key === 'jPayTo') ? 'normal' : 'nowrap',
                        fontFamily: col.mono ? "'Consolas', monospace" : undefined
                      }}>
                        {getCellVal(row, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span style={{ fontSize: 12 }}>Page {page}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" value={pageSize} onChange={e => { setPage(1); setPageSize(parseInt(e.target.value, 10)) }} style={{ width: 90 }}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button className="btn btn-secondary" disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
