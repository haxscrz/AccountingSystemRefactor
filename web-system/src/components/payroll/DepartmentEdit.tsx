/**
 * DepartmentEdit.tsx — Add / Edit Departments (FTDEPEDT.PRG)
 * dep_no + dep_nm editable; financial totals are read-only.
 */
import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface Dept {
  id: number; DepNo: string; DepNm: string
  RegPay: number; OtPay: number; HolPay: number; GrsPay: number
  Tax: number; SssEe: number; SssEr: number
  MedEe: number; MedEr: number; PgbgEe: number; PgbgEr: number; EcEr: number
  NetPay: number; EmpCtr: number
}

const EMPTY: Omit<Dept, 'id' | 'RegPay' | 'OtPay' | 'HolPay' | 'GrsPay' | 'Tax' | 'SssEe' | 'SssEr' | 'MedEe' | 'MedEr' | 'PgbgEe' | 'PgbgEr' | 'EcEr' | 'NetPay' | 'EmpCtr'> = { DepNo: '', DepNm: '' }

export default function DepartmentEdit() {
  const [rows, setRows]     = useState<Dept[]>([])
  const [modal, setModal]   = useState<'add' | 'edit' | 'delete' | 'view' | null>(null)
  const [current, setCurrent] = useState<Dept | null>(null)
  const [form, setForm]     = useState<{ DepNo: string; DepNm: string }>(EMPTY)
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy]     = useState(false)

  const load = () => fetch('/api/payroll/departments')
    .then(r => r.json()).then(setRows).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setMsg(null); setModal('add') }
  const openEdit = (r: Dept) => { setCurrent(r); setForm({ DepNo: r.DepNo, DepNm: r.DepNm }); setMsg(null); setModal('edit') }
  const openDel  = (r: Dept) => { setCurrent(r); setMsg(null); setModal('delete') }
  const openView = (r: Dept) => { setCurrent(r); setModal('view') }

  const save = async () => {
    setBusy(true); setMsg(null)
    const isEdit = modal === 'edit'
    const url = isEdit ? `/api/payroll/departments/${current!.id}` : '/api/payroll/departments'
    try {
      const res  = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else        setMsg({ text: json.error || 'Save failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  const destroy = async () => {
    if (!current) return; setBusy(true)
    try {
      const res  = await fetch(`/api/payroll/departments/${current.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else        setMsg({ text: json.error || 'Delete failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  const money = (v: number) => v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const thStyle: React.CSSProperties = { padding: '6px 10px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }
  const tdStyle: React.CSSProperties = { padding: '6px 10px', fontSize: 13, color: 'var(--text)' }

  const EditForm = () => (
    <div style={{ width: 360 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{modal === 'add' ? 'Add Department' : 'Edit Department'}</h3>
      {msg && <div style={{ padding: '6px 10px', borderRadius: 3, marginBottom: 10, fontSize: 12,
        background: 'rgba(220,53,53,0.15)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>{msg.text}</div>}
      {[['Department Code', 'DepNo', 10], ['Department Name', 'DepNm', 50]] .map(([lbl, key, max]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lbl}</label>
          <input type="text" maxLength={Number(max)}
            value={(form as any)[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 4,
              padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)',
              background: 'var(--input-bg, #2a2a2a)', color: 'var(--text)', borderRadius: 3 }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary"   onClick={save} disabled={busy} style={{ flex: 1 }}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )

  const FinancialRow = ({ lbl, val }: { lbl: string; val: number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{lbl}</span>
      <span style={{ fontFamily: 'monospace' }}>{money(val)}</span>
    </div>
  )

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Add / Edit Department</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            FTDEPEDT — Maintain Department Codes
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Department</button>
      </div>

      {msg && !modal && (
        <div style={{ padding: '8px 12px', borderRadius: 4, marginBottom: 12,
          background: msg.ok ? 'rgba(46,160,67,0.15)' : 'rgba(220,53,53,0.15)',
          border: `1px solid ${msg.ok ? 'var(--success)' : 'var(--danger)'}`,
          color: msg.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={thStyle}>Code</th>
            <th style={thStyle}>Name</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Emp Ctr</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Gross Pay</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Net Pay</th>
            <th style={thStyle}>Actions</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                No departments found.
              </td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{r.DepNo}</td>
                <td style={tdStyle}>{r.DepNm}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{r.EmpCtr}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{money(r.GrsPay)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{money(r.NetPay)}</td>
                <td style={tdStyle}>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px', marginRight: 4 }}
                    onClick={() => openView(r)}>View</button>
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

      {/* Add / Edit */}
      {(modal === 'add' || modal === 'edit') && (
        <ModalPortal onClick={() => setModal(null)}><EditForm /></ModalPortal>
      )}

      {/* View Totals */}
      {modal === 'view' && current && (
        <ModalPortal onClick={() => setModal(null)}>
          <div style={{ width: 400 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{current.DepNm}</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
              Department Code: <b>{current.DepNo}</b> — Employee Count: <b>{current.EmpCtr}</b>
            </p>
            <FinancialRow lbl="Regular Pay"     val={current.RegPay}  />
            <FinancialRow lbl="Overtime Pay"    val={current.OtPay}   />
            <FinancialRow lbl="Holiday Pay"     val={current.HolPay}  />
            <FinancialRow lbl="Gross Pay"       val={current.GrsPay}  />
            <FinancialRow lbl="Withholding Tax" val={current.Tax}     />
            <FinancialRow lbl="SSS EE"          val={current.SssEe}   />
            <FinancialRow lbl="SSS ER"          val={current.SssEr}   />
            <FinancialRow lbl="PhilHealth EE"   val={current.MedEe}   />
            <FinancialRow lbl="PhilHealth ER"   val={current.MedEr}   />
            <FinancialRow lbl="Pag-IBIG EE"     val={current.PgbgEe}  />
            <FinancialRow lbl="Pag-IBIG ER"     val={current.PgbgEr}  />
            <FinancialRow lbl="EC ER"           val={current.EcEr}    />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', fontWeight: 700, fontSize: 14 }}>
              <span>Net Pay</span>
              <span style={{ fontFamily: 'monospace' }}>{money(current.NetPay)}</span>
            </div>
            <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ marginTop: 12, width: '100%' }}>Close</button>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && current && (
        <ModalPortal onClick={() => setModal(null)}>
          <div style={{ width: 340, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Delete Department?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Remove <b style={{ color: 'var(--text)' }}>{current.DepNm}</b> ({current.DepNo})?
              Employees in this department will <b>not</b> be removed.
            </p>
            {msg && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{msg.text}</p>}
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
