import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Timecard {
  emp_no: string
  emp_nm: string
  dep_no: string
  period_year: number
  period_month: number
  trn_flag: string   // U=uncomputed, P=computed, X=posted

  // Hours
  reg_hrs: number; abs_hrs: number; rot_hrs: number
  sphp_hrs: number; spot_hrs: number; lghp_hrs: number
  lgot_hrs: number; nsd_hrs: number; lv_hrs: number; ls_hrs: number

  // Pay (computed)
  reg_pay: number; rot_pay: number; sphp_pay: number; spot_pay: number
  lghp_pay: number; lgot_pay: number; nsd_pay: number
  lv_pay: number; lv2_pay: number; ls_pay: number
  oth_pay1: number; oth_pay2: number; oth_pay3: number; oth_pay4: number
  lv_cashout: number; ls_cashout: number
  grs_pay: number

  // Deductions
  sln_ded: number; hdmf_ded: number; cal_ded: number
  comp_ded: number; comd_ded: number
  oth_ded1: number; oth_ded2: number; oth_ded3: number; oth_ded4: number
  oth_ded5: number; oth_ded6: number; oth_ded7: number; oth_ded8: number
  oth_ded9: number; oth_ded10: number
  tax_add: number
  sss_ee: number; med_ee: number; pgbg_ee: number; tax_ee: number
  tot_ded: number; bonus: number; bonustax: number; net_pay: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | undefined) =>
  v == null ? '—' : Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const flagInfo = (f: string) => {
  if (f === 'P') return { label: 'Computed', color: '#1e6e3c', bg: '#e6f4ea' }
  if (f === 'X') return { label: 'Posted',   color: '#7b3f00', bg: '#fff3e0' }
  return              { label: 'Uncomputed', color: '#5a5a5a', bg: '#f0f0f0' }
}

// ─── Row (summary) ────────────────────────────────────────────────────────────

function SummaryRow({ tc, onClick }: { tc: Timecard; onClick: () => void }) {
  const fi = flagInfo(tc.trn_flag)
  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border, #d0d0d0)' }}
    >
      <td style={tdStyle}>{tc.emp_no}</td>
      <td style={tdStyle}>{tc.emp_nm ?? '—'}</td>
      <td style={tdStyle}>{tc.dep_no ?? '—'}</td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(tc.grs_pay)}</td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(tc.tot_ded)}</td>
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(tc.net_pay)}</td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <span style={{
          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
          color: fi.color, background: fi.bg
        }}>{fi.label}</span>
      </td>
    </tr>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700,
  color: 'var(--text-secondary, #5a5a5a)', background: 'var(--surface-raised, #f5f5f5)',
  borderBottom: '2px solid var(--border, #d0d0d0)', whiteSpace: 'nowrap'
}
const tdStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, color: 'var(--text, #1a1a1a)'
}

// ─── Detail view ─────────────────────────────────────────────────────────────

function DetailRow({ label, value, bold }: { label: string; value: number | undefined; bold?: boolean }) {
  const v = Number(value ?? 0)
  const nonZero = v !== 0
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0',
      borderBottom: '1px solid var(--border, #d0d0d0)',
      opacity: nonZero ? 1 : 0.45
    }}>
      <span style={{ fontSize: 12, color: bold ? 'var(--text,#1a1a1a)' : 'var(--text-secondary,#5a5a5a)', fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 400, color: 'var(--text,#1a1a1a)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(v)}
      </span>
    </div>
  )
}

