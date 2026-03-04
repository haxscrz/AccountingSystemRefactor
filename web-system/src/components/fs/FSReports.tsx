import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  exportTableCSV,    exportFinancialCSV,
  exportTableXLSX,   exportFinancialXLSX,
  exportTablePDF,    exportFinancialPDF,
  type ExportCol,    type FinSection,
} from '../../utils/exportUtils'

const API_BASE = '/api/fs'

// --- Report title map -------------------------------------------------------
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
  'groups':               'Account Groupings',
  'schedules':            'Subsidiary Schedule Groups',
}

// --- Types ------------------------------------------------------------------
interface JournalRow {
  id: number
  jJvNo: string; jDate: string; acctCode: string; jCkAmt: number; jDOrC: string
}
interface VoucherMaster {
  id: number
  jJvNo: string; jCkNo: string; jDate: string; jPayTo: string | null
  jCkAmt: number; jDesc: string | null; supNo?: string | number; bankNo?: string | number
}
interface VoucherLine {
  id: number
  jCkNo: string; acctCode: string; jCkAmt: number; jDOrC: string
}
interface AccountRow {
  id: number
  acctCode: string; acctDesc: string; openBal: number; curDebit: number
  curCredit: number; endBal: number; glReport: string | null; glEffect: string | null; formula: string
}
interface GroupCodeRow   { id: number; glReport: string; glEffect: string; glHead: string | null }
interface ScheduleRow    { id: number; glHead: string; acctCode: string; acctDesc: string | null }

// --- Data mappers -----------------------------------------------------------
function mapJournal(r: Record<string, unknown>): JournalRow {
  return {
    id: (r.id as number) ?? 0,
    jJvNo:    String(r.jJvNo    ?? r.j_jv_no    ?? ''),
    jDate:    String(r.jDate    ?? r.j_date      ?? ''),
    acctCode: String(r.acctCode ?? r.acct_code   ?? ''),
    jCkAmt:   parseFloat(String(r.jCkAmt ?? r.j_ck_amt ?? 0)),
    jDOrC:    String(r.jDOrC    ?? r.jdOrC ?? r.j_d_or_c ?? 'D'),
  }
}
function mapVoucherMaster(r: Record<string, unknown>): VoucherMaster {
  return {
    id: (r.id as number) ?? 0,
    jJvNo:  String(r.jJvNo  ?? r.j_jv_no  ?? ''),
    jCkNo:  String(r.jCkNo  ?? r.j_ck_no  ?? ''),
    jDate:  String(r.jDate  ?? r.j_date    ?? ''),
    jPayTo: r.jPayTo  != null ? String(r.jPayTo)  : (r.j_pay_to != null ? String(r.j_pay_to) : ''),
    jCkAmt: parseFloat(String(r.jCkAmt ?? r.j_ck_amt ?? 0)),
    jDesc:  r.jDesc != null ? String(r.jDesc) : (r.j_desc != null ? String(r.j_desc) : ''),
    supNo:  (r.supNo  ?? r.sup_no)  as string | number | undefined,
    bankNo: (r.bankNo ?? r.bank_no) as string | number | undefined,
  }
}
function mapVoucherLine(r: Record<string, unknown>): VoucherLine {
  return {
    id: (r.id as number) ?? 0,
    jCkNo:    String(r.jCkNo    ?? r.j_ck_no    ?? ''),
    acctCode: String(r.acctCode ?? r.acct_code   ?? ''),
    jCkAmt:   parseFloat(String(r.jCkAmt ?? r.j_ck_amt ?? 0)),
    jDOrC:    String(r.jDOrC    ?? r.j_d_or_c ?? 'D'),
  }
}
function mapAccount(r: Record<string, unknown>): AccountRow {
  return {
    id: (r.id as number) ?? 0,
    acctCode:  String(r.acctCode  ?? r.acct_code  ?? ''),
    acctDesc:  String(r.acctDesc  ?? r.acct_desc  ?? ''),
    openBal:   parseFloat(String(r.openBal   ?? r.open_bal   ?? 0)),
    curDebit:  parseFloat(String(r.curDebit  ?? r.cur_debit  ?? 0)),
    curCredit: parseFloat(String(r.curCredit ?? r.cur_credit ?? 0)),
    endBal:    parseFloat(String(r.endBal    ?? r.end_bal    ?? 0)),
    glReport:  r.glReport != null ? String(r.glReport) : (r.gl_report != null ? String(r.gl_report) : null),
    glEffect:  r.glEffect != null ? String(r.glEffect) : (r.gl_effect != null ? String(r.gl_effect) : null),
    formula:   String(r.formula ?? 'DC'),
  }
}

// --- Formatting helpers -----------------------------------------------------
function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}
function filterByDate<T extends { jDate: string }>(rows: T[], from: string, to: string): T[] {
  return rows.filter(r => {
    const d = r.jDate ? new Date(r.jDate).toISOString().split('T')[0] : ''
    return d >= from && d <= to
  })
}

