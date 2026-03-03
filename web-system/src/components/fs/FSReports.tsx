import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:5081/api/fs'

const reportTitles: Record<string, string> = {
  'cdv':                  'Cash Disbursement Voucher Register',
  'cds':                  'Cash Disbursement Summary',
  'cds-code':             'Cash Disbursement Summary by Code',
  'receipts':             'Cash Receipts Transactions',
  'sales':                'Sales Book Journals',
  'journals':             'Journal Vouchers',
  'purchase':             'Purchase Book Journals',
  'adjustments':          'Adjustments',
  'trial-balance-detail': 'Detailed Trial Balance',
  'trial-balance':        'Trial Balance',
  'income-statement':     'Income Statement',
  'balance-sheet':        'Balance Sheet',
  'coa':                  'Chart of Accounts',
  'groups':               'Account Groupings (Effects)',
  'schedules':            'Subsidiary Schedule Groups',
}

// ─── Shared types ───────────────────────────────────────
interface JournalRow { id: number; jJvNo: string; jDate: string; acctCode: string; jCkAmt: number; jDOrC: string }
interface VoucherRow { id: number; jJvNo: string; jCkNo: string; jDate: string; jPayTo: string | null; jCkAmt: number; jDesc: string | null }
interface AccountRow { id: number; acctCode: string; acctDesc: string; openBal: number; curDebit: number; curCredit: number; endBal: number; glReport: string | null; glEffect: string | null; formula: string }
interface GroupCodeRow { id: number; glReport: string; glEffect: string; glHead: string | null }
interface ScheduleRow  { id: number; glHead: string; acctCode: string; acctDesc: string | null }

function mapJournal(r: any): JournalRow {
  return { id: r.id ?? 0, jJvNo: r.jJvNo ?? r.j_jv_no ?? '', jDate: r.jDate ?? r.j_date ?? '', acctCode: r.acctCode ?? r.acct_code ?? '', jCkAmt: parseFloat(r.jCkAmt ?? r.j_ck_amt ?? 0), jDOrC: r.jDOrC ?? r.jdOrC ?? r.j_d_or_c ?? 'D' }
}
function mapVoucher(r: any): VoucherRow {
  return { id: r.id ?? 0, jJvNo: r.jJvNo ?? r.j_jv_no ?? '', jCkNo: r.jCkNo ?? r.j_ck_no ?? '', jDate: r.jDate ?? r.j_date ?? '', jPayTo: r.jPayTo ?? r.j_pay_to ?? '', jCkAmt: parseFloat(r.jCkAmt ?? r.j_ck_amt ?? 0), jDesc: r.jDesc ?? r.j_desc ?? '' }
}
function mapAccount(r: any): AccountRow {
  return { id: r.id ?? 0, acctCode: r.acctCode ?? r.acct_code ?? '', acctDesc: r.acctDesc ?? r.acct_desc ?? '', openBal: parseFloat(r.openBal ?? r.open_bal ?? 0), curDebit: parseFloat(r.curDebit ?? r.cur_debit ?? 0), curCredit: parseFloat(r.curCredit ?? r.cur_credit ?? 0), endBal: parseFloat(r.endBal ?? r.end_bal ?? 0), glReport: r.glReport ?? r.gl_report, glEffect: r.glEffect ?? r.gl_effect, formula: r.formula ?? 'DC' }
}

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2 }) }
function fmtDate(d: string) { if (!d) return ''; const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) }