function DetailView({ tc, onBack }: { tc: Timecard; onBack: () => void }) {
  const fi = flagInfo(tc.trn_flag)
  const col: React.CSSProperties = {
    flex: 1, minWidth: 220,
    background: 'var(--surface-raised, #f5f5f5)',
    border: '1px solid var(--border, #d0d0d0)',
    borderRadius: 8, padding: '16px 18px'
  }
  const colTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-secondary, #5a5a5a)', marginBottom: 10
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{
            padding: '6px 14px', fontSize: 13, borderRadius: 5,
            border: '1px solid var(--border, #d0d0d0)',
            background: 'var(--surface, #ffffff)', color: 'var(--text,#1a1a1a)',
            cursor: 'pointer'
          }}
        >← Back</button>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text,#1a1a1a)' }}>
            {tc.emp_no}
          </span>
          <span style={{ fontSize: 15, color: 'var(--text-secondary,#5a5a5a)', margin: '0 6px' }}>—</span>
          <span style={{ fontSize: 15, color: 'var(--text,#1a1a1a)' }}>{tc.emp_nm ?? 'Unknown'}</span>
          {tc.dep_no && (
            <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-secondary,#5a5a5a)' }}>
              Dept: {tc.dep_no}
            </span>
          )}
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          color: fi.color, background: fi.bg, marginLeft: 'auto'
        }}>{fi.label}</span>
      </div>

      {/* Period */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary,#5a5a5a)', marginBottom: 18 }}>
        Period: <strong style={{ color: 'var(--text,#1a1a1a)' }}>
          {MONTHS[(tc.period_month ?? 1) - 1]} {tc.period_year}
        </strong>
      </div>

      {/* Two columns */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Earnings */}
        <div style={col}>
          <div style={colTitle}>Earnings</div>
          <DetailRow label="Regular Pay"          value={tc.reg_pay} />
          <DetailRow label="Overtime Pay"         value={tc.rot_pay} />
          <DetailRow label="SP.HOL Pay"           value={tc.sphp_pay} />
          <DetailRow label="SP.HOL OT Pay"        value={tc.spot_pay} />
          <DetailRow label="LGL.HOL Pay"          value={tc.lghp_pay} />
          <DetailRow label="LGL.HOL OT Pay"       value={tc.lgot_pay} />
          <DetailRow label="Night Shift Diff"     value={tc.nsd_pay} />
          <DetailRow label="VL Pay"               value={(tc.lv_pay ?? 0) + (tc.lv2_pay ?? 0)} />
          <DetailRow label="SL Pay"               value={tc.ls_pay} />
          <DetailRow label="Taxable Other Pay 1"  value={tc.oth_pay1} />
          <DetailRow label="Taxable Other Pay 2"  value={tc.oth_pay2} />
          <DetailRow label="Non-Tax Other Pay 1"  value={tc.oth_pay3} />
          <DetailRow label="Non-Tax Other Pay 2"  value={tc.oth_pay4} />
          <DetailRow label="VL Encashment"        value={tc.lv_cashout} />
          <DetailRow label="SL Encashment"        value={tc.ls_cashout} />
          <div style={{ marginTop: 8 }}>
            <DetailRow label="GROSS PAY" value={tc.grs_pay} bold />
          </div>
        </div>

        {/* Deductions */}
        <div style={col}>
          <div style={colTitle}>Deductions</div>
          <DetailRow label="W/holding Tax"     value={tc.tax_ee} />
          <DetailRow label="SSS Premium"       value={tc.sss_ee} />
          <DetailRow label="Med Premium"       value={tc.med_ee} />
          <DetailRow label="Pag-IBIG Premium"  value={tc.pgbg_ee} />
          <DetailRow label="Salary Loan"       value={tc.sln_ded} />
          <DetailRow label="HDMF Loan"         value={tc.hdmf_ded} />
          <DetailRow label="SSS Calamity Loan" value={tc.cal_ded} />
          <DetailRow label="Company Loan"      value={tc.comp_ded} />
          <DetailRow label="Company Ded"       value={tc.comd_ded} />
          <DetailRow label="Other Ded 1"       value={tc.oth_ded1} />
          <DetailRow label="Other Ded 2"       value={tc.oth_ded2} />
          <DetailRow label="Other Ded 3"       value={tc.oth_ded3} />
          <DetailRow label="Other Ded 4"       value={tc.oth_ded4} />
          <DetailRow label="Other Ded 5"       value={tc.oth_ded5} />
          <DetailRow label="Other Ded 6"       value={tc.oth_ded6} />
          <DetailRow label="Other Ded 7"       value={tc.oth_ded7} />
          <DetailRow label="Other Ded 8"       value={tc.oth_ded8} />
          <DetailRow label="Other Ded 9"       value={tc.oth_ded9} />
          <DetailRow label="Other Ded 10"      value={tc.oth_ded10} />
          <DetailRow label="Additional Tax"    value={tc.tax_add} />
          <div style={{ marginTop: 8 }}>
            <DetailRow label="TOTAL DEDUCTIONS" value={tc.tot_ded} bold />
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '2px solid var(--border,#d0d0d0)' }}>
            <DetailRow label="Bonus"     value={tc.bonus} />
            <DetailRow label="Bonus Tax" value={tc.bonustax} />
          </div>
          <div style={{ marginTop: 8 }}>
            <DetailRow label="NET PAY" value={tc.net_pay} bold />
          </div>
        </div>
      </div>

      {/* Hours summary */}
      <div style={{
        marginTop: 16, background: 'var(--surface-raised, #f5f5f5)',
        border: '1px solid var(--border,#d0d0d0)', borderRadius: 8, padding: '12px 18px'
      }}>
        <div style={{ ...colTitle, marginBottom: 8 }}>Hours</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px' }}>
          {[
            ['Regular', tc.reg_hrs], ['Absent', tc.abs_hrs], ['Overtime', tc.rot_hrs],
            ['SP.HOL', tc.sphp_hrs], ['SP.HOL OT', tc.spot_hrs],
            ['LGL.HOL', tc.lghp_hrs], ['LGL.HOL OT', tc.lgot_hrs],
            ['Night Shift', tc.nsd_hrs], ['VL Days', tc.lv_hrs], ['SL Days', tc.ls_hrs]
          ].map(([label, val]) => (
            <span key={label as string} style={{ fontSize: 12, color: Number(val) ? 'var(--text,#1a1a1a)' : 'var(--text-secondary,#5a5a5a)' }}>
              <strong>{label}:</strong> {val ?? 0}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimecardQuery() {
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [search, setSearch] = useState('')

  const [timecards, setTimecards] = useState<Timecard[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [selected,  setSelected]  = useState<Timecard | null>(null)
  const [periodLoaded, setPeriodLoaded] = useState(false)

  // Load current period from system-id
  useEffect(() => {
    fetch('/api/payroll/system-id')
      .then(r => r.json())
      .then(d => {
        if (d.PresYr) setYear(d.PresYr)
        if (d.PresMo) setMonth(d.PresMo)
        setPeriodLoaded(true)
      })
      .catch(() => setPeriodLoaded(true))
  }, [])

  const loadTimecards = useCallback(async () => {
    setLoading(true)
    setError('')
    setSelected(null)
    try {
      const res = await fetch(`/api/payroll/timecards/${year}/${month}`)
      if (!res.ok) { setError('Failed to load timecards.'); return }
      const data = await res.json()
      const rows: Timecard[] = Array.isArray(data) ? data : data.rows ?? []
      setTimecards(rows)
    } catch {
      setError('Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  // Auto-load once period is known
  useEffect(() => {
    if (periodLoaded) loadTimecards()
  }, [periodLoaded, loadTimecards])

  const filtered = search.trim()
    ? timecards.filter(t =>
        t.emp_no?.includes(search.trim()) ||
        (t.emp_nm ?? '').toLowerCase().includes(search.trim().toLowerCase())
      )
    : timecards

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', fontSize: 13,
    background: 'var(--surface, #ffffff)', color: 'var(--text,#1a1a1a)',
    border: '1px solid var(--border,#d0d0d0)', borderRadius: 4
  }

  if (selected) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text,#1a1a1a)', marginBottom: 20 }}>
          Timecard Query
        </h2>
        <DetailView tc={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text,#1a1a1a)', marginBottom: 6 }}>
        Timecard Query
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary,#5a5a5a)', marginBottom: 20 }}>
        View timecard records for a payroll period. Click a row for the full breakdown.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary,#5a5a5a)', marginBottom: 4 }}>
            YEAR
          </label>
          <input
            type="number" value={year} min={2000} max={2099}
            onChange={e => setYear(Number(e.target.value))}
            style={{ ...inputStyle, width: 80 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary,#5a5a5a)', marginBottom: 4 }}>
            MONTH
          </label>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            style={{ ...inputStyle, width: 110 }}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <button
          onClick={loadTimecards}
          disabled={loading}
          style={{
            padding: '7px 18px', fontSize: 13, fontWeight: 600, borderRadius: 5, border: 'none',
            background: 'var(--accent,#0066cc)', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading…' : 'Load'}
        </button>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary,#5a5a5a)', marginBottom: 4 }}>
            SEARCH
          </label>
          <input
            placeholder="Filter by EMP# or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fdecea', border: '1px solid #f5c6c6', borderRadius: 6,
          padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b71c1c'
        }}>{error}</div>
      )}

      {/* Summary */}
      {!loading && timecards.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary,#5a5a5a)', marginBottom: 10 }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          {search.trim() ? ` matching "${search}"` : ` — ${MONTHS[month - 1]} ${year}`}
          {' '}| Total net: <strong style={{ color: 'var(--text,#1a1a1a)' }}>
            ₱ {filtered.reduce((s, t) => s + (t.net_pay ?? 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary,#5a5a5a)', fontSize: 14 }}>
          Loading timecards…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', fontSize: 14,
          color: 'var(--text-secondary,#5a5a5a)',
          background: 'var(--surface-raised,#f5f5f5)',
          border: '1px solid var(--border,#d0d0d0)', borderRadius: 8
        }}>
          {timecards.length === 0
            ? `No timecards found for ${MONTHS[month - 1]} ${year}.`
            : 'No records match your search.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border,#d0d0d0)', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>EMP #</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Dept</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross Pay</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total Ded</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Net Pay</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tc => (
                <SummaryRow
                  key={`${tc.emp_no}-${tc.period_year}-${tc.period_month}`}
                  tc={tc}
                  onClick={() => setSelected(tc)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
