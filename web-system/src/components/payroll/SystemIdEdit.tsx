/**
 * SystemIdEdit.tsx — Edit Systems ID
 * Mirrors SYSTEDIT.PRG: maintain system ID / payroll period file.
 */
import { useState, useEffect } from 'react'

interface SysId {
  PresMo: number; PresYr: number; PayType: number
  BegDate: string; EndDate: string
  TrnCtr: number; TrnPrc: number; TrnUpd: number
  WorkHours: number
  HdmfPre: number; PgLower: number; PgHigher: number; PgLwper: number; PgHiper: number
  BonDays: number; BonMont: number; TaxBon: number
  MDailyWage: boolean; NeedBackup: boolean; EmpCount: number; TcCount: number; SysNm: string
}

export default function SystemIdEdit() {
  const [data, setData] = useState<SysId | null>(null)
  const [form, setForm] = useState<Partial<SysId>>({})
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/payroll/system-id')
      .then(r => r.json()).then(d => { setData(d); setForm(d) }).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/payroll/system-id', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (res.ok) { setMsg({ text: 'System ID saved.', ok: true }); setEditing(false); load() }
      else         setMsg({ text: json.error || json.message || 'Save failed.', ok: false })
    } catch { setMsg({ text: 'Network error.', ok: false }) }
    finally { setSaving(false) }
  }

  const fld = (key: keyof SysId, label: string, type: 'text' | 'number' | 'date' | 'checkbox' = 'text', readOnly = false) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ flex: '0 0 280px', fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      {type === 'checkbox' ? (
        readOnly
          ? <span style={{ fontSize: 13 }}>{form[key] ? 'Yes' : 'No'}</span>
          : <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} disabled={!editing} />
      ) : (
        <input
          type={type}
          value={type === 'date' ? String(form[key] ?? '').slice(0, 10) : String(form[key] ?? '')}
          readOnly={readOnly || !editing}
          style={{
            flex: 1, padding: '3px 6px', fontSize: 13, border: '1px solid var(--border)',
            background: (readOnly || !editing) ? 'var(--surface-raised, #f5f5f5)' : 'var(--surface, #ffffff)',
            color: 'var(--text, #1a1a1a)', borderRadius: 3,
          }}
          onChange={e => !readOnly && setForm(p => ({
            ...p,
            [key]: type === 'number' ? Number(e.target.value) : e.target.value
          }))}
        />
      )}
    </div>
  )

  if (!data) return <div className="card"><p style={{ color: 'var(--text-secondary)' }}>Loading system ID…</p></div>

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Edit Systems ID</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            SYSTEDIT — Maintain System ID / Payroll Period Information
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing
            ? <>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(data) }}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </>
            : <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit</button>
          }
        </div>
      </div>

      {msg && (
        <div style={{ padding: '8px 12px', borderRadius: 4, marginBottom: 12,
          background: msg.ok ? 'rgba(46,160,67,0.15)' : 'rgba(220,53,53,0.15)',
          border: `1px solid ${msg.ok ? 'var(--success)' : 'var(--danger)'}`,
          color: msg.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-secondary)', margin: '0 0 8px' }}>Payroll Period</h3>
          {fld('SysNm',    'Company / Organization Name', 'text')}
          {fld('EmpCount',  'No. of Employees on Record', 'number', true)}
          {fld('PresMo',    'Present Month (1-12)', 'number')}
          {fld('PresYr',    'Present Year', 'number')}
          {fld('PayType',   'Pay Type (1=1st Half, 2=2nd Half, 3=Monthly)', 'number')}
          {fld('BegDate',   'Date Covered (Beginning)', 'date')}
          {fld('EndDate',   'Date Covered (Ending)', 'date')}
          {fld('TrnCtr',    'No. of Timecards Entered', 'number', true)}
          {fld('TrnPrc',    'No. of Timecards Processed', 'number')}
          {fld('TrnUpd',    'No. of Timecards Posted', 'number')}
          {fld('WorkHours', 'TTL Working Hours This Period', 'number')}
          {fld('MDailyWage','Daily Wage Flag', 'checkbox')}
          {fld('NeedBackup','Needs Backup', 'checkbox', true)}
        </div>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-secondary)', margin: '0 0 8px' }}>Benefit Parameters</h3>
          {fld('HdmfPre',  'PAG-IBIG Premium Rate', 'number')}
          {fld('PgLower',  'PAG-IBIG Lower Bracket Ceiling', 'number')}
          {fld('PgHigher', 'PAG-IBIG Higher Bracket Ceiling', 'number')}
          {fld('PgLwper',  'PAG-IBIG Lower Bracket Rate', 'number')}
          {fld('PgHiper',  'PAG-IBIG Higher Bracket Rate', 'number')}
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-secondary)', margin: '16px 0 8px' }}>13th Month Parameters</h3>
          {fld('BonDays',  'Bonus Working Days Divisor', 'number')}
          {fld('BonMont',  'No. of Months Covered', 'number')}
          {fld('TaxBon',   'Non-Taxable 13th Month Ceiling', 'number')}
          <div style={{ marginTop: 16, padding: '8px 10px', background: 'var(--surface-raised, #f5f5f5)',
            border: '1px solid var(--border, #d0d0d0)', borderRadius: 4, fontSize: 12, color: 'var(--text-secondary, #5a5a5a)' }}>
            <div>Employees: <b style={{ color: 'var(--text)' }}>{data.EmpCount}</b></div>
            <div>Timecards: <b style={{ color: 'var(--text)' }}>{data.TcCount}</b></div>
          </div>
        </div>
      </div>
    </div>
  )
}
