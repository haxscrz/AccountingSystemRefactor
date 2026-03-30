import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface OrSbrRecord {
  Id: number; PreFlag: string; Month: number; Year: number
  OrSbr: string; OrDate: string; Period: number; Amount: number
}

const BLANK_RECORD = (type: string): Omit<OrSbrRecord, 'Id'> => ({
  PreFlag: type === 'sss' ? 'S' : 'T',
  Month: new Date().getMonth() + 1, Year: new Date().getFullYear(),
  OrSbr: '', OrDate: new Date().toISOString().slice(0, 10), Period: 1, Amount: 0
})

const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 })

interface Props { type: 'sss' | 'pagibig' }

export default function OrSbrEntry({ type }: Props) {
  const [records, setRecords] = useState<OrSbrRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState<Omit<OrSbrRecord, 'Id'> & { Id?: number }>(BLANK_RECORD(type))
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  useEffect(() => { load() }, [type])

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/payroll/or-sbr/${type}`)
      const data = await res.json()
      if (res.ok) setRecords(data); else setError('Could not load records.')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setForm(BLANK_RECORD(type)); setIsEdit(false); setFormError(''); setShowModal(true) }
  const openEdit = (rec: OrSbrRecord) => { setForm({ ...rec }); setIsEdit(true); setFormError(''); setShowModal(true) }

  const validate = () => {
    if (!form.OrSbr.trim()) return 'OR/SBR number is required.'
    if (!form.OrDate) return 'OR Date is required.'
    if (form.Amount <= 0) return 'Amount must be greater than 0.'
    if (form.Month < 1 || form.Month > 12) return 'Month must be 1–12.'
    return null
  }

  const handleSave = async () => {
    const err = validate(); if (err) { setFormError(err); return }
    setSaving(true); setFormError('')
    try {
      const url = !isEdit ? '/api/payroll/or-sbr' : `/api/payroll/or-sbr/${form.Id}`
      const res = await fetch(url, { method: !isEdit ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, preFlag: form.PreFlag }) })
      if (res.ok) { setShowModal(false); load() }
      else { const d = await res.json(); setFormError(d.error || d.message || 'Save failed.') }
    } catch { setFormError('Network error.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    setDeleteId(null)
    try { await fetch(`/api/payroll/or-sbr/${id}`, { method: 'DELETE' }); load() }
    catch { setError('Delete failed.') }
  }

  const title = type === 'sss' ? 'SSS OR/SBR Entry' : 'Pag-IBIG OR/SBR Entry'
  const orLabel = type === 'sss' ? 'OR No.' : 'SBR No.'
  const breadcrumb = type === 'sss' ? 'PAYROLL / SSS OR-SBR' : 'PAYROLL / PAG-IBIG OR-SBR'

  const filtered = records.filter(r => r.Year === filterYear)
  const years = [...new Set(records.map(r => r.Year))].sort((a, b) => b - a)
  if (!years.includes(filterYear)) years.unshift(filterYear)
  const totalAmount = filtered.reduce((s, r) => s + r.Amount, 0)

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        subtitle={type === 'sss' ? 'Manages SSS remittance OR/SBR numbers (ENTORSBR.PRG)' : 'Manages Pag-IBIG remittance OR/SBR numbers (ENTORPAG.PRG)'}
        actions={
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Record
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-on-surface-variant font-medium">Filter by Year:</label>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          className="px-3 py-2 border border-outline-variant/20 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-on-surface-variant/60">{filtered.length} record(s)</span>
        {filtered.length > 0 && <span className="ml-auto text-sm font-bold text-on-surface">Total: ₱{fmt(totalAmount)}</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <span className="material-symbols-outlined text-[18px]">error</span> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1.5fr_100px] px-5 py-3 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          <span>Month</span><span>Year</span><span>{orLabel}</span><span>OR Date</span><span>Period</span>
          <span className="text-right">Amount</span><span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-on-surface-variant/50 text-sm animate-pulse">
            <span className="material-symbols-outlined animate-spin mr-2">sync</span>Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
            <p className="text-sm">No records for {filterYear}. Click Add Record to add.</p>
          </div>
        ) : filtered.map((rec, i) => (
          <div key={rec.Id} className={`grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1.5fr_100px] px-5 py-3.5 border-t border-outline-variant/10 text-sm hover:bg-primary/5 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/30'}`}>
            <span className="font-medium">{MONTHS_SHORT[rec.Month]}</span>
            <span className="text-on-surface-variant">{rec.Year}</span>
            <span className="font-mono font-bold text-primary">{rec.OrSbr}</span>
            <span className="text-on-surface-variant">{rec.OrDate?.slice(0, 10)}</span>
            <span className="text-on-surface-variant">{rec.Period === 1 ? '1st Half' : '2nd Half'}</span>
            <span className="text-right font-mono font-semibold text-emerald-700">₱{fmt(rec.Amount)}</span>
            <div className="flex justify-end gap-1.5">
              <button onClick={() => openEdit(rec)} className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
              <button onClick={() => setDeleteId(rec.Id)} className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-error hover:text-white hover:border-error transition-all">
                <span className="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </div>
          </div>
        ))}
        {filtered.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1.5fr_100px] px-5 py-3.5 border-t border-outline-variant/10 bg-surface-container-highest text-sm font-bold">
            <span className="col-span-5 text-right text-on-surface-variant">Total:</span>
            <span className="text-right font-mono text-emerald-700">₱{fmt(totalAmount)}</span>
            <span />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-8 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-5">{isEdit ? 'Edit' : 'Add'} {title.replace(' Entry', '')} Record</h3>
            {formError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <span className="material-symbols-outlined text-[16px]">error</span> {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Month', el: <select value={form.Month} onChange={e => setForm({ ...form, Month: Number(e.target.value) })} className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{MONTHS_SHORT[m]}</option>)}
                </select> },
                { label: 'Year', el: <input type="number" value={form.Year} onChange={e => setForm({ ...form, Year: Number(e.target.value) })} className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" /> },
                { label: orLabel, el: <input type="text" value={form.OrSbr} onChange={e => setForm({ ...form, OrSbr: e.target.value })} className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" /> },
                { label: 'OR Date', el: <input type="date" value={form.OrDate?.slice(0, 10) ?? ''} onChange={e => setForm({ ...form, OrDate: e.target.value })} className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" /> },
                { label: 'Period', el: <select value={form.Period} onChange={e => setForm({ ...form, Period: Number(e.target.value) })} className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value={1}>1st Half</option><option value={2}>2nd Half</option>
                </select> },
                { label: 'Amount (₱)', el: <input type="number" step="0.01" min="0" value={form.Amount} onChange={e => setForm({ ...form, Amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm text-right font-mono bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" /> },
              ].map(({ label, el }) => (
                <div key={label}>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">{label}</label>
                  {el}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} disabled={saving} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h3 className="font-headline font-bold text-on-surface mb-2">Delete Record</h3>
            <p className="text-sm text-on-surface-variant/70 mb-6">Are you sure you want to delete this OR/SBR record?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-3 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-3 py-2 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
