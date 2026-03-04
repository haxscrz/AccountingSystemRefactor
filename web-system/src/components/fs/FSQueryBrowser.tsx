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
const SEARCH_KEY: Record<QueryType, string> = {
  accounts:   'acctCode',
  cdv:        'jJvNo',
  receipt:    'jDate',
  sales:      'jDate',
  general:    'jDate',
  purchase:   'jDate',
  adjustment: 'jDate',
}

async function fetchData(qt: QueryType): Promise<any[]> {
  switch (qt) {
    case 'accounts':
      return (await axios.get(`${API_BASE}/accounts`)).data?.data ?? []
    case 'cdv':
      return (await axios.get(`${API_BASE}/vouchers/masters`)).data?.data ?? []
    case 'receipt':
      return (await axios.get(`${API_BASE}/journals/receipts`)).data?.data ?? []
    case 'sales':
      return (await axios.get(`${API_BASE}/journals/sales`)).data?.data ?? []
    case 'general':
      return (await axios.get(`${API_BASE}/journals/general`)).data?.data ?? []
    case 'purchase':
      return (await axios.get(`${API_BASE}/journals/purchase`)).data?.data ?? []
    case 'adjustment':
      return (await axios.get(`${API_BASE}/journals/adjustments`)).data?.data ?? []
  }
}

export default function FSQueryBrowser() {
  const { queryType } = useParams<{ queryType: string }>()
  const qt = (queryType ?? 'accounts') as QueryType
  const columns  = COLUMNS[qt]     ?? JOURNAL_COLS
  const title    = TITLES[qt]      ?? 'Query'
  const searchLabel = SEARCH_LABEL[qt] ?? 'Search:'
  const searchKey   = SEARCH_KEY[qt]   ?? 'id'

  const [rows,     setRows]     = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // Re-fetch whenever the query type changes
  useEffect(() => {
    setLoading(true)
    setError('')
    setSearch('')
    setRows([])
    setFiltered([])

    fetchData(qt)
      .then(data => {
        setRows(data)
        setFiltered(data)
      })
      .catch(e => setError(e.message ?? 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [qt])

  // Client-side prefix filter (mirrors original's softseek)
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(rows)
      return
    }
    const s = search.toLowerCase()
    setFiltered(
      rows.filter(r => {
        const raw = r[searchKey]
        if (raw == null) return false
        return String(raw).toLowerCase().startsWith(s)
      })
    )
  }, [search, rows, searchKey])

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
          onChange={e => setSearch(e.target.value)}
          placeholder="Type to seek…"
          style={{ width: 220 }}
        />
        {search && (
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setSearch('')}>
            Clear
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>
          {filtered.length === rows.length
            ? `${rows.length} record(s)`
            : `${filtered.length} of ${rows.length} record(s)`}
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
    </div>
  )
}
