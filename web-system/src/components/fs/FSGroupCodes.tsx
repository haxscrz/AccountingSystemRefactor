﻿import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// A_EDTCOD.PRG — f_a_edtcod(m_which=3) — Effects table
// Fields: gl_report (4), gl_effect (3), gl_head (25)
// Menu: ADD, FIND, EDIT, NEXT, PREVIOUS, DELETE, QUIT

interface GroupCode {
  id: number
  glReport: string
  glEffect: string
  glHead: string | null
}

const API_BASE = 'http://localhost:5081/api/fs'

function mapItem(raw: any): GroupCode {
  return {
    id:       raw.id ?? 0,
    glReport: raw.glReport ?? raw.gl_report ?? '',
    glEffect: raw.glEffect ?? raw.gl_effect ?? '',
    glHead:   raw.glHead   ?? raw.gl_head   ?? ''
  }
}

const EMPTY_FORM = { glReport: '', glEffect: '', glHead: '' }

export default function FSGroupCodes() {
  const [records, setRecords]   = useState<GroupCode[]>([])
  const [idx, setIdx]           = useState(0)
  const [loading, setLoading]   = useState(true)
  const [message, setMessage]   = useState('')
  const [mode, setMode]         = useState<'view' | 'add' | 'edit'>('view')
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [findVal, setFindVal]   = useState('')

  const current = records[idx] ?? null

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API_BASE}/group-codes`)
      const data: GroupCode[] = (r.data?.data ?? []).map(mapItem)
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

  // --- NEXT / PREVIOUS ---
  const handleNext = () => {
    if (idx >= records.length - 1) { setMessage('This is the last record!'); return }
    setIdx(i => i + 1); setMessage('')
  }
  const handlePrev = () => {
    if (idx <= 0) { setMessage('This is the first record!'); return }
    setIdx(i => i - 1); setMessage('')
  }

  // --- FIND (soft-seek by gl_report) ---
  const handleFind = () => {
    const val = findVal.toUpperCase().trim()
    const found = records.findIndex(r => r.glReport.toUpperCase() >= val)
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
    if (!form.glReport.trim()) { setMessage('Report Code is required'); return }
    if (!form.glEffect.trim()) { setMessage('Effect is required'); return }
    setSaving(true)
    try {
      const r = await axios.post(`${API_BASE}/group-codes`, {
        glReport: form.glReport.toUpperCase(),
        glEffect: form.glEffect.toUpperCase(),
        glHead:   form.glHead
      })
      const created = mapItem(r.data?.data ?? r.data)
      const newRecs  = [...records, created].sort((a, b) => a.glReport.localeCompare(b.glReport) || a.glEffect.localeCompare(b.glEffect))
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
    setForm({ glReport: current.glReport, glEffect: current.glEffect, glHead: current.glHead ?? '' })
    setMode('edit')
    setMessage('')
  }
  const handleSaveEdit = async () => {
    if (!current) return
    setSaving(true)
    try {
      const r = await axios.put(`${API_BASE}/group-codes/${current.id}`, {
        glReport: form.glReport.toUpperCase(),
        glEffect: form.glEffect.toUpperCase(),
        glHead:   form.glHead
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
    if (!window.confirm(`Delete group code ${current.glReport} / ${current.glEffect}?`)) return
    try {
      await axios.delete(`${API_BASE}/group-codes/${current.id}`)
      const newRecs = records.filter((_, i) => i !== idx)
      setRecords(newRecs)
      setIdx(Math.max(0, Math.min(idx, newRecs.length - 1)))
      setMessage('Record deleted.')
    } catch (e: any) { setMessage(`Delete failed: ${e.message}`) }
  }

  if (loading) return <div className="card"><h2>Group Codes (Effects)</h2><p style={{ color: '#00bb00' }}>Loading...</p></div>

  return (
    <div className="card">
      <h2>Group Codes Maintenance</h2>
      <p className="subtitle">A_EDTCOD.PRG m_which=3 — Effects table (fs_effects) | Record {records.length === 0 ? 0 : idx + 1} of {records.length}</p>

      {message && (
        <div style={{
          padding: '8px 14px', marginBottom: '12px', borderRadius: '4px', fontSize: '13px',
          border: `1px solid ${message.includes('Error') || message.includes('failed') || message.includes('no record') ? '#cc0000' : '#00cc00'}`,
          background: message.includes('Error') || message.includes('failed') || message.includes('no record') ? '#ffebee' : '#e8f5e9',
          color:   message.includes('Error') || message.includes('failed') || message.includes('no record') ? '#8b0000' : '#1b5e20'
        }}>{message}</div>
      )}

      {/* ---- VIEW MODE ---- */}
      {mode === 'view' && (
        <>
          {current ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Report Code</label>
                <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace', fontWeight: 'bold' }}>{current.glReport}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Effect</label>
                <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', fontFamily: 'monospace' }}>{current.glEffect}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
                <div style={{ padding: '8px', background: '#f5f5f5', border: '1px solid #ddd' }}>{current.glHead}</div>
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
                  <tr><th>Report Code</th><th>Effect</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} onClick={() => { setIdx(i); setMessage('') }}
                      style={{ cursor: 'pointer', background: i === idx ? 'rgba(15,91,102,0.1)' : undefined, fontWeight: i === idx ? 'bold' : undefined }}>
                      <td style={{ fontFamily: 'monospace' }}>{r.glReport}</td>
                      <td style={{ fontFamily: 'monospace' }}>{r.glEffect}</td>
                      <td>{r.glHead}</td>
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
          <h4>{mode === 'add' ? 'Add New Group Code' : 'Edit Group Code'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Report Code <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-input" maxLength={4} autoFocus
                value={form.glReport}
                onChange={e => setForm(f => ({ ...f, glReport: e.target.value.toUpperCase() }))}
                disabled={mode === 'edit'} />
            </div>
            <div className="form-group">
              <label className="form-label">Effect <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-input" maxLength={3}
                value={form.glEffect}
                onChange={e => setForm(f => ({ ...f, glEffect: e.target.value.toUpperCase() }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" maxLength={25}
                value={form.glHead}
                onChange={e => setForm(f => ({ ...f, glHead: e.target.value }))} />
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
              <h3 className="modal-title">Find Group Code</h3>
              <button className="modal-close" onClick={() => setShowFind(false)}>—</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Soft-seek: finds first record with Report Code ≥ entered value</p>
            <div className="form-group">
              <label className="form-label">Report Code:</label>
              <input type="text" className="form-input" maxLength={4} autoFocus value={findVal}
                onChange={e => setFindVal(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleFind() }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowFind(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFind}>Find</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
