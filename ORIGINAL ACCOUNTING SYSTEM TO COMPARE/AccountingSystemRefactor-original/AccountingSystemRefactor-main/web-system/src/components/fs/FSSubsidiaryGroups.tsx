import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// A_EDTCOD.PRG — f_a_edtcod(m_which=4) — Schedule table
// Fields: gl_head (30), acct_code (4, validates against fs_accounts), acct_desc (30, auto-fill)
// Menu: ADD, FIND, EDIT, NEXT, PREVIOUS, DELETE, QUIT

interface ScheduleEntry {
  id: number
  glHead: string
  acctCode: string
  acctDesc: string | null
}

interface AccountLookup {
  acctCode: string
  acctDesc: string
}

const API_BASE = '/api/fs'

function mapItem(raw: any): ScheduleEntry {
  return {
    id:       raw.id ?? 0,
    glHead:   raw.glHead   ?? raw.gl_head   ?? '',
    acctCode: raw.acctCode ?? raw.acct_code ?? '',
    acctDesc: raw.acctDesc ?? raw.acct_desc ?? ''
  }
}

const EMPTY_FORM = { glHead: '', acctCode: '', acctDesc: '' }

export default function FSSubsidiaryGroups() {
  const [records, setRecords]   = useState<ScheduleEntry[]>([])
  const [idx, setIdx]           = useState(0)
  const [loading, setLoading]   = useState(true)
  const [message, setMessage]   = useState('')
  const [mode, setMode]         = useState<'view' | 'add' | 'edit'>('view')
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [findVal, setFindVal]   = useState('')

  // Account browse
  const [showAccts, setShowAccts]   = useState(false)
  const [accounts, setAccounts]     = useState<AccountLookup[]>([])
  const [acctValidating, setAcctValidating] = useState(false)

  const current = records[idx] ?? null

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API_BASE}/subsidiary-groups`)
      const data: ScheduleEntry[] = (r.data?.data ?? []).map(mapItem)
      setRecords(data)
      setIdx(0)
      setMessage('')
    } catch (e: any) {
      setMessage(`Error loading: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  const loadAccounts = async () => {
    if (accounts.length > 0) { setShowAccts(true); return }
    try {
      const r = await axios.get(`${API_BASE}/accounts`)
      setAccounts((r.data?.data ?? []).map((a: any) => ({
        acctCode: a.acctCode ?? a.acct_code,
        acctDesc: a.acctDesc ?? a.acct_desc
      })))
    } catch { /* ignore */ }
    setShowAccts(true)
  }

  // Validate acct_code and auto-fill description (matches f_svalacct in PRG)
  const validateAcctCode = async (code: string) => {
    if (!code.trim()) { setForm(f => ({ ...f, acctDesc: '' })); return }
    setAcctValidating(true)
    try {
      const r = await axios.get(`${API_BASE}/accounts`)
      const all: AccountLookup[] = (r.data?.data ?? []).map((a: any) => ({
        acctCode: a.acctCode ?? a.acct_code,
        acctDesc: a.acctDesc ?? a.acct_desc
      }))
      const found = all.find(a => a.acctCode.toUpperCase() === code.toUpperCase())
      if (found) {
        setForm(f => ({ ...f, acctCode: found.acctCode, acctDesc: found.acctDesc }))
        setMessage('')
      } else {
        setForm(f => ({ ...f, acctDesc: '' }))
        setMessage('Invalid Account Code!')
      }
    } catch { /* ignore */ } finally { setAcctValidating(false) }
  }

  // --- NEXT / PREVIOUS ---
  const handleNext = () => {
    if (idx >= records.length - 1) { setMessage('This is the last record!'); return }
    setIdx(i => i + 1); setMessage('')
  }
  const handlePrev = () => {
    if (idx <= 0) { setMessage('This is the first record!'); return }
    setIdx(i => i - 1); setMessage('')
  }

  // --- FIND (soft-seek by gl_head) ---
  const handleFind = () => {
    const val = findVal.trim()
    const found = records.findIndex(r => r.glHead.toUpperCase() >= val.toUpperCase())
    if (found < 0) {
      setMessage('There is no record beyond that code!')
    } else {
      setIdx(found)
      setMessage('')
    }
    setShowFind(false)
    setFindVal('')
  }

  // --- ADD ---
  const handleAdd = () => { setForm(EMPTY_FORM); setMode('add'); setMessage('') }
  const handleSaveAdd = async () => {
    if (!form.glHead.trim()) { setMessage('Schedule Group is required'); return }
    if (!form.acctCode.trim()) { setMessage('Account Code is required'); return }
    setSaving(true)
    try {
      const r = await axios.post(`${API_BASE}/subsidiary-groups`, {
        glHead:   form.glHead,
        acctCode: form.acctCode.toUpperCase(),
        acctDesc: form.acctDesc
      })
      const created = mapItem(r.data?.data ?? r.data)
      const newRecs  = [...records, created].sort((a, b) => a.glHead.localeCompare(b.glHead) || a.acctCode.localeCompare(b.acctCode))
      setRecords(newRecs)
      setIdx(newRecs.findIndex(r2 => r2.id === created.id))
      setMode('view')
      setMessage('Record added.')
    } catch (e: any) {
      setMessage(`Save failed: ${e.response?.data?.error ?? e.message}`)
    } finally { setSaving(false) }
  }

  // --- EDIT ---
  const handleEdit = () => {
    if (!current) { setMessage('No record selected'); return }
    setForm({ glHead: current.glHead, acctCode: current.acctCode, acctDesc: current.acctDesc ?? '' })
    setMode('edit')
    setMessage('')
  }
  const handleSaveEdit = async () => {
    if (!current) return
    setSaving(true)
    try {
      const r = await axios.put(`${API_BASE}/subsidiary-groups/${current.id}`, {
        glHead:   form.glHead,
        acctCode: form.acctCode.toUpperCase(),
        acctDesc: form.acctDesc
      })
      const updated = mapItem(r.data?.data ?? r.data)
      setRecords(recs => recs.map((rc, i) => i === idx ? updated : rc))
      setMode('view')
      setMessage('Record updated.')
    } catch (e: any) {
      setMessage(`Update failed: ${e.response?.data?.error ?? e.message}`)
    } finally { setSaving(false) }
  }

  // --- DELETE ---
  const handleDelete = async () => {
    if (!current) { setMessage('No record selected'); return }
    if (!window.confirm(`Delete schedule entry ${current.glHead} / ${current.acctCode}?`)) return
    try {
      await axios.delete(`${API_BASE}/subsidiary-groups/${current.id}`)
      const newRecs = records.filter((_, i) => i !== idx)
      setRecords(newRecs)
      setIdx(Math.max(0, Math.min(idx, newRecs.length - 1)))
      setMessage('Record deleted.')
    } catch (e: any) { setMessage(`Delete failed: ${e.message}`) }
  }

  if (loading) return <div className="card"><h2>Subsidiary Groups</h2><p style={{ color: '#00bb00' }}>Loading...</p></div>

  return (
    <div className="card">
      <h2>Subsidiary Groups Maintenance</h2>
      <p className="subtitle">A_EDTCOD.PRG m_which=4 — Schedule table (fs_schedule) | Record {records.length === 0 ? 0 : idx + 1} of {records.length}</p>

      {message && (
        <div style={{
          padding: '8px 14px', marginBottom: '12px', borderRadius: '4px', fontSize: '13px',
          border: `1px solid ${message.includes('Error') || message.includes('failed') || message.includes('Invalid') || message.includes('no record') ? '#cc0000' : '#00cc00'}`,
          background: message.includes('Error') || message.includes('failed') || message.includes('Invalid') || message.includes('no record') ? '#ffebee' : '#e8f5e9',
          color:   message.includes('Error') || message.includes('failed') || message.includes('Invalid') || message.includes('no record') ? '#8b0000' : '#1b5e20'
        }}>{message}</div>
      )}

      {/* ---- VIEW MODE ---- */}
      {mode === 'view' && (
        <>
          {current ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Schedule Group</label>
                <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace' }}>{current.glHead}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Account Code</label>
                <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace', fontWeight: 'bold' }}>{current.acctCode}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
                <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd' }}>{current.acctDesc}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: '#f5f5f5', marginBottom: '16px' }}>
              <p>No records. Click ADD to create the first entry.</p>
            </div>
          )}

          {records.length > 0 && (
            <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)' }}>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr><th>Schedule Group</th><th>Account Code</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} onClick={() => { setIdx(i); setMessage('') }}
                      style={{ cursor: 'pointer', background: i === idx ? 'rgba(15,91,102,0.1)' : undefined, fontWeight: i === idx ? 'bold' : undefined }}>
                      <td>{r.glHead}</td>
                      <td style={{ fontFamily: 'monospace' }}>{r.acctCode}</td>
                      <td>{r.acctDesc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleAdd}>ADD</button>
            <button className="btn btn-secondary" onClick={() => { setFindVal(''); setShowFind(true) }}>FIND</button>
            <button className="btn btn-secondary" onClick={handleEdit} disabled={!current}>EDIT</button>
            <button className="btn btn-secondary" onClick={handlePrev} disabled={records.length === 0}>PREVIOUS</button>
            <button className="btn btn-secondary" onClick={handleNext} disabled={records.length === 0}>NEXT</button>
            <button className="btn btn-danger"    onClick={handleDelete} disabled={!current}>DELETE</button>
            <button className="btn btn-secondary" onClick={() => window.history.back()} style={{ marginLeft: 'auto' }}>QUIT</button>
          </div>
        </>
      )}

      {/* ---- ADD / EDIT FORM ---- */}
      {(mode === 'add' || mode === 'edit') && (
        <div>
          <h4>{mode === 'add' ? 'Add New Schedule Entry' : 'Edit Schedule Entry'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Schedule Group <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-input" maxLength={30} autoFocus
                value={form.glHead}
                onChange={e => setForm(f => ({ ...f, glHead: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Code <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" className="form-input" maxLength={4}
                  value={form.acctCode}
                  onChange={e => setForm(f => ({ ...f, acctCode: e.target.value.toUpperCase() }))}
                  onBlur={e => void validateAcctCode(e.target.value)} />
                <button type="button" className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={() => void loadAccounts()}>...</button>
              </div>
              {acctValidating && <span style={{ fontSize: '11px', color: '#666' }}>Validating...</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Description (auto-filled)</label>
              <input type="text" className="form-input" value={form.acctDesc} readOnly
                style={{ background: '#f0f0f0', color: '#555' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={mode === 'add' ? handleSaveAdd : handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setMode('view'); setMessage('') }} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {/* FIND Dialog */}
      {showFind && (
        <div className="modal-overlay" onClick={() => setShowFind(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Find by Schedule Group</h3>
              <button className="modal-close" onClick={() => setShowFind(false)}>—</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Soft-seek: finds first record with Schedule Group ≥ entered value</p>
            <div className="form-group">
              <label className="form-label">Schedule Group:</label>
              <input type="text" className="form-input" maxLength={30} autoFocus value={findVal}
                onChange={e => setFindVal(e.target.value)}
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
      {showAccts && (
        <div className="modal-overlay" onClick={() => setShowAccts(false)}>
          <div className="modal" style={{ maxWidth: '420px', maxHeight: '60vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Select Account</h3>
              <button className="modal-close" onClick={() => setShowAccts(false)}>—</button>
            </div>
            <table className="data-table" style={{ fontSize: '13px' }}>
              <thead><tr><th>Code</th><th>Description</th></tr></thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.acctCode} style={{ cursor: 'pointer' }} onClick={() => {
                    setForm(f => ({ ...f, acctCode: a.acctCode, acctDesc: a.acctDesc }))
                    setShowAccts(false)
                    setMessage('')
                  }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{a.acctCode}</td>
                    <td>{a.acctDesc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
