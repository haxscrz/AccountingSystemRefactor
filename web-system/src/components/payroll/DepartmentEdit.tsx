import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface Dept {
  id: number; DepNo: string; DepNm: string
  RegPay: number; OtPay: number; HolPay: number; GrsPay: number
  Tax: number; SssEe: number; SssEr: number
  MedEe: number; MedEr: number; PgbgEe: number; PgbgEr: number; EcEr: number
  NetPay: number; EmpCtr: number
}
const EMPTY: { DepNo: string; DepNm: string } = { DepNo: '', DepNm: '' }
const money = (v: number) => v.toLocaleString('en-PH', { minimumFractionDigits: 2 })

export default function DepartmentEdit() {
  const [rows, setRows] = useState<Dept[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | 'view' | null>(null)
  const [current, setCurrent] = useState<Dept | null>(null)
  const [form, setForm] = useState<{ DepNo: string; DepNm: string }>(EMPTY)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => fetch('/api/payroll/departments').then(r => r.json()).then(setRows).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setMsg(null); setModal('add') }
  const openEdit = (r: Dept) => { setCurrent(r); setForm({ DepNo: r.DepNo, DepNm: r.DepNm }); setMsg(null); setModal('edit') }
  const openDel = (r: Dept) => { setCurrent(r); setMsg(null); setModal('delete') }
  const openView = (r: Dept) => { setCurrent(r); setModal('view') }

  const save = async () => {
    setBusy(true); setMsg(null)
    const isEdit = modal === 'edit'
    const url = isEdit ? `/api/payroll/departments/${current!.id}` : '/api/payroll/departments'
    try {
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else setMsg({ text: json.error || 'Save failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  const destroy = async () => {
    if (!current) return; setBusy(true)
    try {
      const res = await fetch(`/api/payroll/departments/${current.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else setMsg({ text: json.error || 'Delete failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <PageHeader
        breadcrumb="SETTINGS / DEPARTMENTS"
        title="Add / Edit Department"
        subtitle="FTDEPEDT — Maintain department codes and view accumulated payroll totals"
        actions={
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Department
          </button>
        }
      />

      {msg && !modal && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-l-4 text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-red-50 text-red-800 border-red-500'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_2.5fr_1fr_2fr_2fr_120px] px-5 py-3 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          <span>Code</span><span>Name</span><span className="text-right">Emp Ctr</span>
          <span className="text-right">Gross Pay</span><span className="text-right">Net Pay</span><span className="text-right">Actions</span>
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-4xl mb-2">business</span>
            <p className="text-sm">No departments found. Click Add Department to get started.</p>
          </div>
        ) : rows.map((r, i) => (
          <div key={r.id} className={`grid grid-cols-[1fr_2.5fr_1fr_2fr_2fr_120px] px-5 py-3.5 border-t border-outline-variant/10 text-sm hover:bg-primary/5 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/30'}`}>
            <span className="font-mono font-bold text-primary">{r.DepNo}</span>
            <span className="font-medium text-on-surface">{r.DepNm}</span>
            <span className="text-right font-mono text-on-surface-variant">{r.EmpCtr}</span>
            <span className="text-right font-mono font-semibold text-emerald-700">₱{money(r.GrsPay)}</span>
            <span className="text-right font-mono font-bold text-on-surface">₱{money(r.NetPay)}</span>
            <div className="flex justify-end gap-1.5">
              <button onClick={() => openView(r)} title="View Totals" className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined text-[14px]">bar_chart</span>
              </button>
              <button onClick={() => openEdit(r)} title="Edit" className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
              <button onClick={() => openDel(r)} title="Delete" className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-error hover:text-white hover:border-error transition-all">
                <span className="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-96 p-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-5">{modal === 'add' ? 'Add Department' : 'Edit Department'}</h3>
            {msg && <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4"><span className="material-symbols-outlined text-[16px]">error</span>{msg.text}</div>}
            <div className="space-y-4">
              {[['Department Code', 'DepNo', 10], ['Department Name', 'DepNm', 50]].map(([lbl, key, max]) => (
                <div key={String(key)}>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">{lbl}</label>
                  <input type="text" maxLength={Number(max)} value={(form as any)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={save} disabled={busy} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors">{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Totals */}
      {modal === 'view' && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-0.5">{current.DepNm}</h3>
            <p className="text-sm text-on-surface-variant mb-5">Code: <strong>{current.DepNo}</strong> · Employee Count: <strong>{current.EmpCtr}</strong></p>
            <div className="bg-[#05111E] rounded-2xl p-5 text-white space-y-2 text-sm">
              {[
                ['Regular Pay', current.RegPay], ['Overtime Pay', current.OtPay], ['Holiday Pay', current.HolPay],
                ['Gross Pay', current.GrsPay], ['Withholding Tax', current.Tax],
                ['SSS EE', current.SssEe], ['SSS ER', current.SssEr],
                ['PhilHealth EE', current.MedEe], ['PhilHealth ER', current.MedEr],
                ['Pag-IBIG EE', current.PgbgEe], ['Pag-IBIG ER', current.PgbgEr], ['EC ER', current.EcEr],
              ].map(([lbl, val]) => (
                <div key={String(lbl)} className="flex justify-between text-white/70">
                  <span>{lbl}</span><span className="font-mono">₱{money(Number(val))}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-white/10 font-bold text-base">
                <span>Net Pay</span><span className="font-mono">₱{money(current.NetPay)}</span>
              </div>
            </div>
            <button onClick={() => setModal(null)} className="w-full mt-4 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h3 className="font-headline font-bold text-on-surface mb-2">Delete Department?</h3>
            <p className="text-sm text-on-surface-variant/70 mb-6">Remove <strong>{current.DepNm}</strong> ({current.DepNo})? Employees in this department will not be removed.</p>
            {msg && <p className="text-xs text-error mb-3">{msg.text}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-3 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={destroy} disabled={busy} className="flex-1 px-3 py-2 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 disabled:opacity-60 transition-colors">{busy ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
