import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface TaxRow {
  id: number; TaxSts: string; TaxSal: number; TaxPeso: number; TaxPcnt: number; TaxSeq: number
}

const EMPTY_ROW: Omit<TaxRow, 'id'> = { TaxSts: 'S', TaxSal: 0, TaxPeso: 0, TaxPcnt: 0, TaxSeq: 0 }
const money = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 })

export default function TaxTableEdit() {
  const [rows, setRows] = useState<TaxRow[]>([])
  const [filter, setFilter] = useState('ALL')
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [current, setCurrent] = useState<TaxRow | null>(null)
  const [form, setForm] = useState<Omit<TaxRow, 'id'>>(EMPTY_ROW)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => fetch('/api/payroll/tax-table').then(r => r.json()).then(setRows).catch(() => {})
  useEffect(() => { load() }, [])

  const statuses = ['ALL', ...Array.from(new Set(rows.map(r => r.TaxSts))).sort()]
  const visible = filter === 'ALL' ? rows : rows.filter(r => r.TaxSts === filter)

  const openAdd = () => { setForm(EMPTY_ROW); setMsg(null); setModal('add') }
  const openEdit = (r: TaxRow) => { setCurrent(r); setForm({ TaxSts: r.TaxSts, TaxSal: r.TaxSal, TaxPeso: r.TaxPeso, TaxPcnt: r.TaxPcnt, TaxSeq: r.TaxSeq }); setMsg(null); setModal('edit') }
  const openDel = (r: TaxRow) => { setCurrent(r); setMsg(null); setModal('delete') }

  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const isEdit = modal === 'edit'
      const url = isEdit ? `/api/payroll/tax-table/${current!.id}` : '/api/payroll/tax-table'
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
      const res = await fetch(`/api/payroll/tax-table/${current.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setModal(null); load() }
      else setMsg({ text: json.error || 'Delete failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <PageHeader
        breadcrumb="SETTINGS / TAX BRACKETS"
        title="Edit Tax Table"
        subtitle="TAXTEDIT — Add / Edit / Delete withholding tax brackets by exemption status"
        actions={
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Row
          </button>
        }
      />

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${filter === s ? 'bg-primary text-white border-primary' : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1.5fr_2fr_2fr_1.5fr_1fr_100px] px-5 py-3 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          <span>Exemption</span><span className="text-right">Salary Ceiling</span>
          <span className="text-right">Fixed Peso Tax</span><span className="text-right">Rate (%)</span>
          <span className="text-right">Seq</span><span className="text-right">Actions</span>
        </div>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-4xl mb-2">percent</span>
            <p className="text-sm">No tax brackets found.</p>
          </div>
        ) : visible.map((r, i) => (
          <div key={r.id} className={`grid grid-cols-[1.5fr_2fr_2fr_1.5fr_1fr_100px] px-5 py-3.5 border-t border-outline-variant/10 text-sm hover:bg-primary/5 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/30'}`}>
            <span className="font-mono font-bold text-primary">{r.TaxSts}</span>
            <span className="text-right font-mono">{money(r.TaxSal)}</span>
            <span className="text-right font-mono">{money(r.TaxPeso)}</span>
            <span className="text-right font-mono">{r.TaxPcnt.toFixed(4)}</span>
            <span className="text-right text-on-surface-variant">{r.TaxSeq}</span>
            <div className="flex justify-end gap-1.5">
              <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
              <button onClick={() => openDel(r)} className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-error hover:text-white hover:border-error transition-all">
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
            <h3 className="font-headline font-bold text-on-surface text-lg mb-5">{modal === 'add' ? 'Add Tax Row' : 'Edit Tax Row'}</h3>
            {msg && <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4"><span className="material-symbols-outlined text-[16px]">error</span>{msg.text}</div>}
            <div className="space-y-4">
              {[
                { label: 'Exemption Status', key: 'TaxSts', isText: true, placeholder: 'S, M, ME, S1…S4, M1…M4' },
                { label: 'Salary Ceiling', key: 'TaxSal', isText: false },
                { label: 'Fixed Peso Tax', key: 'TaxPeso', isText: false },
                { label: 'Rate (% decimal e.g. 0.25)', key: 'TaxPcnt', isText: false },
                { label: 'Sequence', key: 'TaxSeq', isText: false },
              ].map(({ label, key, isText, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">{label}</label>
                  <input type={isText ? 'text' : 'number'} maxLength={isText ? 4 : undefined} step={isText ? undefined : '0.0001'}
                    value={String((form as any)[key] ?? '')} placeholder={placeholder}
                    onChange={e => setForm(p => ({ ...p, [key]: isText ? e.target.value.toUpperCase() : Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModal(null); setMsg(null) }} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={save} disabled={busy} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors">{busy ? 'Saving…' : 'Save'}</button>
            </div>
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
            <h3 className="font-headline font-bold text-on-surface mb-2">Delete Tax Row?</h3>
            <p className="text-sm text-on-surface-variant/70 mb-6">Remove bracket <strong>{current.TaxSts}</strong> — Ceiling {current.TaxSal.toLocaleString()}? This cannot be undone.</p>
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
