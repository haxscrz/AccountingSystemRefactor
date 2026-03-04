/**
 * TaxTableEdit.tsx — Edit Tax Table File
 * Mirrors TAXTEDIT.PRG: add / edit / delete / browse tax table rows.
 */
import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface TaxRow {
  id: number
  TaxSts: string   // exemption status (S, M, ME, S1..S4, M1..M4)
  TaxSal: number   // salary ceiling for this bracket
  TaxPeso: number  // fixed peso tax
  TaxPcnt: number  // percentage rate
  TaxSeq: number   // sort sequence
}

const EMPTY_ROW: Omit<TaxRow, 'id'> = { TaxSts: 'S', TaxSal: 0, TaxPeso: 0, TaxPcnt: 0, TaxSeq: 0 }

export default function TaxTableEdit() {
  const [rows, setRows]     = useState<TaxRow[]>([])
  const [filter, setFilter] = useState('ALL')
  const [modal, setModal]   = useState<'add' | 'edit' | 'delete' | null>(null)
  const [current, setCurrent] = useState<TaxRow | null>(null)
  const [form, setForm]     = useState<Omit<TaxRow, 'id'>>(EMPTY_ROW)
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy]     = useState(false)

  const load = () => fetch('/api/payroll/tax-table')
    .then(r => r.json()).then(setRows).catch(() => {})

  useEffect(() => { load() }, [])

  const statuses = ['ALL', ...Array.from(new Set(rows.map(r => r.TaxSts))).sort()]
  const visible  = filter === 'ALL' ? rows : rows.filter(r => r.TaxSts === filter)

  const openAdd  = () => { setForm(EMPTY_ROW); setModal('add') }
  const openEdit = (r: TaxRow) => { setCurrent(r); setForm({ TaxSts: r.TaxSts, TaxSal: r.TaxSal, TaxPeso: r.TaxPeso, TaxPcnt: r.TaxPcnt, TaxSeq: r.TaxSeq }); setModal('edit') }
  const openDel  = (r: TaxRow) => { setCurrent(r); setModal('delete') }

  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const isEdit = modal === 'edit'
      const url  = isEdit ? `/api/payroll/tax-table/${current!.id}` : '/api/payroll/tax-table'
      const res  = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else        setMsg({ text: json.error || 'Save failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  const destroy = async () => {
    if (!current) return
    setBusy(true)
    try {
      const res  = await fetch(`/api/payroll/tax-table/${current.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else        setMsg({ text: json.error || 'Delete failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  const f = (lbl: string, key: keyof typeof form, type: 'text' | 'number' = 'number') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lbl}</label>
      <input type={type}
        value={String(form[key] ?? '')}
        onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        style={{ padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)',
          background: 'var(--input-bg, #2a2a2a)', color: 'var(--text)', borderRadius: 3 }}
      />
    </div>
  )

  const thStyle: React.CSSProperties = { padding: '6px 10px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--text-secondary)', whiteSpace: 'nowrap' }
  const tdStyle = (dim?: boolean): React.CSSProperties => ({
    padding: '6px 10px', fontSize: 13, color: dim ? 'var(--text-secondary)' : 'var(--text)'
  })

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Edit Tax Table File</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            TAXTEDIT — Add / Edit / Delete Withholding Tax Brackets
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Row</button>
      </div>

      {msg && (
        <div style={{ padding: '8px 12px', borderRadius: 4, marginBottom: 12,
          background: msg.ok ? 'rgba(46,160,67,0.15)' : 'rgba(220,53,53,0.15)',
          border: `1px solid ${msg.ok ? 'var(--success)' : 'var(--danger)'}`,
          color: msg.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '3px 10px' }}
            onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={thStyle}>Exemption</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Salary Ceiling</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Fixed Peso Tax</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Rate (%)</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Seq</th>
            <th style={thStyle}>Actions</th>
          </tr></thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle(true), textAlign: 'center', padding: 24 }}>
                No tax rows found.
              </td></tr>
            )}
            {visible.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle()}><span style={{ fontWeight: 600 }}>{r.TaxSts}</span></td>
                <td style={{ ...tdStyle(), textAlign: 'right', fontFamily: 'monospace' }}>{r.TaxSal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style={{ ...tdStyle(), textAlign: 'right', fontFamily: 'monospace' }}>{r.TaxPeso.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td style={{ ...tdStyle(), textAlign: 'right', fontFamily: 'monospace' }}>{r.TaxPcnt.toFixed(4)}</td>
                <td style={{ ...tdStyle(true), textAlign: 'right' }}>{r.TaxSeq}</td>
                <td style={tdStyle()}>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px', marginRight: 4 }}
                    onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn" style={{ fontSize: 11, padding: '2px 8px',
                    background: 'rgba(220,53,53,0.15)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                    onClick={() => openDel(r)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <ModalPortal onClick={() => setModal(null)}>
          <div style={{ width: 380 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>
              {modal === 'add' ? 'Add Tax Row' : 'Edit Tax Row'}
            </h3>
            {msg && (
              <div style={{ padding: '6px 10px', borderRadius: 3, marginBottom: 10, fontSize: 12,
                background: 'rgba(220,53,53,0.15)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                {msg.text}
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Exemption Status</label>
              <input type="text" maxLength={4} value={form.TaxSts}
                onChange={e => setForm(p => ({ ...p, TaxSts: e.target.value.toUpperCase() }))}
                placeholder="S, M, ME, S1…S4, M1…M4"
                style={{ display: 'block', width: '100%', marginTop: 4, marginBottom: 12,
                  padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)',
                  background: 'var(--input-bg, #2a2a2a)', color: 'var(--text)', borderRadius: 3 }}
              />
            </div>
            {f('Salary Ceiling',   'TaxSal')}
            {f('Fixed Peso Tax',   'TaxPeso')}
            {f('Rate (% in decimal e.g. 0.25)', 'TaxPcnt')}
            {f('Sequence',         'TaxSeq')}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-secondary" onClick={() => { setModal(null); setMsg(null) }} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={busy} style={{ flex: 1 }}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && current && (
        <ModalPortal onClick={() => setModal(null)}>
          <div style={{ width: 340, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Delete Tax Row?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Remove bracket <b style={{ color: 'var(--text)' }}>{current.TaxSts}</b> — Ceiling{' '}
              <b style={{ color: 'var(--text)' }}>{current.TaxSal.toLocaleString()}</b>?
              This cannot be undone.
            </p>
            {msg && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{msg.text}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn" onClick={destroy} disabled={busy}
                style={{ flex: 1, background: 'rgba(220,53,53,0.2)', color: 'var(--danger)',
                  border: '1px solid var(--danger)' }}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