// --- Inline ExportBar -------------------------------------------------------
function ExportBar({ onCSV, onXLSX, onPDF }: {
  onCSV: () => void; onXLSX: () => void; onPDF: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '0 0 20px' }}>
      <span className="form-label" style={{ margin: 0, alignSelf: 'center' }}>Export as:</span>
      <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 14px' }} onClick={onCSV}>&#11015; CSV</button>
      <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 14px' }} onClick={onXLSX}>&#11015; XLSX</button>
      <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 14px' }} onClick={onPDF}>&#11015; PDF</button>
    </div>
  )
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export default function FSReports() {
  const { reportType } = useParams<{ reportType: string }>()
  const reportTitle = reportTitles[reportType || ''] || 'Financial Report'

  const today        = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const [dateFrom,  setDateFrom]     = useState(firstOfMonth)
  const [dateTo,    setDateTo]       = useState(lastOfMonth)
  const [loading,   setLoading]      = useState(false)
  const [error,     setError]        = useState('')

  const [journalRows,    setJournalRows]    = useState<JournalRow[]>([])
  const [voucherMasters, setVoucherMasters] = useState<VoucherMaster[]>([])
  const [voucherLines,   setVoucherLines]   = useState<VoucherLine[]>([])
  const [accountRows,    setAccountRows]    = useState<AccountRow[]>([])
  const [groupRows,      setGroupRows]      = useState<GroupCodeRow[]>([])
  const [schedRows,      setSchedRows]      = useState<ScheduleRow[]>([])
  const [financialData,  setFinancialData]  = useState<Record<string, unknown> | null>(null)
  const [acctDescMap,    setAcctDescMap]    = useState<Record<string, string>>({})

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    const type = reportType || ''
    try {
      if (type === 'trial-balance' || type === 'trial-balance-detail') {
        const r = await axios.get(`${API_BASE}/reports/trial-balance`, {
          params: { periodEnding: dateTo, detailed: type === 'trial-balance-detail' }
        })
        setFinancialData({ kind: 'trial-balance', ...(r.data as object) })
      } else if (type === 'income-statement') {
        const r = await axios.get(`${API_BASE}/reports/income-statement`, { params: { periodEnding: dateTo } })
        setFinancialData({ kind: 'income-statement', ...(r.data as object) })
      } else if (type === 'balance-sheet') {
        const r = await axios.get(`${API_BASE}/reports/balance-sheet`, { params: { periodEnding: dateTo } })
        setFinancialData({ kind: 'balance-sheet', ...(r.data as object) })
      } else if (['receipts','sales','journals','purchase','adjustments'].includes(type)) {
        const ep = type === 'receipts' ? 'receipts'
                 : type === 'sales'    ? 'sales'
                 : type === 'journals' ? 'general'
                 : type === 'purchase' ? 'purchase'
                 :                       'adjustments'
        const [r, acctR] = await Promise.all([
          axios.get(`${API_BASE}/journals/${ep}`),
          axios.get(`${API_BASE}/accounts`),
        ])
        const descMap: Record<string, string> = {}
        for (const a of (acctR.data?.data ?? [])) {
          const code = String((a as Record<string, unknown>).acctCode ?? (a as Record<string, unknown>).acct_code ?? '')
          const desc = String((a as Record<string, unknown>).acctDesc ?? (a as Record<string, unknown>).acct_desc ?? '')
          if (code) descMap[code] = desc
        }
        setAcctDescMap(descMap)
        setJournalRows(filterByDate((r.data?.data ?? []).map(mapJournal), dateFrom, dateTo))
      } else if (['cdv','cds','cds-code'].includes(type)) {
        const [mastersRes, linesRes, acctR] = await Promise.all([
          axios.get(`${API_BASE}/vouchers/masters`),
          axios.get(`${API_BASE}/vouchers/lines`),
          axios.get(`${API_BASE}/accounts`),
        ])
        const descMap: Record<string, string> = {}
        for (const a of (acctR.data?.data ?? [])) {
          const code = String((a as Record<string, unknown>).acctCode ?? (a as Record<string, unknown>).acct_code ?? '')
          const desc = String((a as Record<string, unknown>).acctDesc ?? (a as Record<string, unknown>).acct_desc ?? '')
          if (code) descMap[code] = desc
        }
        setAcctDescMap(descMap)
        const masters = filterByDate<VoucherMaster>(
          (mastersRes.data?.data ?? []).map(mapVoucherMaster), dateFrom, dateTo
        )
        const allLines: VoucherLine[] = (linesRes.data?.data ?? []).map(mapVoucherLine)
        setVoucherMasters(masters)
        setVoucherLines(allLines)
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(`Failed to load report data: ${err.response?.data?.message ?? err.message ?? 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [reportType, dateFrom, dateTo])

  useEffect(() => { void fetchData() }, [fetchData])

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
  const type            = reportType || ''
  const isTransactional = ['receipts','sales','journals','purchase','adjustments'].includes(type)
  const isVoucher       = ['cdv','cds','cds-code'].includes(type)
  const isFinancial     = ['trial-balance','trial-balance-detail','income-statement','balance-sheet'].includes(type)
  const isCodeFile      = ['coa','groups','schedules'].includes(type)
  const showDateFilter  = isTransactional || isVoucher || isFinancial

  const voucherTotal = voucherMasters.reduce((s, r) => s + r.jCkAmt, 0)

  // CDS-by-Code: group lines by account code, filter via master check-no list (date range already applied to masters)
  const validCheckNos = new Set(voucherMasters.map(m => m.jCkNo))
  interface CodeGroup { acctCode: string; description: string; count: number; debit: number; credit: number }
  const byCode: Record<string, CodeGroup> = {}
  if (type === 'cds-code') {
    for (const line of voucherLines) {
      if (!validCheckNos.has(line.jCkNo)) continue
      if (!byCode[line.acctCode]) {
        byCode[line.acctCode] = {
          acctCode: line.acctCode,
          description: acctDescMap[line.acctCode] ?? '',
          count: 0, debit: 0, credit: 0
        }
      }
      byCode[line.acctCode].count++
      if (line.jDOrC.toUpperCase() === 'D') byCode[line.acctCode].debit  += line.jCkAmt
      else                                   byCode[line.acctCode].credit += line.jCkAmt
    }
  }
  const cdsCodeRows = Object.values(byCode).sort((a, b) => a.acctCode.localeCompare(b.acctCode))

  const totalDebit  = journalRows.reduce((s, r) => s + (r.jDOrC.toUpperCase() === 'D' ? r.jCkAmt : 0), 0)
  const totalCredit = journalRows.reduce((s, r) => s + (r.jDOrC.toUpperCase() === 'C' ? r.jCkAmt : 0), 0)

  const periodLabel = showDateFilter
    ? `Period: ${fmtDate(dateFrom)} \u2013 ${fmtDate(dateTo)}`
    : `As of: ${new Date().toLocaleDateString()}`

  // -------------------------------------------------------------------------
  // Export handlers
  // -------------------------------------------------------------------------
  const doExport = useCallback((format: 'csv' | 'xlsx' | 'pdf') => {
    const subtitle = periodLabel

    if (isTransactional) {
      const cols: ExportCol[] = [
        { header: 'Ln',          key: 'lnStr',     width: 6  },
        { header: 'Date',        key: 'jDateStr',  width: 14 },
        { header: 'Reference',   key: 'jJvNo',     width: 14 },
        { header: 'Description', key: 'acctDesc',  width: 34 },
        { header: 'Acct#',       key: 'acctCode',  width: 12 },
        { header: 'Debit',       key: 'debitStr',  width: 16, numeric: true },
        { header: 'Credit',      key: 'creditStr', width: 16, numeric: true },
      ]
      const rows = journalRows.map((r, idx) => ({
        lnStr: String(idx + 1), jDateStr: fmtDate(r.jDate), jJvNo: r.jJvNo,
        acctDesc: acctDescMap[r.acctCode] ?? '', acctCode: r.acctCode,
        debitStr:  r.jDOrC.toUpperCase() === 'D' ? fmt(r.jCkAmt) : '',
        creditStr: r.jDOrC.toUpperCase() === 'C' ? fmt(r.jCkAmt) : '',
      }))
      const footer = { lnStr: '', jDateStr: 'TOTALS', jJvNo: '', acctDesc: '', acctCode: '',
        debitStr: fmt(totalDebit), creditStr: fmt(totalCredit) }
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows, footer)
      return
    }

    if (type === 'cdv' || type === 'cds') {
      // Flat export: one row per master header (detail lines omitted for CDV flat table)
      const cols: ExportCol[] = [
        { header: 'CDV No.',     key: 'jJvNo',     width: 12 },
        { header: 'Date',        key: 'jDateStr',  width: 14 },
        { header: 'Sup#',        key: 'supNo',     width: 8  },
        { header: 'Payee',       key: 'jPayTo',    width: 30 },
        { header: 'Bank#',       key: 'bankNo',    width: 8  },
        { header: 'Check No.',   key: 'jCkNo',     width: 14 },
        { header: 'Amount',      key: 'jCkAmtStr', width: 16, numeric: true },
        { header: 'Particulars', key: 'jDesc',     width: 30 },
      ]
      const rows = voucherMasters.map(r => ({
        jJvNo: r.jJvNo, jDateStr: fmtDate(r.jDate), supNo: String(r.supNo ?? ''),
        jPayTo: r.jPayTo ?? '', bankNo: String(r.bankNo ?? ''), jCkNo: r.jCkNo,
        jCkAmtStr: fmt(r.jCkAmt), jDesc: r.jDesc ?? '',
      }))
      const footer = { jJvNo: 'TOTAL', jDateStr: '', supNo: '', jPayTo: '', bankNo: '', jCkNo: '', jCkAmtStr: fmt(voucherTotal), jDesc: '' }
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows, footer)
      return
    }

    if (type === 'cds-code') {
      const cols: ExportCol[] = [
        { header: 'Acct#',         key: 'acctCode',    width: 8  },
        { header: 'Description',   key: 'description', width: 32 },
        { header: '# of Records',  key: 'countStr',    width: 12, numeric: true },
        { header: 'Debit',         key: 'debitStr',    width: 18, numeric: true },
        { header: 'Credit',        key: 'creditStr',   width: 18, numeric: true },
      ]
      const rows = cdsCodeRows.map(g => ({
        acctCode: g.acctCode, description: g.description, countStr: String(g.count),
        debitStr: fmt(g.debit), creditStr: fmt(g.credit),
      }))
      const totD = cdsCodeRows.reduce((s, g) => s + g.debit, 0)
      const totC = cdsCodeRows.reduce((s, g) => s + g.credit, 0)
      const totN = cdsCodeRows.reduce((s, g) => s + g.count, 0)
      const footer = { acctCode: '', description: 'TOTAL', countStr: String(totN), debitStr: fmt(totD), creditStr: fmt(totC) }
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows, footer)
      return
    }

    if (type === 'trial-balance' || type === 'trial-balance-detail') {
      if (!financialData) return
      const lines = (financialData.lines as Record<string, unknown>[]) ?? []
      const cols: ExportCol[] = [
        { header: 'Code',           key: 'accountCode',        width: 14 },
        { header: 'Description',    key: 'accountDescription', width: 32 },
        { header: 'Open Balance',   key: 'openingBalStr',      width: 16, numeric: true },
        { header: 'Debit',          key: 'debitMovStr',        width: 16, numeric: true },
        { header: 'Credit',         key: 'creditMovStr',       width: 16, numeric: true },
        { header: 'Ending Balance', key: 'endingBalStr',       width: 16, numeric: true },
      ]
      const rows = lines.map(l => ({
        accountCode: l.accountCode, accountDescription: l.accountDescription,
        openingBalStr: fmt(parseFloat(String(l.openingBalance ?? 0))),
        debitMovStr:   fmt(parseFloat(String(l.debitMovement ?? 0))),
        creditMovStr:  fmt(parseFloat(String(l.creditMovement ?? 0))),
        endingBalStr:  fmt(parseFloat(String(l.endingBalance ?? 0))),
      }))
      const footer = { accountCode: 'TOTALS', accountDescription: '', openingBalStr: '',
        debitMovStr: fmt(parseFloat(String(financialData.totalDebit ?? 0))),
        creditMovStr: fmt(parseFloat(String(financialData.totalCredit ?? 0))), endingBalStr: '' }
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows, footer)
      return
    }

    if (type === 'income-statement') {
      if (!financialData) return
      const isCols: ExportCol[] = [
        { header: 'Acct#',       key: 'accountCode',        width: 10 },
        { header: 'Description', key: 'accountDescription', width: 34 },
        { header: 'This Month',  key: 'thisMonthStr',       width: 18, numeric: true },
        { header: 'Ratio',       key: 'ratioStr',           width: 8,  numeric: true },
        { header: 'To Date',     key: 'toDateStr',          width: 18, numeric: true },
        { header: 'Ratio',       key: 'ratioDateStr',       width: 8,  numeric: true },
      ]
      const mapIS = (ls: Record<string, unknown>[]) => ls.map(l => ({
        accountCode: l.accountCode, accountDescription: l.accountDescription,
        thisMonthStr: fmt(parseFloat(String(l.thisMonthAmount ?? 0))),
        ratioStr:     parseFloat(String(l.thisMonthRatio ?? 0)).toFixed(2),
        toDateStr:    fmt(parseFloat(String(l.toDateAmount ?? 0))),
        ratioDateStr: parseFloat(String(l.toDateRatio ?? 0)).toFixed(2),
      }))
      const sections: FinSection[] = [
        { heading: 'GROSS INCOME',         cols: isCols, rows: mapIS((financialData.incomeLines  as Record<string, unknown>[]) ?? []),
          totalRow: { accountCode: '', accountDescription: 'GROSS INCOME BEFORE MO.VAR:', thisMonthStr: fmt(parseFloat(String(financialData.grossIncome ?? 0))), ratioStr: parseFloat(String(financialData.grossIncomeRatio ?? 0)).toFixed(2), toDateStr: fmt(parseFloat(String(financialData.grossIncomeToDate ?? 0))), ratioDateStr: parseFloat(String(financialData.grossIncomeToDateRatio ?? 0)).toFixed(2) } },
        { heading: 'MFG OVERHEAD VARIANCE', cols: isCols, rows: mapIS((financialData.expenseLines as Record<string, unknown>[]) ?? []),
          totalRow: { accountCode: '', accountDescription: 'TOTAL MFG OVERHEAD VAR:',     thisMonthStr: fmt(parseFloat(String(financialData.totalExpenses ?? 0))),  ratioStr: parseFloat(String(financialData.totalExpensesRatio ?? 0)).toFixed(2), toDateStr: fmt(parseFloat(String(financialData.totalExpensesToDate ?? 0))), ratioDateStr: parseFloat(String(financialData.totalExpensesToDateRatio ?? 0)).toFixed(2) } },
        { heading: 'NET RESULT', cols: isCols, rows: [{ accountCode: '', accountDescription: 'TOTAL NET INCOME:', thisMonthStr: fmt(parseFloat(String(financialData.netIncome ?? 0))), ratioStr: parseFloat(String(financialData.netIncomeRatio ?? 0)).toFixed(2), toDateStr: fmt(parseFloat(String(financialData.netIncomeToDate ?? 0))), ratioDateStr: parseFloat(String(financialData.netIncomeToDateRatio ?? 0)).toFixed(2) }] },
      ]
      if (format === 'csv')  exportFinancialCSV(reportTitle, subtitle, sections)
      if (format === 'xlsx') exportFinancialXLSX(reportTitle, subtitle, sections)
      if (format === 'pdf')  exportFinancialPDF(reportTitle, subtitle, sections)
      return
    }

    if (type === 'balance-sheet') {
      if (!financialData) return
      const bsCols: ExportCol[] = [
        { header: 'Code',        key: 'accountCode', width: 14 },
        { header: 'Description', key: 'description', width: 36 },
        { header: 'Amount',      key: 'amountStr',   width: 18, numeric: true },
      ]
      const mapBS = (ls: Record<string, unknown>[]) => ls.map(l => ({
        accountCode: l.accountCode,
        description: l.description,
        amountStr: fmt(parseFloat(String(l.amount ?? 0))),
      }))
      const mkn = (k: string) => fmt(parseFloat(String(financialData[k] ?? 0)))
      const sections: FinSection[] = [
        { heading: 'CURRENT ASSETS',          cols: bsCols, rows: mapBS((financialData.currentAssets        as Record<string, unknown>[]) ?? []), totalRow: { accountCode: '', description: 'TOTAL CURRENT ASSETS',         amountStr: mkn('totalCurrentAssets') } },
        { heading: 'FIXED ASSETS',            cols: bsCols, rows: mapBS((financialData.fixedAssets          as Record<string, unknown>[]) ?? []), totalRow: { accountCode: '', description: 'TOTAL FIXED ASSETS',           amountStr: mkn('totalFixedAssets') } },
        { heading: 'OTHER ASSETS',            cols: bsCols, rows: mapBS((financialData.otherAssets          as Record<string, unknown>[]) ?? []), totalRow: { accountCode: '', description: 'TOTAL OTHER ASSETS',           amountStr: mkn('totalOtherAssets') } },
        { heading: 'CURRENT LIABILITIES',     cols: bsCols, rows: mapBS((financialData.currentLiabilities   as Record<string, unknown>[]) ?? []), totalRow: { accountCode: '', description: 'TOTAL CURRENT LIABILITIES',    amountStr: mkn('totalCurrentLiabilities') } },
        { heading: 'DEFERRED LIABILITIES',    cols: bsCols, rows: mapBS((financialData.deferredLiabilities  as Record<string, unknown>[]) ?? []), totalRow: { accountCode: '', description: 'TOTAL DEFERRED LIABILITIES',   amountStr: mkn('totalDeferredLiabilities') } },
        { heading: "STOCKHOLDER'S EQUITY",    cols: bsCols, rows: mapBS([...((financialData.capitalAccounts as Record<string, unknown>[]) ?? []), ...((financialData.earningsAccounts as Record<string, unknown>[]) ?? [])]), totalRow: { accountCode: '', description: 'TOTAL EQUITY',                 amountStr: mkn('totalEquity') } },
      ]
      if (format === 'csv')  exportFinancialCSV(reportTitle, subtitle, sections)
      if (format === 'xlsx') exportFinancialXLSX(reportTitle, subtitle, sections)
      if (format === 'pdf')  exportFinancialPDF(reportTitle, subtitle, sections)
      return
    }

    if (type === 'coa') {
      const cols: ExportCol[] = [
        { header: 'Acct#',        key: 'acctCode',  width: 8  },
        { header: 'Description',  key: 'acctDesc',  width: 32 },
        { header: 'Report Code',  key: 'glReport',  width: 12 },
        { header: 'Report Group', key: 'glEffect',  width: 12 },
        { header: 'Formula',      key: 'formula',   width: 10 },
      ]
      const rows = accountRows.map(r => ({
        acctCode: r.acctCode, acctDesc: r.acctDesc,
        glReport: r.glReport ?? '', glEffect: r.glEffect ?? '', formula: r.formula,
      }))
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows)
      return
    }

    if (type === 'groups') {
      const cols: ExportCol[] = [
        { header: 'Report Code', key: 'glReport', width: 14 },
        { header: 'Effect',      key: 'glEffect', width: 14 },
        { header: 'Description', key: 'glHead',   width: 36 },
      ]
      const rows = groupRows.map(r => ({ glReport: r.glReport, glEffect: r.glEffect, glHead: r.glHead ?? '' }))
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows)
      return
    }

    if (type === 'schedules') {
      const cols: ExportCol[] = [
        { header: 'Schedule Group', key: 'glHead',   width: 22 },
        { header: 'Account Code',   key: 'acctCode', width: 14 },
        { header: 'Description',    key: 'acctDesc', width: 36 },
      ]
      const rows = schedRows.map(r => ({ glHead: r.glHead, acctCode: r.acctCode, acctDesc: r.acctDesc ?? '' }))
      if (format === 'csv')  exportTableCSV(reportTitle, cols, rows)
      if (format === 'xlsx') exportTableXLSX(reportTitle, cols, rows)
      if (format === 'pdf')  exportTablePDF(reportTitle, subtitle, cols, rows)
    }
  }, [
    type, reportTitle, periodLabel,
    journalRows, voucherMasters, voucherLines, cdsCodeRows, acctDescMap,
    accountRows, groupRows, schedRows, financialData,
    totalDebit, totalCredit, voucherTotal, isTransactional,
  ])

  const hasData = !loading && (
    journalRows.length > 0 || voucherMasters.length > 0 ||
    accountRows.length > 0 || groupRows.length > 0 || schedRows.length > 0 ||
    financialData !== null
  )

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="card">
      <h2>{reportTitle}</h2>

      {/* Parameters */}
      {showDateFilter && (
        <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700 }}>Report Parameters</h4>
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
              {loading ? 'Loading...' : '\u21BA Refresh'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading report data\u2026</p>}

      {/* Export Toolbar */}
      {hasData && (
        <ExportBar
          onCSV={() => doExport('csv')}
          onXLSX={() => doExport('xlsx')}
          onPDF={() => doExport('pdf')}
        />
      )}

      {/* TRANSACTIONAL JOURNALS */}
      {!loading && isTransactional && (
        <div style={{ overflowX: 'auto' }}>
          <p className="subtitle" style={{ marginBottom: '8px' }}>
            {journalRows.length} record(s) | {periodLabel}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '44px' }}>Ln</th>
                <th>Date</th><th>Reference</th><th>Description</th>
                <th>Acct#</th>
                <th style={{ textAlign: 'right' }}>Debit</th>
                <th style={{ textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {journalRows.length === 0 ? (
                <tr><td colSpan={7} style={{ fontFamily: "'Consolas', monospace", padding: '8px 12px' }}>No records to print...</td></tr>
              ) : journalRows.map((r, idx) => (
                <tr key={r.id}>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{idx + 1}</td>
                  <td>{fmtDate(r.jDate)}</td>
                  <td style={{ fontFamily: "'Consolas', monospace" }}>{r.jJvNo}</td>
                  <td>{acctDescMap[r.acctCode] ?? ''}</td>
                  <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{r.acctCode}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                    {r.jDOrC.toUpperCase() === 'D' ? fmt(r.jCkAmt) : ''}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                    {r.jDOrC.toUpperCase() === 'C' ? fmt(r.jCkAmt) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
            {journalRows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ fontWeight: 700 }}>Totals</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(totalDebit)}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(totalCredit)}</td>
                </tr>
                <tr>
                  <td colSpan={5} style={{ fontWeight: 700 }}>Balance</td>
                  <td colSpan={2} style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700,
                    color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#166534' : '#991b1b' }}>
                    {fmt(totalDebit - totalCredit)}
                    {Math.abs(totalDebit - totalCredit) < 0.01 && <span style={{ marginLeft: '8px', fontSize: '11px' }}>&#x2713; Balanced</span>}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* CDV REGISTER — per-voucher cards matching A_REPVOU.PRG */}
      {!loading && type === 'cdv' && (
        <div>
          <p className="subtitle" style={{ marginBottom: '12px' }}>
            {voucherMasters.length} voucher(s) | {periodLabel}
          </p>
          {voucherMasters.length === 0 ? (
            <p style={{ fontFamily: "'Consolas', monospace" }}>No records to print...</p>
          ) : voucherMasters.map(master => {
            const lines = voucherLines.filter(l => l.jCkNo === master.jCkNo)
            const linDebit  = lines.filter(l => l.jDOrC.toUpperCase() === 'D').reduce((s, l) => s + l.jCkAmt, 0)
            const linCredit = lines.filter(l => l.jDOrC.toUpperCase() === 'C').reduce((s, l) => s + l.jCkAmt, 0)
            return (
              <div key={master.id} style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                {/* Voucher header */}
                <div style={{ background: 'var(--background)', padding: '10px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', flexWrap: 'wrap', gap: '20px', fontFamily: "'Consolas', monospace", fontSize: '13px' }}>
                  <span><b>CDV No.:</b> {master.jJvNo}</span>
                  <span><b>Date:</b> {fmtDate(master.jDate)}</span>
                  <span><b>Sup#:</b> {master.supNo ?? ''}</span>
                  <span><b>Payee:</b> {master.jPayTo}</span>
                  <span><b>Bank#:</b> {master.bankNo ?? ''}</span>
                  <span><b>Check No.:</b> {master.jCkNo}</span>
                </div>
                {/* Account detail lines */}
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Acct#</th><th>Account Description</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr><td colSpan={4} style={{ fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>No account lines.</td></tr>
                    ) : lines.map((l, li) => (
                      <tr key={li}>
                        <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{l.acctCode}</td>
                        <td>{acctDescMap[l.acctCode] ?? ''}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                          {l.jDOrC.toUpperCase() === 'D' ? fmt(l.jCkAmt) : ''}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                          {l.jDOrC.toUpperCase() === 'C' ? fmt(l.jCkAmt) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: 700, fontFamily: "'Consolas', monospace", textAlign: 'right' }}>Totals &rarr;</td>
                      <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(linDebit)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(linCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
                {/* Explanation */}
                {master.jDesc && (
                  <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontFamily: "'Consolas', monospace", fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <b>EXPLANATION:</b> {master.jDesc}
                  </div>
                )}
              </div>
            )
          })}
          {voucherMasters.length > 0 && (
            <div style={{ fontWeight: 700, fontFamily: "'Consolas', monospace", marginTop: '8px', fontSize: '13px' }}>
              Grand Total: {fmt(voucherTotal)}
            </div>
          )}
        </div>
      )}

      {/* CDS SUMMARY (same card format as CDV per A_REPVSM.PRG) */}
      {!loading && type === 'cds' && (
        <div>
          <p className="subtitle" style={{ marginBottom: '8px' }}>
            {voucherMasters.length} check(s) | {periodLabel}
          </p>
          {voucherMasters.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No records found for this period.</p>
          )}
          {voucherMasters.map(master => {
            const lines = voucherLines.filter(l => l.jCkNo === master.jCkNo)
            const linDebit  = lines.reduce((s, l) => s + (l.jDOrC.toUpperCase() === 'D' ? l.jCkAmt : 0), 0)
            const linCredit = lines.reduce((s, l) => s + (l.jDOrC.toUpperCase() === 'C' ? l.jCkAmt : 0), 0)
            return (
              <div key={master.id} style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--background)', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: '12px' }}>
                  <span><b>CDV No.:</b> {master.jJvNo}</span>
                  <span><b>Date:</b> {fmtDate(master.jDate)}</span>
                  <span><b>Sup#:</b> {master.supNo ?? ''}</span>
                  <span><b>Payee:</b> {master.jPayTo}</span>
                  <span><b>Bank#:</b> {master.bankNo ?? ''}</span>
                  <span><b>Check No.:</b> {master.jCkNo}</span>
                </div>
                <table className="data-table" style={{ margin: 0, borderRadius: 0 }}>
                  <thead>
                    <tr>
                      <th>Acct#</th><th>Account Description</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, li) => (
                      <tr key={li}>
                        <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{l.acctCode}</td>
                        <td>{acctDescMap[l.acctCode] ?? ''}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                          {l.jDOrC.toUpperCase() === 'D' ? fmt(l.jCkAmt) : ''}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                          {l.jDOrC.toUpperCase() === 'C' ? fmt(l.jCkAmt) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: 700 }}>Totals &rarr;</td>
                      <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(linDebit)}</td>
                      <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(linCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
                {master.jDesc && (
                  <div style={{ padding: '8px 14px', fontSize: '12px', borderTop: '1px solid var(--border)', background: 'var(--panel-2)' }}>
                    <b>Remarks:</b> {master.jDesc}
                  </div>
                )}
              </div>
            )
          })}
          {voucherMasters.length > 0 && (
            <div style={{ fontWeight: 700, fontFamily: "'Consolas', monospace", marginTop: '8px', fontSize: '13px' }}>
              Grand Total: {fmt(voucherTotal)}
            </div>
          )}
        </div>
      )}

      {/* CDS BY CODE (per A_REPCDS.PRG) */}
      {!loading && type === 'cds-code' && (
        <div style={{ overflowX: 'auto' }}>
          <p className="subtitle" style={{ marginBottom: '8px' }}>
            {cdsCodeRows.length} account code(s) | {periodLabel}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Acct#</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}># of Records</th>
                <th style={{ textAlign: 'right' }}>Debit</th>
                <th style={{ textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {cdsCodeRows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No records found for this period.</td></tr>
              ) : cdsCodeRows.map(g => (
                <tr key={g.acctCode}>
                  <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{g.acctCode}</td>
                  <td>{g.description}</td>
                  <td style={{ textAlign: 'right' }}>{g.count}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(g.debit)}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(g.credit)}</td>
                </tr>
              ))}
            </tbody>
            {cdsCodeRows.length > 0 && (() => {
              const totD = cdsCodeRows.reduce((s, g) => s + g.debit, 0)
              const totC = cdsCodeRows.reduce((s, g) => s + g.credit, 0)
              const totN = cdsCodeRows.reduce((s, g) => s + g.count, 0)
              return (
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700 }}>TOTAL</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{totN}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(totD)}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(totC)}</td>
                  </tr>
                </tfoot>
              )
            })()}
          </table>
        </div>
      )}

      {/* FINANCIAL STATEMENTS */}
      {!loading && isFinancial && financialData && (
        <FinancialStmtView data={financialData} />
      )}

      {/* COA (per A_REPCOD.PRG m_which=1) */}
      {!loading && type === 'coa' && (
        <div style={{ overflowX: 'auto' }}>
          <p className="subtitle" style={{ marginBottom: '8px' }}>{accountRows.length} account(s)</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Acct#</th><th>Description</th>
                <th>Report Code</th><th>Report Group</th><th>Formula</th>
              </tr>
            </thead>
            <tbody>
              {accountRows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{r.acctCode}</td>
                  <td>{r.acctDesc}</td>
                  <td style={{ fontFamily: "'Consolas', monospace" }}>{r.glReport ?? ''}</td>
                  <td style={{ fontFamily: "'Consolas', monospace" }}>{r.glEffect ?? ''}</td>
                  <td style={{ fontFamily: "'Consolas', monospace" }}>{r.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACCOUNT GROUPINGS */}
      {!loading && type === 'groups' && (
        <div style={{ overflowX: 'auto' }}>
          <p className="subtitle" style={{ marginBottom: '8px' }}>{groupRows.length} group code(s)</p>
          <table className="data-table">
            <thead><tr><th>Report Code</th><th>Effect</th><th>Description</th></tr></thead>
            <tbody>
              {groupRows.map((r: GroupCodeRow) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{r.glReport}</td>
                  <td style={{ fontFamily: "'Consolas', monospace" }}>{r.glEffect}</td>
                  <td>{r.glHead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBSIDIARY SCHEDULES */}
      {!loading && type === 'schedules' && (
        <div style={{ overflowX: 'auto' }}>
          <p className="subtitle" style={{ marginBottom: '8px' }}>{schedRows.length} schedule entry(ies)</p>
          <table className="data-table">
            <thead><tr><th>Schedule Group</th><th>Account Code</th><th>Description</th></tr></thead>
            <tbody>
              {schedRows.map((r: ScheduleRow) => (
                <tr key={r.id}>
                  <td>{r.glHead}</td>
                  <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{r.acctCode}</td>
                  <td>{r.acctDesc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && isCodeFile && accountRows.length === 0 && groupRows.length === 0 && schedRows.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No data found.</p>
      )}
    </div>
  )
}

// ===========================================================================
// Financial Statement Sub-View
// ===========================================================================
function FinancialStmtView({ data }: { data: Record<string, unknown> }) {
  const kind = data.kind as string

  if (kind === 'trial-balance') {
    const lines = (data.lines as Record<string, unknown>[]) ?? []
    const isDetailed = Boolean(data.detailed)

    if (isDetailed) {
      // Detailed Trial Balance per A_REPDTB.PRG m_which=1
      // Format: Acct# + Description + Beg.Balance on first line,
      // then indented transaction rows (Date, Reference, Debit, Credit),
      // then Totals row if multiple transactions, then Ending Balance
      return (
        <div>
          <p className="subtitle" style={{ marginBottom: '8px' }}>
            Detailed Trial Balance for Period ending: {fmtDate(String(data.periodEnding ?? ''))}
            {' | '}
            {data.inBalance
              ? <span style={{ color: '#166534', fontWeight: 700 }}>&#x2713; In Balance</span>
              : <span style={{ color: '#991b1b', fontWeight: 700 }}>&#x26A0; OUT OF BALANCE</span>}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ACCT#</th><th>DESCRIPTION</th>
                  <th style={{ textAlign: 'right' }}>BEG.BALANCE</th>
                  <th>TRAN.DATE</th><th>REFERENCE</th>
                  <th style={{ textAlign: 'right' }}>DEBIT AMOUNT</th>
                  <th style={{ textAlign: 'right' }}>CREDIT AMOUNT</th>
                  <th style={{ textAlign: 'right' }}>ENDING BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const trans = (l.transactions as Record<string, unknown>[]) ?? []
                  const hasMulti = trans.length > 1
                  const totD = trans.reduce((s, t) => s + parseFloat(String(t.debitAmount ?? 0)), 0)
                  const totC = trans.reduce((s, t) => s + parseFloat(String(t.creditAmount ?? 0)), 0)
                  return (
                    <>
                      {/* Account header row */}
                      <tr key={`acct-${i}`} style={{ background: 'var(--panel-2)' }}>
                        <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{String(l.accountCode ?? '')}</td>
                        <td>{String(l.accountDescription ?? '')}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.openingBalance ?? 0)))}</td>
                        <td colSpan={4} />
                        <td />
                      </tr>
                      {/* Transaction detail rows */}
                      {trans.map((t, ti) => (
                        <tr key={`trans-${i}-${ti}`}>
                          <td colSpan={3} />
                          <td style={{ paddingLeft: '20px', fontFamily: "'Consolas', monospace" }}>{fmtDate(String(t.transactionDate ?? ''))}</td>
                          <td style={{ fontFamily: "'Consolas', monospace" }}>{String(t.reference ?? '')}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                            {parseFloat(String(t.debitAmount ?? 0)) > 0 ? fmt(parseFloat(String(t.debitAmount ?? 0))) : ''}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>
                            {parseFloat(String(t.creditAmount ?? 0)) > 0 ? fmt(parseFloat(String(t.creditAmount ?? 0))) : ''}
                          </td>
                          <td />
                        </tr>
                      ))}
                      {/* Totals row if multiple transactions */}
                      {hasMulti && (
                        <tr key={`tot-${i}`} style={{ fontStyle: 'italic' }}>
                          <td colSpan={5} style={{ textAlign: 'right', paddingRight: '10px', fontWeight: 700 }}>Totals &rarr;</td>
                          <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(totD)}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(totC)}</td>
                          <td />
                        </tr>
                      )}
                      {/* Ending balance row with '*' marker */}
                      <tr key={`end-${i}`} style={{ borderBottom: '2px solid var(--border)' }}>
                        <td colSpan={7} />
                        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>
                          {fmt(parseFloat(String(l.endingBalance ?? 0)))} <span style={{ color: 'var(--text-secondary)' }}>*</span>
                        </td>
                      </tr>
                    </>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ fontWeight: 700 }}>G.TOTALS &rarr;</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.totalDebit ?? 0)))}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.totalCredit ?? 0)))}</td>
                  <td />
                </tr>
                {Math.abs(parseFloat(String(data.totalDebit ?? 0)) - parseFloat(String(data.totalCredit ?? 0))) > 0.01 && (
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 700 }}>Balance &rarr;</td>
                    <td colSpan={3} style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>
                      {fmt(parseFloat(String(data.totalDebit ?? 0)) - parseFloat(String(data.totalCredit ?? 0)))}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      )
    }

    // Regular Trial Balance (not detailed)
    return (
      <div>
        <p className="subtitle" style={{ marginBottom: '8px' }}>
          Trial Balance for Period ending: {fmtDate(String(data.periodEnding ?? ''))}
          {' | '}
          {data.inBalance
            ? <span style={{ color: '#166534', fontWeight: 700 }}>&#x2713; In Balance</span>
            : <span style={{ color: '#991b1b', fontWeight: 700 }}>&#x26A0; OUT OF BALANCE</span>}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ACCT#</th><th>DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>BEG.BALANCE</th>
                <th style={{ textAlign: 'right' }}>DEBIT AMOUNT</th>
                <th style={{ textAlign: 'right' }}>CREDIT AMOUNT</th>
                <th style={{ textAlign: 'right' }}>ENDING BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{String(l.accountCode ?? '')}</td>
                  <td>{String(l.accountDescription ?? '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.openingBalance ?? 0)))}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.debitMovement ?? 0)))}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.creditMovement ?? 0)))}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(l.endingBalance ?? 0)))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: 700 }}>G.TOTALS &rarr;</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.totalDebit ?? 0)))}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.totalCredit ?? 0)))}</td>
                <td />
              </tr>
              {Math.abs(parseFloat(String(data.totalDebit ?? 0)) - parseFloat(String(data.totalCredit ?? 0))) > 0.01 && (
                <tr>
                  <td colSpan={3} style={{ fontWeight: 700 }}>Balance &rarr;</td>
                  <td colSpan={3} style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>
                    {fmt(parseFloat(String(data.totalDebit ?? 0)) - parseFloat(String(data.totalCredit ?? 0)))}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  if (kind === 'income-statement') {
    const incLines = (data.incomeLines  as Record<string, unknown>[]) ?? []
    const expLines = (data.expenseLines as Record<string, unknown>[]) ?? []
    const netAmt       = parseFloat(String(data.netIncome        ?? 0))
    const netDateAmt   = parseFloat(String(data.netIncomeToDate  ?? 0))
    const netRatio     = parseFloat(String(data.netIncomeRatio        ?? 0))
    const netRatioDate = parseFloat(String(data.netIncomeToDateRatio  ?? 0))
    const isHead = (
      <thead>
        <tr>
          <th>Acct#</th><th>Description</th>
          <th style={{ textAlign: 'right' }}>This Month</th>
          <th style={{ textAlign: 'right' }}>Ratio</th>
          <th style={{ textAlign: 'right' }}>To Date</th>
          <th style={{ textAlign: 'right' }}>Ratio</th>
        </tr>
      </thead>
    )
    const renderISLine = (l: Record<string, unknown>, i: number) => (
      <tr key={i}>
        <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{String(l.accountCode ?? '')}</td>
        <td>{String(l.accountDescription ?? '')}</td>
        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.thisMonthAmount ?? 0)))}</td>
        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>{parseFloat(String(l.thisMonthRatio ?? 0)).toFixed(2)}</td>
        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.toDateAmount ?? 0)))}</td>
        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>{parseFloat(String(l.toDateRatio ?? 0)).toFixed(2)}</td>
      </tr>
    )
    return (
      <div>
        <p className="subtitle" style={{ marginBottom: '12px' }}>Period ending: {fmtDate(String(data.periodEnding ?? ''))}</p>

        <h4 style={{ fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GROSS INCOME</h4>
        <div style={{ overflowX: 'auto', marginBottom: '4px' }}>
          <table className="data-table">
            {isHead}
            <tbody>
              {incLines.length === 0
                ? <tr><td colSpan={6} style={{ fontFamily: "'Consolas', monospace" }}>No records to print...</td></tr>
                : incLines.map((l, i) => renderISLine(l, i))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ fontWeight: 700 }}>GROSS INCOME BEFORE MO.VAR:</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.grossIncome ?? 0)))}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>{parseFloat(String(data.grossIncomeRatio ?? 0)).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.grossIncomeToDate ?? 0)))}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>{parseFloat(String(data.grossIncomeToDateRatio ?? 0)).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h4 style={{ fontWeight: 700, marginBottom: '4px', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MFG OVERHEAD VARIANCE</h4>
        <div style={{ overflowX: 'auto', marginBottom: '4px' }}>
          <table className="data-table">
            {isHead}
            <tbody>
              {expLines.length === 0
                ? <tr><td colSpan={6} style={{ fontFamily: "'Consolas', monospace" }}>No records to print...</td></tr>
                : expLines.map((l, i) => renderISLine(l, i))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ fontWeight: 700 }}>TOTAL MFG OVERHEAD VAR:</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.totalExpenses ?? 0)))}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>{parseFloat(String(data.totalExpensesRatio ?? 0)).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700 }}>{fmt(parseFloat(String(data.totalExpensesToDate ?? 0)))}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>{parseFloat(String(data.totalExpensesToDateRatio ?? 0)).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '4px' }}>
          <table className="data-table">
            <tbody>
              <tr>
                <td colSpan={2} style={{ fontWeight: 700, fontSize: '13px' }}>TOTAL NET INCOME:</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700, color: netAmt >= 0 ? '#166534' : '#991b1b' }}>{fmt(netAmt)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)', fontWeight: 700 }}>{netRatio.toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontWeight: 700, color: netDateAmt >= 0 ? '#166534' : '#991b1b' }}>{fmt(netDateAmt)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)', fontWeight: 700 }}>{netRatioDate.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (kind === 'balance-sheet') {
    const bsLine = (l: Record<string, unknown>, i: number) => (
      <tr key={i}>
        <td style={{ fontFamily: "'Consolas', monospace", fontWeight: 600 }}>{String(l.accountCode ?? '')}</td>
        <td>{String(l.description ?? '')}</td>
        <td style={{ textAlign: 'right', fontFamily: "'Consolas', monospace" }}>{fmt(parseFloat(String(l.amount ?? 0)))}</td>
      </tr>
    )
    const BsHead = () => (
      <thead><tr><th>Code</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
    )
    const SubSection = ({ label, lines, total }: {
      label: string
      lines: Record<string, unknown>[]
      total: number
    }) => (
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontWeight: 700, margin: '12px 0 4px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</p>
        <table className="data-table" style={{ marginBottom: 0 }}>
          <BsHead />
          <tbody>
            {lines.length === 0
              ? <tr><td colSpan={3} style={{ fontFamily: "'Consolas', monospace", color: 'var(--text-secondary)' }}>(none)</td></tr>
              : lines.map((l, i) => bsLine(l, i))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', fontFamily: "'Consolas', monospace", fontSize: '13px',
          borderTop: '1px solid var(--border)', padding: '4px 12px', fontWeight: 600 }}>
          TOTAL {label.toUpperCase()}: {fmt(total)}
        </div>
      </div>
    )
    const curAssets   = (data.currentAssets   as Record<string, unknown>[]) ?? []
    const fixAssets   = (data.fixedAssets     as Record<string, unknown>[]) ?? []
    const othAssets   = (data.otherAssets     as Record<string, unknown>[]) ?? []
    const curLiab     = (data.currentLiabilities   as Record<string, unknown>[]) ?? []
    const defLiab     = (data.deferredLiabilities  as Record<string, unknown>[]) ?? []
    const capAcct     = (data.capitalAccounts      as Record<string, unknown>[]) ?? []
    const earnAcct    = (data.earningsAccounts     as Record<string, unknown>[]) ?? []
    const mkn = (k: string) => parseFloat(String(data[k] ?? 0))
    return (
      <div>
        <p className="subtitle" style={{ marginBottom: '12px' }}>Period ending: {fmtDate(String(data.periodEnding ?? ''))}
          {data.inBalance
            ? <span style={{ marginLeft: '12px', color: '#166534', fontWeight: 700 }}>&#x2713; Balanced</span>
            : <span style={{ marginLeft: '12px', color: '#991b1b', fontWeight: 700 }}>&#x26A0; OUT OF BALANCE</span>}
        </p>

        <h4 style={{ fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>*** ASSETS ***</h4>
        <SubSection label="Current Assets"   lines={curAssets} total={mkn('totalCurrentAssets')} />
        <SubSection label="Fixed Assets"     lines={fixAssets} total={mkn('totalFixedAssets')} />
        <SubSection label="Other Assets"     lines={othAssets} total={mkn('totalOtherAssets')} />
        <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: "'Consolas', monospace",
          borderTop: '2px solid var(--border)', padding: '6px 12px', marginBottom: '16px' }}>
          TOTAL ASSETS: {fmt(mkn('totalAssets'))}
        </div>

        <h4 style={{ fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>*** LIABILITIES &amp; EQUITY ***</h4>
        <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '12px' }}>LIABILITIES:</p>
        <SubSection label="Current Liabilities"  lines={curLiab}  total={mkn('totalCurrentLiabilities')} />
        <SubSection label="Deferred Liabilities" lines={defLiab}  total={mkn('totalDeferredLiabilities')} />
        <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: "'Consolas', monospace",
          borderTop: '1px solid var(--border)', padding: '4px 12px' }}>
          TOTAL LIABILITIES: {fmt(mkn('totalLiabilities'))}
        </div>

        <p style={{ fontWeight: 700, margin: '12px 0 4px', fontSize: '12px' }}>STOCKHOLDER&#39;S EQUITY:</p>
        <SubSection label="Paid-Up Capital" lines={capAcct}  total={mkn('totalCapital')} />
        <SubSection label="Earnings"        lines={earnAcct} total={mkn('totalEarnings')} />
        <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: "'Consolas', monospace",
          borderTop: '1px solid var(--border)', padding: '4px 12px' }}>
          TOTAL EQUITY: {fmt(mkn('totalEquity'))}
        </div>

        <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: "'Consolas', monospace",
          borderTop: '2px solid var(--border)', padding: '6px 12px', marginTop: '8px', fontSize: '14px' }}>
          TOTAL LIABILITY &amp; EQUITY: {fmt(mkn('totalLiabilitiesAndEquity'))}
        </div>
      </div>
    )
  }

  return <p style={{ color: 'var(--text-secondary)' }}>Report data loaded.</p>
}