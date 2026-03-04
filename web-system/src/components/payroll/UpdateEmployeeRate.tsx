/**
 * UpdateEmployeeRate.tsx — Update Employee Rate (MASTRATE.PRG)
 * Bulk salary update: filter by dept range, union membership, salary range,
 * then add or subtract a fixed amount.
 */
import { useState } from 'react'
import ModalPortal from '../ModalPortal'

interface RateForm {
  DeptMode: 'ALL' | 'SPECIFIC'
  FromDept: string; ToDept: string
  UnionMode: 'ALL' | 'MEMBER' | 'NON-MEMBER'
  SalaryMode: 'ALL' | 'SPECIFIC'
  FromSalary: number; ToSalary: number
  Amount: number
}

const DEFAULT: RateForm = {
  DeptMode: 'ALL', FromDept: '', ToDept: '',
  UnionMode: 'ALL',
  SalaryMode: 'ALL', FromSalary: 0, ToSalary: 0,
  Amount: 0
}

export default function UpdateEmployeeRate() {
  const [form, setForm]     = useState<RateForm>(DEFAULT)
  const [confirm, setConfirm] = useState(false)
  const [result, setResult]  = useState<{ updated: number } | null>(null)
  const [msg, setMsg]        = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy]      = useState(false)

  const set = <K extends keyof RateForm>(key: K, val: RateForm[K]) =>
    setForm(p => ({ ...p, [key]: val }))

  const submit = async () => {
    setBusy(true); setMsg(null)
    try {
      const res  = await fetch('/api/payroll/update-employee-rate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const json = await res.json()
      if (res.ok) { setResult(json); setConfirm(false); setForm(DEFAULT) }
      else        setMsg({ text: json.error || 'Update failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setBusy(false) }
  }

  const Label = ({ label }: { label: string }) => (
    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</span>
  )

  const Radio = <K extends keyof RateForm>({
    k, v, label
  }: { k: K; v: RateForm[K]; label: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
      <input type="radio" name={String(k)} checked={form[k] === v}
        onChange={() => set(k, v)} />
      {label}
    </label>
  )

  const NumberInput = ({ k, label }: { k: 'FromDept' | 'ToDept' | 'FromSalary' | 'ToSalary' | 'Amount'; label: string }) => (
    <div>
      <Label label={label} />
      <input type="number" value={String(form[k])}
        onChange={e => setForm(p => ({ ...p, [k]: Number(e.target.value) }))}
        style={{ padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)',
          background: 'var(--input-bg, #2a2a2a)', color: 'var(--text)', borderRadius: 3, width: '100%' }}
      />
    </div>
  )

  const TextInput = ({ k, label }: { k: 'FromDept' | 'ToDept'; label: string }) => (
    <div>
      <Label label={label} />
      <input type="text" value={form[k]}
        onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
        style={{ padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)',
          background: 'var(--input-bg, #2a2a2a)', color: 'var(--text)', borderRadius: 3, width: '100%' }}
      />
    </div>
  )

  return (
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Update Employee Rate</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          MASTRATE — Bulk rate adjustment by department, union, or salary range
        </p>
      </div>

      {result && (
        <div style={{ padding: '12px 16px', borderRadius: 4, marginBottom: 16,
          background: 'rgba(46,160,67,0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 14 }}>
          Rate update complete — <b>{result.updated}</b> employee{result.updated !== 1 ? 's' : ''} updated.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
        {/* Department Filter */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 6 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
            Department
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <Radio k="DeptMode" v="ALL"      label="All Departments" />
            <Radio k="DeptMode" v="SPECIFIC" label="Specific Range" />
          </div>
          {form.DeptMode === 'SPECIFIC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TextInput k="FromDept" label="From Dept Code" />
              <TextInput k="ToDept"   label="To Dept Code" />
            </div>
          )}
        </div>

        {/* Union Filter */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 6 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
            Union Membership
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Radio k="UnionMode" v="ALL"        label="All Employees" />
            <Radio k="UnionMode" v="MEMBER"     label="Union Members Only" />
            <Radio k="UnionMode" v="NON-MEMBER" label="Non-Members Only" />
          </div>
        </div>

        {/* Salary Filter */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 6 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
            Salary Range
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <Radio k="SalaryMode" v="ALL"      label="All Salaries" />
            <Radio k="SalaryMode" v="SPECIFIC" label="Specific Range" />
          </div>
          {form.SalaryMode === 'SPECIFIC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <NumberInput k="FromSalary" label="From Salary" />
              <NumberInput k="ToSalary"   label="To Salary" />
            </div>
          )}
        </div>
      </div>

      {/* Amount */}
      <div style={{ marginTop: 20, padding: 16, border: '1px solid var(--border)',
        borderRadius: 6, maxWidth: 320 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Rate Adjustment
        </h3>
        <Label label="Amount to Add / Subtract (use positive or negative value)" />
        <input type="number" value={form.Amount}
          onChange={e => setForm(p => ({ ...p, Amount: Number(e.target.value) }))}
          style={{ padding: '6px 10px', fontSize: 15, border: '1px solid var(--border)',
            background: 'var(--input-bg, #2a2a2a)', color: 'var(--text)', borderRadius: 3, width: '100%' }}
        />
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          e.g. <code>500</code> adds ₱500 to each matched employee's rate.{' '}
          Use <code>-500</code> to reduce by ₱500.
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary"
          disabled={form.Amount === 0}
          onClick={() => { setMsg(null); setConfirm(true) }}
          style={{ minWidth: 180 }}>
          Update Employee Rates
        </button>
        {form.Amount === 0 && (
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
            Enter a non-zero amount first.
          </span>
        )}
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <ModalPortal onClick={() => setConfirm(false)}>
          <div style={{ width: 380 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Confirm Rate Update</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              <div style={{ marginBottom: 6 }}>
                <b style={{ color: 'var(--text)' }}>Department:</b>{' '}
                {form.DeptMode === 'ALL' ? 'All' : `${form.FromDept} → ${form.ToDept}`}
              </div>
              <div style={{ marginBottom: 6 }}>
                <b style={{ color: 'var(--text)' }}>Union:</b>{' '}
                {form.UnionMode === 'ALL' ? 'All' : form.UnionMode === 'MEMBER' ? 'Union Members Only' : 'Non-Members Only'}
              </div>
              <div style={{ marginBottom: 6 }}>
                <b style={{ color: 'var(--text)' }}>Salary:</b>{' '}
                {form.SalaryMode === 'ALL' ? 'All' : `₱${form.FromSalary.toLocaleString()} → ₱${form.ToSalary.toLocaleString()}`}
              </div>
              <div>
                <b style={{ color: 'var(--text)' }}>Adjustment:</b>{' '}
                <span style={{ color: form.Amount >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                  {form.Amount >= 0 ? '+' : ''}₱{form.Amount.toLocaleString()}
                </span>
              </div>
            </div>
            {msg && (
              <div style={{ padding: '6px 10px', borderRadius: 3, marginBottom: 10, fontSize: 12,
                background: 'rgba(220,53,53,0.15)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                {msg.text}
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              This will permanently modify the salary of all matched employees. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary"   onClick={submit} disabled={busy} style={{ flex: 1 }}>
                {busy ? 'Updating…' : 'Confirm'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
