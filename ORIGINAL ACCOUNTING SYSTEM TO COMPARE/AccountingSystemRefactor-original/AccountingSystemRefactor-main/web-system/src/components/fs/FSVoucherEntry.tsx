import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import './FSVoucherEntry.css'
import { useFsUnsavedStore } from '../../stores/fsUnsavedStore'

// --- Types ---
interface CheckMaster {
  id: number
  jJvNo: string
  jCkNo: string
  jDate: string
  jPayTo: string | null
  jCkAmt: number
  jDesc: string | null
  bankNo: number
  supNo: number
}

interface CheckLine {
  id: number
  jCkNo: string
  acctCode: string
  jCkAmt: number
  jDOrC: 'D' | 'C'
}

interface AccountLookup {
  acctCode: string
  acctDesc: string
}

interface FSVoucherEntryProps {
  type: 'current' | 'advance'
}

const API_BASE = '/api/fs'

function mapMaster(raw: any): CheckMaster {
  return {
    id:     raw.id ?? 0,
    jJvNo:  raw.jJvNo ?? raw.j_jv_no ?? '',
    jCkNo:  raw.jCkNo ?? raw.j_ck_no ?? '',
    jDate:  raw.jDate ?? raw.j_date ?? '',
    jPayTo: raw.jPayTo ?? raw.j_pay_to ?? '',
    jCkAmt: parseFloat(raw.jCkAmt ?? raw.j_ck_amt ?? 0),
    jDesc:  raw.jDesc ?? raw.j_desc ?? '',
    bankNo: raw.bankNo ?? raw.bank_no ?? 0,
    supNo:  raw.supNo ?? raw.sup_no ?? 0
  }
}

function mapLine(raw: any): CheckLine {
  return {
    id:       raw.id ?? 0,
    jCkNo:    raw.jCkNo ?? raw.j_ck_no ?? '',
    acctCode: raw.acctCode ?? raw.acct_code ?? '',
    jCkAmt:   parseFloat(raw.jCkAmt ?? raw.j_ck_amt ?? 0),
    jDOrC:    (raw.jDOrC ?? raw.jdOrC ?? raw.j_d_or_c ?? 'D') as 'D' | 'C'
  }
}

function toInputDate(d: string): string {
  if (!d) return new Date().toISOString().split('T')[0]
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return new Date().toISOString().split('T')[0]
  return dt.toISOString().split('T')[0]
}

function displayDate(d: string): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

const EMPTY_MASTER = {
  jJvNo: '', jCkNo: '', jDate: new Date().toISOString().split('T')[0],
  jPayTo: '', jDesc: '', bankNo: 0, supNo: 0
}
type LineRowState = { acctCode: string; debit: string; credit: string }
const EMPTY_LINE_ROW: LineRowState = { acctCode: '', debit: '', credit: '' }

const lineInput = (accentColor: string, filled = false): React.CSSProperties => ({
  width: '100%', padding: '4px 6px', fontSize: '13px',
  border: `1px solid ${accentColor}`, borderRadius: '3px', outline: 'none',
  boxSizing: 'border-box' as const,
  background: filled ? (accentColor === '#93c5fd' ? '#eff6ff' : accentColor === '#f9a8d4' ? '#fdf2f8' : '#fff') : undefined,
  textAlign: 'right' as const,
})