// ─── Main Component ──────────────────────────────────────
export default function FSReports() {
  const { reportType } = useParams<{ reportType: string }>()
  const reportTitle = reportTitles[reportType || ''] || 'Financial Report'

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const [dateFrom, setDateFrom] = useState(firstOfMonth)
  const [dateTo,   setDateTo]   = useState(lastOfMonth)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Typed data states
  const [journalRows, setJournalRows]   = useState<JournalRow[]>([])
  const [voucherRows, setVoucherRows]   = useState<VoucherRow[]>([])
  const [accountRows, setAccountRows]   = useState<AccountRow[]>([])
  const [groupRows,   setGroupRows]     = useState<GroupCodeRow[]>([])
  const [schedRows,   setSchedRows]     = useState<ScheduleRow[]>([])
  const [financialData, setFinancialData] = useState<any>(null)

  // ───────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)
    setError('')
    const type = reportType || ''
    try {
      if (type === 'trial-balance' || type === 'trial-balance-detail') {
        const r = await axios.get(`${API_BASE}/reports/trial-balance`, { params: { periodEnding: dateTo, detailed: type === 'trial-balance-detail' } })
        setFinancialData({ kind: 'trial-balance', ...r.data })
      } else if (type === 'income-statement') {
        const r = await axios.get(`${API_BASE}/reports/income-statement`, { params: { periodEnding: dateTo } })
        setFinancialData({ kind: 'income-statement', ...r.data })
      } else if (type === 'balance-sheet') {
        const r = await axios.get(`${API_BASE}/reports/balance-sheet`, { params: { periodEnding: dateTo } })
        setFinancialData({ kind: 'balance-sheet', ...r.data })
      } else if (type === 'receipts') {
        const r = await axios.get(`${API_BASE}/journals/receipts`)
        setJournalRows(filterByDate((r.data?.data ?? []).map(mapJournal), dateFrom, dateTo))
      } else if (type === 'sales') {
        const r = await axios.get(`${API_BASE}/journals/sales`)
        setJournalRows(filterByDate((r.data?.data ?? []).map(mapJournal), dateFrom, dateTo))
      } else if (type === 'journals') {
        const r = await axios.get(`${API_BASE}/journals/general`)
        setJournalRows(filterByDate((r.data?.data ?? []).map(mapJournal), dateFrom, dateTo))
      } else if (type === 'purchase') {
        const r = await axios.get(`${API_BASE}/journals/purchase`)
        setJournalRows(filterByDate((r.data?.data ?? []).map(mapJournal), dateFrom, dateTo))
      } else if (type === 'adjustments') {
        const r = await axios.get(`${API_BASE}/journals/adjustments`)
        setJournalRows(filterByDate((r.data?.data ?? []).map(mapJournal), dateFrom, dateTo))
      } else if (type === 'cdv' || type === 'cds' || type === 'cds-code') {
        const r = await axios.get(`${API_BASE}/vouchers/masters`)
        setVoucherRows(filterByDate((r.data?.data ?? []).map(mapVoucher), dateFrom, dateTo))
      } else if (type === 'coa') {
        const r = await axios.get(`${API_BASE}/accounts`)
        setAccountRows((r.data?.data ?? []).map(mapAccount))
      } else if (type === 'groups') {
        const r = await axios.get(`${API_BASE}/group-codes`)
        setGroupRows(r.data?.data ?? [])
      } else if (type === 'schedules') {
        const r = await axios.get(`${API_BASE}/subsidiary-groups`)
        setSchedRows(r.data?.data ?? [])
      }
    } catch (e: any) {
      setError(`Failed to load report data: ${e.response?.data?.message ?? e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData() }, [reportType, dateFrom, dateTo])

  // ─── Helpers ──────────────────────────────────────────
  function filterByDate<T extends { jDate: string }>(rows: T[], from: string, to: string): T[] {
    return rows.filter(r => {
      const d = new Date(r.jDate).toISOString().split('T')[0]
      return d >= from && d <= to
    })
  }

  const isTransactional = ['receipts','sales','journals','purchase','adjustments'].includes(reportType || '')
  const isVoucher       = ['cdv','cds','cds-code'].includes(reportType || '')
  const isFinancial     = ['trial-balance','trial-balance-detail','income-statement','balance-sheet'].includes(reportType || '')

  const showDateFilter = isTransactional || isVoucher || isFinancial

  // ─── Totals for transactional ─────────────────────────
  const totalDebit  = journalRows.reduce((s, r) => s + (r.jDOrC === 'D' ? r.jCkAmt : 0), 0)
  const totalCredit = journalRows.reduce((s, r) => s + (r.jDOrC === 'C' ? r.jCkAmt : 0), 0)
  const voucherTotal = voucherRows.reduce((s, r) => s + r.jCkAmt, 0)

  return (
    <div className="card">
      <h2>{reportTitle}</h2>

      {/* ── Parameters ─────────────────────────────────── */}
      {showDateFilter && (
        <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px' }}>Report Parameters</h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date From</label>
              <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date To</label>
              <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => void fetchData()} disabled={loading}>
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading report data...</p>}

      {/* ── Transactional Reports ────────────────────────── */}
      {!loading && isTransactional && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{journalRows.length} record(s) for period {dateFrom} to {dateTo}</p>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>JV No.</th><th>Account Code</th><th style={{ textAlign: 'right' }}>Amount</th><th>D/C</th></tr>
            </thead>
            <tbody>
              {journalRows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No records found for this period.</td></tr>
              ) : journalRows.map(r => (
                <tr key={r.id}>
                  <td>{fmtDate(r.jDate)}</td>
                  <td style={{ fontFamily: 'monospace' }}>{r.jJvNo}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{r.acctCode}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.jCkAmt)}</td>
                  <td><span style={{ padding: '1px 6px', borderRadius: '3px', fontSize: '11px', background: r.jDOrC === 'D' ? '#dbeafe' : '#fce7f3', color: r.jDOrC === 'D' ? '#1e40af' : '#9d174d' }}>{r.jDOrC}</span></td>
                </tr>
              ))}
            </tbody>
            {journalRows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 'bold' }}>TOTALS</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    D: {fmt(totalDebit)} | C: {fmt(totalCredit)}
                  </td>
                  <td>
                    {Math.abs(totalDebit - totalCredit) < 0.01
                      ? <span className="badge badge-success">Balanced</span>
                      : <span className="badge badge-error">Diff: {fmt(totalDebit - totalCredit)}</span>}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ── CDV Reports ──────────────────────────────────── */}
      {!loading && isVoucher && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{voucherRows.length} check(s) for period {dateFrom} to {dateTo}</p>
          {reportType === 'cds-code' ? (
            (() => {
              // Group by account code across all voucher lines (summary by code)
              const byCode: Record<string, number> = {}
              voucherRows.forEach(v => { byCode[v.jCkNo] = (byCode[v.jCkNo] ?? 0) + v.jCkAmt })
              return (
                <table className="data-table">
                  <thead><tr><th>Check No.</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                  <tbody>
                    {Object.entries(byCode).map(([ck, amt]) => (
                      <tr key={ck}><td style={{ fontFamily: 'monospace' }}>{ck}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(amt)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td style={{ fontWeight: 'bold' }}>TOTAL</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(voucherTotal)}</td></tr>
                  </tfoot>
                </table>
              )
            })()
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>JV No.</th><th>Check No.</th><th>Date</th><th>Pay To</th><th style={{ textAlign: 'right' }}>Amount</th><th>Particulars</th></tr>
              </thead>
              <tbody>
                {voucherRows.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No records found for this period.</td></tr>
                  : voucherRows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace' }}>{r.jJvNo}</td>
                      <td style={{ fontFamily: 'monospace' }}>{r.jCkNo}</td>
                      <td>{fmtDate(r.jDate)}</td>
                      <td>{r.jPayTo}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.jCkAmt)}</td>
                      <td>{r.jDesc}</td>
                    </tr>
                  ))}
              </tbody>
              {voucherRows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ fontWeight: 'bold' }}>TOTAL</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(voucherTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}

      {/* ── Financial Statements ──────────────────────────── */}
      {!loading && isFinancial && financialData && (
        <FinancialStmtView data={financialData} />
      )}

      {/* ── COA Report ───────────────────────────────────── */}
      {!loading && reportType === 'coa' && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{accountRows.length} account(s)</p>
          <table className="data-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr><th>Code</th><th>Description</th><th style={{ textAlign: 'right' }}>Open Bal</th><th style={{ textAlign: 'right' }}>Debit</th><th style={{ textAlign: 'right' }}>Credit</th><th style={{ textAlign: 'right' }}>End Bal</th><th>GL Report</th><th>GL Effect</th></tr>
            </thead>
            <tbody>
              {accountRows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{r.acctCode}</td>
                  <td>{r.acctDesc}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.openBal)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.curDebit)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.curCredit)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.endBal)}</td>
                  <td>{r.glReport}</td>
                  <td>{r.glEffect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Group Codes (Effects) Report ──────────────────── */}
      {!loading && reportType === 'groups' && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{groupRows.length} group code(s)</p>
          <table className="data-table" style={{ fontSize: '13px' }}>
            <thead><tr><th>Report Code</th><th>Effect</th><th>Description</th></tr></thead>
            <tbody>
              {groupRows.map((r: GroupCodeRow) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{r.glReport}</td>
                  <td style={{ fontFamily: 'monospace' }}>{r.glEffect}</td>
                  <td>{r.glHead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Subsidiary Schedules Report ───────────────────── */}
      {!loading && reportType === 'schedules' && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{schedRows.length} schedule entry(ies)</p>
          <table className="data-table" style={{ fontSize: '13px' }}>
            <thead><tr><th>Schedule Group</th><th>Account Code</th><th>Description</th></tr></thead>
            <tbody>
              {schedRows.map((r: ScheduleRow) => (
                <tr key={r.id}>
                  <td>{r.glHead}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{r.acctCode}</td>
                  <td>{r.acctDesc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Financial Statement sub-component ──────────────────
function FinancialStmtView({ data }: { data: any }) {
  const kind = data.kind

  if (kind === 'trial-balance') {
    const lines: any[] = data.lines ?? []
    return (
      <div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Period: {fmtDate(data.periodEnding)} | {data.inBalance ? '✓ In Balance' : '⚠ OUT OF BALANCE'}
        </p>
        <table className="data-table" style={{ fontSize: '13px' }}>
          <thead>
            <tr><th>Code</th><th>Description</th><th style={{ textAlign: 'right' }}>Open Balance</th><th style={{ textAlign: 'right' }}>Debit</th><th style={{ textAlign: 'right' }}>Credit</th><th style={{ textAlign: 'right' }}>Ending Balance</th></tr>
          </thead>
          <tbody>
            {lines.map((l: any, i: number) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{l.accountCode}</td>
                <td>{l.accountDescription}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.openingBalance)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.debitMovement)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.creditMovement)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(l.endingBalance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ fontWeight: 'bold' }}>TOTALS</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(data.totalDebit)}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(data.totalCredit)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  if (kind === 'income-statement') {
    return (
      <div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Period: {fmtDate(data.periodEnding)}</p>
        <h4>INCOME</h4>
        <table className="data-table" style={{ fontSize: '13px', marginBottom: '12px' }}>
          <thead><tr><th>Code</th><th>Description</th><th style={{ textAlign: 'right' }}>This Month</th><th style={{ textAlign: 'right' }}>To Date</th></tr></thead>
          <tbody>
            {(data.incomeLines ?? []).map((l: any, i: number) => (
              <tr key={i}><td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{l.accountCode}</td><td>{l.accountDescription}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.thisMonthAmount)}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.toDateAmount)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={2} style={{ fontWeight: 'bold' }}>GROSS INCOME</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(data.grossIncome)}</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(data.grossIncomeToDate)}</td></tr></tfoot>
        </table>
        <h4>EXPENSES</h4>
        <table className="data-table" style={{ fontSize: '13px', marginBottom: '12px' }}>
          <thead><tr><th>Code</th><th>Description</th><th style={{ textAlign: 'right' }}>This Month</th><th style={{ textAlign: 'right' }}>To Date</th></tr></thead>
          <tbody>
            {(data.expenseLines ?? []).map((l: any, i: number) => (
              <tr key={i}><td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{l.accountCode}</td><td>{l.accountDescription}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.thisMonthAmount)}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.toDateAmount)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={2} style={{ fontWeight: 'bold' }}>TOTAL EXPENSES</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(data.totalExpenses)}</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(data.totalExpensesToDate)}</td></tr></tfoot>
        </table>
        <table className="data-table" style={{ fontSize: '14px' }}>
          <tbody>
            <tr style={{ background: '#e8f5e9' }}><td style={{ fontWeight: 'bold' }}>NET INCOME / (LOSS)</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: data.netIncome >= 0 ? '#1b5e20' : '#8b0000' }}>{fmt(data.netIncome)}</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: data.netIncomeToDate >= 0 ? '#1b5e20' : '#8b0000' }}>{fmt(data.netIncomeToDate)}</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  if (kind === 'balance-sheet') {
    const sections = [
      { label: 'ASSETS',                  lines: data.assetLines ?? [],     total: data.totalAssets },
      { label: 'LIABILITIES',             lines: data.liabilityLines ?? [], total: data.totalLiabilities },
      { label: "STOCKHOLDER'S EQUITY",    lines: data.equityLines ?? [],    total: data.totalEquity },
    ]
    return (
      <div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Period: {fmtDate(data.periodEnding)}</p>
        {sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: '16px' }}>
            <h4>{sec.label}</h4>
            <table className="data-table" style={{ fontSize: '13px' }}>
              <thead><tr><th>Code</th><th>Description</th><th style={{ textAlign: 'right' }}>Balance</th></tr></thead>
              <tbody>
                {(sec.lines ?? []).map((l: any, i: number) => (
                  <tr key={i}><td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{l.accountCode}</td><td>{l.accountDescription}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(l.balance ?? l.endingBalance ?? 0)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={2} style={{ fontWeight: 'bold' }}>TOTAL {sec.label}</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(sec.total ?? 0)}</td></tr></tfoot>
            </table>
          </div>
        ))}
      </div>
    )
  }

  return <p style={{ color: 'var(--text-secondary)' }}>Report data loaded.</p>
}


