import { useState, useEffect } from 'react'
import ModalPortal from '../ModalPortal'

interface OrSbrRecord {
  Id: number
  PreFlag: string
  Month: number
  Year: number
  OrSbr: string
  OrDate: string
  Period: number
  Amount: number
}

const BLANK_RECORD = (type: string): Omit<OrSbrRecord, 'Id'> => ({
  PreFlag: type === 'sss' ? 'S' : 'T',
  Month: new Date().getMonth() + 1,
  Year: new Date().getFullYear(),
  OrSbr: '',
  OrDate: new Date().toISOString().slice(0, 10),
  Period: 1,
  Amount: 0
})

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props { type: 'sss' | 'pagibig' }

export default function OrSbrEntry({ type }: Props) {
  const [records, setRecords] = useState<OrSbrRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState<Omit<OrSbrRecord, 'Id'> & { Id?: number }>(BLANK_RECORD(type))
  const [formError, setFormError] = useState('')

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Filter
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  useEffect(() => { load() }, [type])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/payroll/or-sbr/${type}`)
      const data = await res.json()
      if (res.ok) setRecords(data)
      else setError('Could not load records.')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setForm(BLANK_RECORD(type))
    setIsEdit(false)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (rec: OrSbrRecord) => {
    setForm({ ...rec })
    setIsEdit(true)
    setFormError('')
    setShowModal(true)
  }

  const validate = () => {
    if (!form.OrSbr.trim()) return 'OR/SBR number is required.'
    if (!form.OrDate) return 'OR Date is required.'
    if (form.Amount <= 0) return 'Amount must be greater than 0.'
    if (form.Month < 1 || form.Month > 12) return 'Month must be 1–12.'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError('')
    try {
      const isNew = !isEdit
      const url = isNew
        ? '/api/payroll/or-sbr'
        : `/api/payroll/or-sbr/${form.Id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, preFlag: form.PreFlag })
      })
      if (res.ok) {
        setShowModal(false)
        load()
      } else {
        const d = await res.json()
        setFormError(d.error || d.message || 'Save failed.')
      }
    } catch {
      setFormError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleteId(null)
    try {
      await fetch(`/api/payroll/or-sbr/${id}`, { method: 'DELETE' })
      load()
    } catch {
      setError('Delete failed.')
    }
  }

  const title = type === 'sss' ? 'SSS OR/SBR Entry' : 'Pag-IBIG OR/SBR Entry'
  const subtitle = type === 'sss'
    ? 'Manages SSS remittance OR/SBR numbers. Equivalent to ENTORSBR.PRG.'
    : 'Manages Pag-IBIG remittance OR/SBR numbers. Equivalent to ENTORPAG.PRG.'
  const orLabel = type === 'sss' ? 'OR No.' : 'SBR No.'

  const filtered = records.filter(r => r.Year === filterYear)
  const years = [...new Set(records.map(r => r.Year))].sort((a, b) => b - a)
  if (!years.includes(filterYear)) years.unshift(filterYear)

  const totalAmount = filtered.reduce((s, r) => s + r.Amount, 0)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Record</button>
      </div>

      {/* Year filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px' }}>Filter by year:</span>
        <select
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{filtered.length} record(s)</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc3545' }}>
          &#9888; {error}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Year</th>
              <th>{orLabel}</th>
              <th>OR Date</th>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No records for {filterYear}. Click "Add Record" to add.
                </td>
              </tr>
            ) : (
              filtered.map(rec => (
                <tr key={rec.Id}>
                  <td>{MONTHS[rec.Month]}</td>
                  <td>{rec.Year}</td>
                  <td style={{ fontFamily: 'monospace' }}>{rec.OrSbr}</td>
                  <td>{rec.OrDate}</td>
                  <td>{rec.Period === 1 ? '1st Half' : rec.Period === 2 ? '2nd Half' : rec.Period}</td>
                  <td style={{ textAlign: 'right' }}>₱{rec.Amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '12px' }} onClick={() => openEdit(rec)}>Edit</button>
                      <button className="btn" style={{ padding: '3px 10px', fontSize: '12px', background: 'rgba(220,53,69,0.1)', color: '#dc3545', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '4px' }} onClick={() => setDeleteId(rec.Id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--panel-2)', fontWeight: '600' }}>
                <td colSpan={5} style={{ textAlign: 'right' }}>Total:</td>
                <td style={{ textAlign: 'right' }}>₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <ModalPortal onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{isEdit ? 'Edit' : 'Add'} {title.replace(' Entry', '')} Record</h3>

            {formError && (
              <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '6px', padding: '10px', marginBottom: '14px', fontSize: '13px', color: '#dc3545' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Month</label>
                <select
                  value={form.Month}
                  onChange={e => setForm({ ...form, Month: Number(e.target.value) })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{MONTHS[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Year</label>
                <input
                  type="number"
                  value={form.Year}
                  onChange={e => setForm({ ...form, Year: Number(e.target.value) })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{orLabel}</label>
                <input
                  type="text"
                  value={form.OrSbr}
                  onChange={e => setForm({ ...form, OrSbr: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>OR Date</label>
                <input
                  type="date"
                  value={form.OrDate?.slice(0, 10) ?? ''}
                  onChange={e => setForm({ ...form, OrDate: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Period</label>
                <select
                  value={form.Period}
                  onChange={e => setForm({ ...form, Period: Number(e.target.value) })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                >
                  <option value={1}>1st Half</option>
                  <option value={2}>2nd Half</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.Amount}
                  onChange={e => setForm({ ...form, Amount: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <ModalPortal onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px' }}>Delete Record</h3>
            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>Are you sure you want to delete this OR/SBR record?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn" style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px' }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