// =============================================================================
export default function FSVoucherEntry({ type }: FSVoucherEntryProps) {
  const title = type === 'advance' ? 'Enter Advance CDB' : 'Cash Disbursement Voucher Entry'

  // Masters list and navigation
  const [masters, setMasters] = useState<CheckMaster[]>([])
  const [currentMasterIdx, setCurrentMasterIdx] = useState(0)
  const [lines, setLines] = useState<CheckLine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Mode: 'view' | 'addMaster' | 'editMaster'
  const [mode, setMode] = useState<'view' | 'addMaster' | 'editMaster'>('view')
  const [saving, setSaving] = useState(false)

  // Master form
  const [masterForm, setMasterForm] = useState(EMPTY_MASTER)

  // Inline line editing
  const [editingLineId, setEditingLineId] = useState<number | null>(null)
  const [editLineRow, setEditLineRow] = useState<LineRowState>(EMPTY_LINE_ROW)
  const [addLineRow, setAddLineRow] = useState<LineRowState>(EMPTY_LINE_ROW)

  // Account browse target ('line-add' or 'line-edit')
  const [acctBrowseTarget, setAcctBrowseTarget] = useState<'line-add' | 'line-edit'>('line-add')

  // Find
  const [showFind, setShowFind] = useState(false)
  const [findJv, setFindJv]     = useState('')

  // Account browse
  const [showAcctBrowse, setShowAcctBrowse] = useState(false)
  const [accounts, setAccounts] = useState<AccountLookup[]>([])

  // Unbalanced checks (for QUIT validation)
  const [unbalancedChecks, setUnbalancedChecks] = useState<{ ckNo: string; balance: number }[]>([])
  const [showUnbalanced, setShowUnbalanced] = useState(false)
  const [showPostingPreview, setShowPostingPreview] = useState(false)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [deletedMasters, setDeletedMasters] = useState<CheckMaster[]>([])
  const [showClone, setShowClone] = useState(false)
  const [cloneJvNo, setCloneJvNo] = useState('')
  const [cloneCkNo, setCloneCkNo] = useState('')
  const [cloneDate, setCloneDate] = useState(new Date().toISOString().split('T')[0])
  const setHasUnsavedChanges = useFsUnsavedStore((state) => state.setHasUnsavedChanges)

  // Current master
  const currentMaster = masters[currentMasterIdx] ?? null

  // Derived: total debit and credit for current lines
  const totalDebit  = lines.reduce((s, l) => s + (l.jDOrC === 'D' ? l.jCkAmt : 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.jDOrC === 'C' ? l.jCkAmt : 0), 0)
  const isLineBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const accountLookup = useMemo(() => new Map(accounts.map((a) => [a.acctCode.toUpperCase(), a.acctDesc])), [accounts])

  // ---- Data Loading ----
  const loadMasters = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await axios.get(`${API_BASE}/vouchers/masters`)
      const data: CheckMaster[] = (resp.data?.data ?? []).map(mapMaster)
      setMasters(data)
      setCurrentMasterIdx(0)
      setMessage('')
      return data
    } catch (err: any) {
      setMessage(`Error loading checks: ${err.message}`)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadLines = useCallback(async (ckNo: string) => {
    if (!ckNo) { setLines([]); return }
    try {
      const resp = await axios.get(`${API_BASE}/vouchers/lines/${encodeURIComponent(ckNo)}`)
      setLines((resp.data?.data ?? []).map(mapLine))
    } catch {
      setLines([])
    }
  }, [])

  const loadUnbalanced = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_BASE}/vouchers/unbalanced`)
      const data = resp.data?.data ?? []
      setUnbalancedChecks(data.map((u: any) => ({
        ckNo: u.jCkNo ?? u.checkNo ?? u.ckNo ?? '',
        balance: parseFloat(u.balance ?? u.outOfBalance ?? 0)
      })))
    } catch {
      setUnbalancedChecks([])
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const data = await loadMasters()
      if (data.length > 0) await loadLines(data[0].jCkNo)
      await loadUnbalanced()
    })()
  }, [loadMasters, loadLines, loadUnbalanced])

  // When current master changes, reload its lines
  useEffect(() => {
    if (currentMaster) void loadLines(currentMaster.jCkNo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMasterIdx])

  useEffect(() => {
    const hasDraft =
      mode !== 'view' ||
      !!addLineRow.acctCode.trim() || !!addLineRow.debit.trim() || !!addLineRow.credit.trim() ||
      !!editLineRow.acctCode.trim() || !!editLineRow.debit.trim() || !!editLineRow.credit.trim()

    setHasUnsavedChanges(hasDraft || editingLineId !== null)

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDraft && editingLineId === null) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      setHasUnsavedChanges(false)
    }
  }, [mode, addLineRow, editLineRow, editingLineId, setHasUnsavedChanges])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (event.ctrlKey && key === 's') {
        event.preventDefault()
        if (mode === 'addMaster') {
          void handleSaveMaster()
        } else if (mode === 'editMaster') {
          void handleUpdateMaster()
        } else if (editingLineId !== null) {
          void handleUpdateLine()
        } else {
          void handleSaveAddLine()
        }
      }
      if (event.ctrlKey && key === 'f') {
        event.preventDefault()
        setShowFind(true)
      }
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        void handlePrevCDV()
      }
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        void handleNextCDV()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, editingLineId, currentMasterIdx, masters.length, addLineRow, editLineRow, masterForm])

  // ---- Navigation ----
  const handleNextCDV = async () => {
    if (masters.length === 0) { setMessage('No records in file.'); return }
    if (currentMasterIdx >= masters.length - 1) {
      setMessage('Last record in file!')
    } else {
      setCurrentMasterIdx(i => i + 1)
      setMessage('')
    }
  }

  const handlePrevCDV = async () => {
    if (masters.length === 0) { setMessage('No records in file.'); return }
    if (currentMasterIdx <= 0) {
      setMessage('First record in file!')
    } else {
      setCurrentMasterIdx(i => i - 1)
      setMessage('')
    }
  }

  // ---- FIND ----
  const handleFind = async () => {
    if (!findJv.trim()) { setMessage('Enter a CDV number'); return }
    try {
      const resp = await axios.get(`${API_BASE}/vouchers/checkmaster/jv/${encodeURIComponent(findJv.trim())}`)
      const found = mapMaster(resp.data?.data ?? resp.data)
      const idx = masters.findIndex(m => m.jJvNo === found.jJvNo)
      if (idx >= 0) {
        setCurrentMasterIdx(idx)
      } else {
        // Found via backend but not in local list — reload
        await loadMasters()
      }
      setMessage('')
    } catch {
      setMessage(`CDV "${findJv}" not found.`)
    }
    setShowFind(false)
    setFindJv('')
  }

  // ---- ADD master ----
  const handleAddMaster = () => {
    const newJv  = `CDV${String(masters.length + 1).padStart(5, '0')}`
    const newCk  = `CK${String(masters.length + 1).padStart(5, '0')}`
    setMasterForm({ ...EMPTY_MASTER, jJvNo: newJv, jCkNo: newCk })
    setMode('addMaster')
    setMessage('')
  }

  const handleSaveMaster = async () => {
    if (!masterForm.jJvNo.trim()) { setMessage('CDV No. is required'); return }
    if (!masterForm.jCkNo.trim()) { setMessage('Check No. is required'); return }
    if (!masterForm.jPayTo?.trim()) { setMessage('Payee is required'); return }
    setSaving(true)
    try {
      const payload = {
        jJvNo: masterForm.jJvNo.trim(),
        jCkNo: masterForm.jCkNo.trim(),
        jDate: masterForm.jDate,
        jPayTo: masterForm.jPayTo,
        jDesc: masterForm.jDesc,
        jCkAmt: 0,  // Will be recomputed from lines
        bankNo: masterForm.bankNo,
        supNo: masterForm.supNo
      }
      const resp = await axios.post(`${API_BASE}/vouchers/masters`, payload)
      const created = mapMaster(resp.data?.data ?? resp.data)
      const newMasters = [...masters, created]
      setMasters(newMasters)
      setCurrentMasterIdx(newMasters.length - 1)
      setLines([])
      setAddLineRow(EMPTY_LINE_ROW)
      setMode('view')
      setMessage(`Check ${created.jCkNo} created. Add line items below.`)
    } catch (err: any) {
      setMessage(`Save failed: ${err.response?.data?.error ?? err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ---- ADD line (inline add row) ----
  const handleSaveAddLine = async () => {
    if (!currentMaster) { setMessage('No check selected'); return }
    if (!addLineRow.acctCode.trim()) { setMessage('Account Code is required'); return }
    if (!accountLookup.has(addLineRow.acctCode.trim().toUpperCase())) { setMessage('Please choose a valid account code from the list.'); return }
    const dv = parseFloat(addLineRow.debit  || '0')
    const cv = parseFloat(addLineRow.credit || '0')
    if (dv === 0 && cv === 0) { setMessage('Enter either a Debit or Credit amount'); return }
    if (dv > 0 && cv > 0)    { setMessage('Only one of Debit or Credit can be filled'); return }
    setSaving(true)
    try {
      const payload = {
        jCkNo:    currentMaster.jCkNo,
        acctCode: addLineRow.acctCode.toUpperCase(),
        jCkAmt:   dv > 0 ? dv : cv,
        jDOrC:    dv > 0 ? 'D' : 'C'
      }
      const resp = await axios.post(`${API_BASE}/vouchers/lines`, payload)
      const created = mapLine(resp.data?.data ?? resp.data)
      setLines(prev => [...prev, created])
      setAddLineRow(EMPTY_LINE_ROW)
      await loadMasters()
      await loadUnbalanced()
      setMessage(`Line added: ${created.acctCode}`)
    } catch (err: any) {
      setMessage(`Unable to save line item: ${err.response?.data?.error ?? err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ---- EDIT line (inline) ----
  const startEditLine = (line: CheckLine) => {
    setEditingLineId(line.id)
    setEditLineRow({
      acctCode: line.acctCode,
      debit:    line.jDOrC === 'D' ? String(line.jCkAmt) : '',
      credit:   line.jDOrC === 'C' ? String(line.jCkAmt) : '',
    })
  }

  const cancelEditLine = () => setEditingLineId(null)

  const handleUpdateLine = async () => {
    if (editingLineId === null) return
    const targetLine = lines.find(l => l.id === editingLineId)
    if (!targetLine) return
    if (!editLineRow.acctCode.trim()) { setMessage('Account Code is required'); return }
    if (!accountLookup.has(editLineRow.acctCode.trim().toUpperCase())) { setMessage('Please choose a valid account code from the list.'); return }
    const dv = parseFloat(editLineRow.debit  || '0')
    const cv = parseFloat(editLineRow.credit || '0')
    if (dv === 0 && cv === 0) { setMessage('Enter either a Debit or Credit amount'); return }
    if (dv > 0 && cv > 0)    { setMessage('Only one of Debit or Credit can be filled'); return }
    setSaving(true)
    try {
      const payload = {
        jCkNo:    targetLine.jCkNo,
        acctCode: editLineRow.acctCode.toUpperCase(),
        jCkAmt:   dv > 0 ? dv : cv,
        jDOrC:    dv > 0 ? 'D' : 'C'
      }
      const resp = await axios.put(`${API_BASE}/vouchers/lines/${targetLine.id}`, payload)
      const updated = mapLine(resp.data?.data ?? resp.data)
      setLines(prev => prev.map(l => l.id === editingLineId ? updated : l))
      setEditingLineId(null)
      await loadMasters()
      await loadUnbalanced()
      setMessage('Line updated.')
    } catch (err: any) {
      setMessage(`Unable to update line item: ${err.response?.data?.error ?? err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ---- EDIT master ----
  const handleEditMaster = () => {
    if (!currentMaster) { setMessage('No check selected'); return }
    setMasterForm({
      jJvNo:  currentMaster.jJvNo,
      jCkNo:  currentMaster.jCkNo,
      jDate:  toInputDate(currentMaster.jDate),
      jPayTo: currentMaster.jPayTo ?? '',
      jDesc:  currentMaster.jDesc ?? '',
      bankNo: currentMaster.bankNo,
      supNo:  currentMaster.supNo
    })
    setMode('editMaster')
    setMessage('')
  }

  const handleUpdateMaster = async () => {
    if (!currentMaster) return
    setSaving(true)
    try {
      const payload = {
        jJvNo:  masterForm.jJvNo,
        jCkNo:  masterForm.jCkNo,
        jDate:  masterForm.jDate,
        jPayTo: masterForm.jPayTo,
        jDesc:  masterForm.jDesc,
        jCkAmt: currentMaster.jCkAmt,
        bankNo:  masterForm.bankNo,
        supNo:   masterForm.supNo
      }
      const resp = await axios.put(`${API_BASE}/vouchers/masters/${encodeURIComponent(currentMaster.jCkNo)}`, payload)
      const updated = mapMaster(resp.data?.data ?? resp.data)
      const newMasters = masters.map((m, i) => i === currentMasterIdx ? updated : m)
      setMasters(newMasters)
      setMode('view')
      setMessage('Check updated.')
    } catch (err: any) {
      setMessage(`Update failed: ${err.response?.data?.error ?? err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ---- DELETE ----
  const handleDeleteCheck = async () => {
    if (!currentMaster) { setMessage('No check selected'); return }
    if (!window.confirm(`Delete check ${currentMaster.jCkNo}?\nThis will delete the master and ALL line items.`)) return
    try {
      await axios.delete(`${API_BASE}/vouchers/masters/${encodeURIComponent(currentMaster.jCkNo)}`)
      const newMasters = masters.filter((_, i) => i !== currentMasterIdx)
      setMasters(newMasters)
      setCurrentMasterIdx(Math.max(0, Math.min(currentMasterIdx, newMasters.length - 1)))
      setLines([])
      if (newMasters.length > 0) {
        await loadLines(newMasters[Math.max(0, currentMasterIdx - 1)]?.jCkNo ?? '')
      }
      await loadUnbalanced()
      setMessage('Check moved to recycle bin.')
    } catch (err: any) {
      setMessage(`Delete failed: ${err.message}`)
    }
  }

  // ---- DELETE line (inline) ----
  const handleDeleteLine = async (line: CheckLine) => {
    if (!window.confirm(`Delete line: ${line.acctCode}  ${line.jDOrC === 'D' ? 'Debit' : 'Credit'}: ${line.jCkAmt.toFixed(2)}?`)) return
    try {
      await axios.delete(`${API_BASE}/vouchers/lines/${line.id}`)
      setLines(prev => prev.filter(l => l.id !== line.id))
      if (editingLineId === line.id) setEditingLineId(null)
      await loadMasters()
      await loadUnbalanced()
      setMessage('Line moved to recycle bin.')
    } catch (err: any) {
      setMessage(`Delete failed: ${err.message}`)
    }
  }

  // ---- QUIT (check unbalanced) ----
  const handleQuit = async () => {
    await loadUnbalanced()
    if (unbalancedChecks.length > 0) {
      setShowUnbalanced(true)
      return
    }
    setShowPostingPreview(true)
  }

  // ---- Account browse ----
  const openAcctBrowse = async (target: 'line-add' | 'line-edit') => {
    setAcctBrowseTarget(target)
    if (accounts.length === 0) {
      try {
        const resp = await axios.get(`${API_BASE}/accounts`)
        setAccounts((resp.data?.data ?? []).map((a: any) => ({
          acctCode: a.acctCode ?? a.acct_code,
          acctDesc: a.acctDesc ?? a.acct_desc
        })))
      } catch { /* ignore */ }
    }
    setShowAcctBrowse(true)
  }

  const loadDeletedChecks = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/vouchers/deleted`)
      setDeletedMasters((resp.data?.checks ?? []).map(mapMaster))
    } catch {
      setDeletedMasters([])
    }
  }

  const restoreCheck = async (checkNo: string) => {
    try {
      await axios.post(`${API_BASE}/vouchers/restore/master/${encodeURIComponent(checkNo)}`)
      setMessage(`Check ${checkNo} restored.`)
      await loadDeletedChecks()
      await loadMasters()
    } catch (err: any) {
      setMessage(err.response?.data?.message ?? 'Unable to restore selected check.')
    }
  }

  const cloneCurrentCheck = async () => {
    if (!currentMaster) { setMessage('No check selected to clone.'); return }
    if (!cloneJvNo.trim() || !cloneCkNo.trim()) { setMessage('Please provide new CDV and check numbers.'); return }
    try {
      await axios.post(`${API_BASE}/vouchers/clone/${encodeURIComponent(currentMaster.jCkNo)}`, null, {
        params: {
          newJvNo: cloneJvNo.trim().toUpperCase(),
          newCkNo: cloneCkNo.trim().toUpperCase(),
          newDate: cloneDate
        }
      })
      setShowClone(false)
      setMessage(`Cloned ${currentMaster.jCkNo} to ${cloneCkNo.trim().toUpperCase()}.`)
      await loadMasters()
    } catch (err: any) {
      setMessage(err.response?.data?.error ?? err.response?.data?.message ?? 'Unable to clone selected check.')
    }
  }

  // ============================
  if (isLoading) {
    return (
      <div className="voucher-entry">
        <div className="card">
          <h2>{title}</h2>
          <p style={{ color: '#00bb00' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="voucher-entry">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2>{title}</h2>
            <p className="subtitle">
              A_EDTCHK.PRG — Check {masters.length === 0 ? '0' : currentMasterIdx + 1} of {masters.length}
              {lines.length > 0 && ` | ${lines.length} line${lines.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div style={{
            padding: '10px 15px', marginBottom: '12px',
            border: `1px solid ${message.includes('Error') || message.includes('failed') || message.includes('not found') ? '#cc0000' : '#00cc00'}`,
            backgroundColor: message.includes('Error') || message.includes('failed') || message.includes('not found') ? '#ffebee' : '#e8f5e9',
            color: message.includes('Error') || message.includes('failed') || message.includes('not found') ? '#8b0000' : '#1b5e20',
            borderRadius: '4px', fontSize: '13px'
          }}>
            {message}
          </div>
        )}

        {/* ---- VIEW MODE ---- */}
        {mode === 'view' && (
          <>
            {/* Master record display */}
            {currentMaster ? (
              <div className="voucher-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>CDV No.</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace' }}>{currentMaster.jJvNo}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Check No.</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace' }}>{currentMaster.jCkNo}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Date</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd' }}>{displayDate(currentMaster.jDate)}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Supplier No.</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace' }}>{currentMaster.supNo || '—'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bank Code</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace' }}>{currentMaster.bankNo || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pay To</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd' }}>{currentMaster.jPayTo}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Particulars</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd' }}>{currentMaster.jDesc}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Check Amount</label>
                    <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace', textAlign: 'right', fontWeight: 'bold' }}>
                      {currentMaster.jCkAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px', marginBottom: '16px' }}>
                <p>No vouchers in file{type === 'advance' ? ' (Advance CDB)' : ''}.</p>
                <p style={{ color: '#666', fontSize: '13px' }}>Click ADD to enter the first check.</p>
              </div>
            )}

            {/* Distribution lines — inline editing table */}
            {currentMaster && (
              <div className="voucher-items" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>Account Distribution — CDV# {currentMaster.jCkNo}</h4>
                  {!isLineBalanced && lines.length > 0 && (
                    <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>⚠ UNBALANCED</span>
                  )}
                </div>
                <table className="data-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Acct Code</th>
                      <th style={{ textAlign: 'right', color: '#1e40af' }}>Debit</th>
                      <th style={{ textAlign: 'right', color: '#9d174d' }}>Credit</th>
                      <th style={{ width: '70px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => editingLineId === line.id
                      ? (
                        <tr key={line.id} style={{ background: '#fef3c7' }}>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                style={{ ...lineInput('#fbbf24'), textAlign: 'left', width: '70px', fontFamily: 'monospace' }}
                                value={editLineRow.acctCode}
                                list="voucher-account-list"
                                onChange={e => setEditLineRow(x => ({ ...x, acctCode: e.target.value.toUpperCase() }))}
                                maxLength={4}
                                onKeyDown={e => { if (e.key === 'Enter') void handleUpdateLine() }}
                                autoFocus
                              />
                              <button type="button" style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                                onClick={() => openAcctBrowse('line-edit')}>...</button>
                            </div>
                          </td>
                          <td>
                            <input
                              style={lineInput('#93c5fd', !!editLineRow.debit)}
                              placeholder="Debit"
                              value={editLineRow.debit}
                              onFocus={() => setEditLineRow(x => ({ ...x, credit: '' }))}
                              onChange={e => setEditLineRow(x => ({ ...x, debit: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') void handleUpdateLine() }}
                            />
                          </td>
                          <td>
                            <input
                              style={lineInput('#f9a8d4', !!editLineRow.credit)}
                              placeholder="Credit"
                              value={editLineRow.credit}
                              onFocus={() => setEditLineRow(x => ({ ...x, debit: '' }))}
                              onChange={e => setEditLineRow(x => ({ ...x, credit: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') void handleUpdateLine() }}
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button type="button"
                              style={{ marginRight: '4px', padding: '2px 7px', cursor: 'pointer', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '3px' }}
                              onClick={() => void handleUpdateLine()} disabled={saving}>✓</button>
                            <button type="button"
                              style={{ padding: '2px 7px', cursor: 'pointer', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '3px' }}
                              onClick={cancelEditLine}>✕</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={line.id} style={{ cursor: 'pointer' }} onDoubleClick={() => startEditLine(line)}>
                          <td style={{ fontFamily: 'monospace' }}>{line.acctCode}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>
                            {line.jDOrC === 'D' ? line.jCkAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#9d174d' }}>
                            {line.jDOrC === 'C' ? line.jCkAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button type="button"
                              style={{ marginRight: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => startEditLine(line)}>✎</button>
                            <button type="button"
                              style={{ padding: '1px 6px', fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}
                              onClick={() => void handleDeleteLine(line)} disabled={saving}>✕</button>
                          </td>
                        </tr>
                      )
                    )}
                    {/* Add row — always present at bottom */}
                    <tr style={{ background: '#f0fdf4', borderTop: '2px dashed #86efac' }}>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            style={{ ...lineInput('#86efac'), textAlign: 'left', width: '70px', fontFamily: 'monospace' }}
                            placeholder="ACCT"
                            value={addLineRow.acctCode}
                            list="voucher-account-list"
                            onChange={e => setAddLineRow(x => ({ ...x, acctCode: e.target.value.toUpperCase() }))}
                            maxLength={4}
                            onKeyDown={e => { if (e.key === 'Enter') void handleSaveAddLine() }}
                          />
                          <button type="button" style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                            onClick={() => openAcctBrowse('line-add')}>...</button>
                        </div>
                      </td>
                      <td>
                        <input
                          style={lineInput('#86efac', !!addLineRow.debit)}
                          placeholder="Debit amount"
                          value={addLineRow.debit}
                          onFocus={() => setAddLineRow(x => ({ ...x, credit: '' }))}
                          onChange={e => setAddLineRow(x => ({ ...x, debit: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') void handleSaveAddLine() }}
                        />
                      </td>
                      <td>
                        <input
                          style={lineInput('#86efac', !!addLineRow.credit)}
                          placeholder="Credit amount"
                          value={addLineRow.credit}
                          onFocus={() => setAddLineRow(x => ({ ...x, debit: '' }))}
                          onChange={e => setAddLineRow(x => ({ ...x, credit: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') void handleSaveAddLine() }}
                        />
                      </td>
                      <td>
                        <button type="button"
                          style={{ padding: '2px 8px', fontSize: '12px', cursor: 'pointer', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '3px' }}
                          onClick={() => void handleSaveAddLine()} disabled={saving}>+Add</button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>TOTALS</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e40af' }}>{totalDebit.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#9d174d' }}>{totalCredit.toFixed(2)}</td>
                      <td>
                        {lines.length > 0 && (isLineBalanced
                          ? <span className="badge badge-success">✓</span>
                          : <span className="badge badge-error">⚠ {(totalDebit - totalCredit).toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Double-click a row to edit inline. In the green row: enter an amount in <strong style={{color:'#1e40af'}}>Debit</strong> OR <strong style={{color:'#9d174d'}}>Credit</strong> — typing in one clears the other automatically.
                  Shortcuts: Ctrl+S save, Ctrl+F find, Alt+Left/Alt+Right previous/next CDV.
                </p>
                <datalist id="voucher-account-list">
                  {accounts.map((a) => (
                    <option key={a.acctCode} value={a.acctCode}>{a.acctDesc}</option>
                  ))}
                </datalist>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                <button className="btn btn-primary" onClick={handleAddMaster}>ADD</button>
                <button className="btn btn-secondary" onClick={() => { setFindJv(''); setShowFind(true) }}>FIND</button>
                <button className="btn btn-secondary" onClick={handleEditMaster} disabled={!currentMaster}>EDIT</button>
                <button className="btn btn-secondary" onClick={() => { setCloneJvNo(''); setCloneCkNo(''); setCloneDate(new Date().toISOString().split('T')[0]); setShowClone(true) }} disabled={!currentMaster}>CLONE</button>
                <button className="btn btn-secondary" onClick={() => { void loadDeletedChecks(); setShowRecycleBin(true) }}>RECYCLE BIN</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={handlePrevCDV} disabled={masters.length === 0}>Prev-CDV</button>
                <button className="btn btn-secondary" onClick={handleNextCDV} disabled={masters.length === 0}>Next-CDV</button>
                <button className="btn btn-danger" onClick={handleDeleteCheck} disabled={!currentMaster}>DELETE</button>
                <button
                  className="btn btn-secondary"
                  onClick={handleQuit}
                  style={{ marginLeft: 'auto', background: unbalancedChecks.length > 0 ? '#fee2e2' : undefined, borderColor: unbalancedChecks.length > 0 ? '#dc2626' : undefined }}
                >
                  QUIT {unbalancedChecks.length > 0 && `(${unbalancedChecks.length} unbal.⚠)`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ---- ADD MASTER FORM ---- */}
        {mode === 'addMaster' && (
          <div>
            <h4>Add New Check — Enter Header Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">CDV No. <span style={{ color: 'red' }}>*</span></label>
                <input type="text" className="form-input" value={masterForm.jJvNo}
                  onChange={e => setMasterForm(f => ({ ...f, jJvNo: e.target.value.toUpperCase() }))} maxLength={8} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Check No. <span style={{ color: 'red' }}>*</span></label>
                <input type="text" className="form-input" value={masterForm.jCkNo}
                  onChange={e => setMasterForm(f => ({ ...f, jCkNo: e.target.value.toUpperCase() }))} maxLength={8} />
              </div>
              <div className="form-group">
                <label className="form-label">Date <span style={{ color: 'red' }}>*</span></label>
                <input type="date" className="form-input" value={masterForm.jDate}
                  onChange={e => setMasterForm(f => ({ ...f, jDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier No.</label>
                <input type="number" className="form-input" value={masterForm.supNo || ''}
                  onChange={e => setMasterForm(f => ({ ...f, supNo: parseInt(e.target.value) || 0 }))}
                  placeholder="0" min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Code</label>
                <input type="number" className="form-input" value={masterForm.bankNo || ''}
                  onChange={e => setMasterForm(f => ({ ...f, bankNo: parseInt(e.target.value) || 0 }))}
                  placeholder="0" min={0} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Pay To (Payee) <span style={{ color: 'red' }}>*</span></label>
                <input type="text" className="form-input" value={masterForm.jPayTo ?? ''}
                  onChange={e => setMasterForm(f => ({ ...f, jPayTo: e.target.value }))} maxLength={100} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Particulars</label>
                <textarea className="form-input" rows={2} value={masterForm.jDesc ?? ''}
                  onChange={e => setMasterForm(f => ({ ...f, jDesc: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={handleSaveMaster} disabled={saving}>
                {saving ? 'Saving...' : 'Next: Add Lines'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setMode('view'); setMessage('') }} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}

        {/* ---- EDIT MASTER FORM ---- */}
        {mode === 'editMaster' && (
          <div>
            <h4>Edit Check Header</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">CDV No.</label>
                <input type="text" className="form-input" value={masterForm.jJvNo} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Check No.</label>
                <input type="text" className="form-input" value={masterForm.jCkNo} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={masterForm.jDate}
                  onChange={e => setMasterForm(f => ({ ...f, jDate: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier No.</label>
                <input type="number" className="form-input" value={masterForm.supNo || ''}
                  onChange={e => setMasterForm(f => ({ ...f, supNo: parseInt(e.target.value) || 0 }))}
                  placeholder="0" min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Code</label>
                <input type="number" className="form-input" value={masterForm.bankNo || ''}
                  onChange={e => setMasterForm(f => ({ ...f, bankNo: parseInt(e.target.value) || 0 }))}
                  placeholder="0" min={0} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Pay To (Payee)</label>
                <input type="text" className="form-input" value={masterForm.jPayTo ?? ''}
                  onChange={e => setMasterForm(f => ({ ...f, jPayTo: e.target.value }))} maxLength={100} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Particulars</label>
                <textarea className="form-input" rows={2} value={masterForm.jDesc ?? ''}
                  onChange={e => setMasterForm(f => ({ ...f, jDesc: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={handleUpdateMaster} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setMode('view'); setMessage('') }} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}

      </div>

      {/* FIND Dialog */}
      {showFind && (
        <div className="modal-overlay" onClick={() => setShowFind(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Find Check by JV Number</h3>
              <button className="modal-close" onClick={() => setShowFind(false)}>—</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Soft-seek: finds first check with JV number ≥ entered value
            </p>
            <div className="form-group">
              <label className="form-label">JV Number:</label>
              <input type="text" className="form-input" value={findJv}
                onChange={e => setFindJv(e.target.value.toUpperCase())} maxLength={8} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleFind() }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowFind(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFind}>Find</button>
            </div>
          </div>
        </div>
      )}

      {/* Account Browse Dialog */}
      {showAcctBrowse && (
        <div className="modal-overlay" onClick={() => setShowAcctBrowse(false)}>
          <div className="modal" style={{ maxWidth: '460px', maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Select Account</h3>
              <button className="modal-close" onClick={() => setShowAcctBrowse(false)}>—</button>
            </div>
            {accounts.length === 0
              ? <p style={{ color: 'var(--text-secondary)' }}>Loading accounts...</p>
              : (
                <table className="data-table" style={{ fontSize: '13px' }}>
                  <thead><tr><th>Code</th><th>Description</th></tr></thead>
                  <tbody>
                    {accounts.map(a => (
                      <tr key={a.acctCode} style={{ cursor: 'pointer' }} onClick={() => {
                        if (acctBrowseTarget === 'line-add') setAddLineRow(x => ({ ...x, acctCode: a.acctCode }))
                        else setEditLineRow(x => ({ ...x, acctCode: a.acctCode }))
                        setShowAcctBrowse(false)
                      }}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{a.acctCode}</td>
                        <td>{a.acctDesc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      )}

      {showPostingPreview && (
        <div className="modal-overlay" onClick={() => setShowPostingPreview(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Posting Preview</h3>
              <button className="modal-close" onClick={() => setShowPostingPreview(false)}>—</button>
            </div>
            <p style={{ fontSize: 13, marginBottom: 10 }}>Review this voucher before leaving the entry screen.</p>
            <table className="data-table" style={{ fontSize: 13, marginBottom: 12 }}>
              <tbody>
                <tr><td>Total Debit</td><td style={{ textAlign: 'right' }}>{totalDebit.toFixed(2)}</td></tr>
                <tr><td>Total Credit</td><td style={{ textAlign: 'right' }}>{totalCredit.toFixed(2)}</td></tr>
                <tr><td>Variance</td><td style={{ textAlign: 'right', color: isLineBalanced ? '#166534' : '#991b1b' }}>{(totalDebit - totalCredit).toFixed(2)}</td></tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowPostingPreview(false)}>Back</button>
              <button className="btn btn-primary" onClick={() => window.history.back()} disabled={!isLineBalanced}>Confirm Exit</button>
            </div>
          </div>
        </div>
      )}

      {showClone && (
        <div className="modal-overlay" onClick={() => setShowClone(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Clone Voucher</h3>
              <button className="modal-close" onClick={() => setShowClone(false)}>—</button>
            </div>
            <div className="form-group">
              <label className="form-label">New CDV No.</label>
              <input className="form-input" value={cloneJvNo} onChange={e => setCloneJvNo(e.target.value.toUpperCase())} />
            </div>
            <div className="form-group">
              <label className="form-label">New Check No.</label>
              <input className="form-input" value={cloneCkNo} onChange={e => setCloneCkNo(e.target.value.toUpperCase())} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={cloneDate} onChange={e => setCloneDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowClone(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => void cloneCurrentCheck()}>Clone</button>
            </div>
          </div>
        </div>
      )}

      {showRecycleBin && (
        <div className="modal-overlay" onClick={() => setShowRecycleBin(false)}>
          <div className="modal" style={{ maxWidth: '760px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Deleted Vouchers</h3>
              <button className="modal-close" onClick={() => setShowRecycleBin(false)}>—</button>
            </div>
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead><tr><th>CDV</th><th>Check</th><th>Date</th><th>Payee</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr></thead>
              <tbody>
                {deletedMasters.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>No deleted vouchers found.</td></tr>
                ) : deletedMasters.map((m) => (
                  <tr key={m.id}>
                    <td>{m.jJvNo}</td>
                    <td>{m.jCkNo}</td>
                    <td>{displayDate(m.jDate)}</td>
                    <td>{m.jPayTo}</td>
                    <td style={{ textAlign: 'right' }}>{m.jCkAmt.toFixed(2)}</td>
                    <td><button className="btn btn-secondary" onClick={() => void restoreCheck(m.jCkNo)}>Restore</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unbalanced Checks Dialog (QUIT flow) */}
      {showUnbalanced && (
        <div className="modal-overlay" onClick={() => setShowUnbalanced(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>⚠ Unbalanced Checks</h3>
              <button className="modal-close" onClick={() => setShowUnbalanced(false)}>—</button>
            </div>
            <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>
              Cannot exit: the following check(s) have unbalanced amounts. Please resolve before quitting.
            </p>
            <table className="data-table" style={{ fontSize: '13px', marginBottom: '16px' }}>
              <thead><tr><th>Check No.</th><th style={{ textAlign: 'right' }}>Out of Balance</th></tr></thead>
              <tbody>
                {unbalancedChecks.map(u => (
                  <tr key={u.ckNo}>
                    <td style={{ fontFamily: 'monospace' }}>{u.ckNo}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontFamily: 'monospace' }}>{u.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowUnbalanced(false)}>OK — Return to Fix</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}