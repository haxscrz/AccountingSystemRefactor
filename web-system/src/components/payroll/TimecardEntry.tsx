import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface TimecardEntryProps {
  payrollType: 'regular' | 'casual' | null
}

interface Timecard {
  emp_no: string; emp_nm: string; dep_no: string
  period_year: number; period_month: number
  reg_hrs: number; abs_hrs: number; rot_hrs: number; sphp_hrs: number; spot_hrs: number
  lghp_hrs: number; lgot_hrs: number; nsd_hrs: number; lv_hrs: number; ls_hrs: number
  oth_pay1: number; oth_pay2: number; oth_pay3: number; oth_pay4: number
  lv_cashout: number; ls_cashout: number
  sln_ded: number; hdmf_ded: number; cal_ded: number; comp_ded: number; comd_ded: number
  oth_ded1: number; oth_ded2: number; oth_ded3: number; oth_ded4: number; oth_ded5: number
  oth_ded6: number; oth_ded7: number; oth_ded8: number; oth_ded9: number; tax_add: number
  withbonus: boolean; bonus: number
  reg_pay: number; rot_pay: number; sphp_pay: number; spot_pay: number; lghp_pay: number
  lgot_pay: number; nsd_pay: number; lv_pay: number; lv2_pay: number; ls_pay: number
  grs_pay: number; sss_ee: number; sss_er: number; med_ee: number; med_er: number
  pgbg_ee: number; pgbg_er: number; ec_er: number; tax_ee: number; tot_ded: number
  net_pay: number; bonustax: number
}

interface EmpLookup {
  emp_no: string; emp_nm: string; dep_no: string; b_rate: number
}

const BLANK_TIMECARD = (emp_no: string, emp_nm: string, dep_no: string, year: number, month: number): Timecard => ({
  emp_no, emp_nm, dep_no, period_year: year, period_month: month,
  reg_hrs: 0, abs_hrs: 0, rot_hrs: 0, sphp_hrs: 0, spot_hrs: 0, lghp_hrs: 0,
  lgot_hrs: 0, nsd_hrs: 0, lv_hrs: 0, ls_hrs: 0, oth_pay1: 0, oth_pay2: 0,
  oth_pay3: 0, oth_pay4: 0, lv_cashout: 0, ls_cashout: 0, sln_ded: 0, hdmf_ded: 0,
  cal_ded: 0, comp_ded: 0, comd_ded: 0, oth_ded1: 0, oth_ded2: 0, oth_ded3: 0,
  oth_ded4: 0, oth_ded5: 0, oth_ded6: 0, oth_ded7: 0, oth_ded8: 0, oth_ded9: 0,
  tax_add: 0, withbonus: true, bonus: 0,
  reg_pay: 0, rot_pay: 0, sphp_pay: 0, spot_pay: 0, lghp_pay: 0, lgot_pay: 0,
  nsd_pay: 0, lv_pay: 0, lv2_pay: 0, ls_pay: 0, grs_pay: 0, sss_ee: 0, sss_er: 0,
  med_ee: 0, med_er: 0, pgbg_ee: 0, pgbg_er: 0, ec_er: 0, tax_ee: 0, tot_ded: 0,
  net_pay: 0, bonustax: 0
})

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n: number) {
  return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function NumInput({ label, value, onChange, step = '0.01' }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <div className="group">
      <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">{label}</label>
      <input
        type="number" step={step}
        className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export default function TimecardEntry({ payrollType }: TimecardEntryProps) {
  const [timecards, setTimecards] = useState<Timecard[]>([])
  const [selectedTimecard, setSelectedTimecard] = useState<Timecard | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [isNewEntry, setIsNewEntry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
  const [periodLoaded, setPeriodLoaded] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [employees, setEmployees] = useState<EmpLookup[]>([])
  const [empSearch, setEmpSearch] = useState('')
  const [loadingEmps, setLoadingEmps] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Timecard | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/payroll/system-id')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.presYr && d?.presMo) setCurrentPeriod({ year: d.presYr, month: d.presMo }) })
      .catch(() => {})
      .finally(() => setPeriodLoaded(true))
  }, [])

  useEffect(() => { if (payrollType && periodLoaded) fetchTimecards() }, [payrollType, currentPeriod, periodLoaded])

  const fetchTimecards = async () => {
    try {
      const res = await fetch(`/api/payroll/timecards/${currentPeriod.year}/${currentPeriod.month}`)
      if (res.ok) setTimecards(await res.json())
    } catch { /* ignore */ }
  }

  const fetchEmployees = async () => {
    setLoadingEmps(true)
    try {
      const res = await fetch('/api/payroll/employees/all')
      if (res.ok) setEmployees(await res.json())
    } catch { /* ignore */ }
    finally { setLoadingEmps(false) }
  }

  const handleOpenAddDialog = () => { setEmpSearch(''); setShowAddDialog(true); if (employees.length === 0) fetchEmployees() }
  const handleSelectEmployee = (emp: EmpLookup) => {
    setShowAddDialog(false)
    const blank = BLANK_TIMECARD(emp.emp_no, emp.emp_nm, emp.dep_no ?? '', currentPeriod.year, currentPeriod.month)
    setSelectedTimecard(blank); setIsNewEntry(true); setShowEdit(true)
  }
  const handleEdit = (tc: Timecard) => { setSelectedTimecard({ ...tc }); setIsNewEntry(false); setShowEdit(true) }

  const handleDelete = async (tc: Timecard) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll/timecards/${tc.emp_no}/${tc.period_year}/${tc.period_month}`, { method: 'DELETE' })
      if (res.ok) { await fetchTimecards(); setDeleteConfirm(null) }
      else alert(`Error: ${(await res.json()).message}`)
    } catch { alert('Failed to delete timecard.') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!selectedTimecard) return
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/timecards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTimecard)
      })
      if (res.ok) { await fetchTimecards(); setShowEdit(false); setIsNewEntry(false) }
      else alert(`Error: ${(await res.json()).message}`)
    } catch { alert('Failed to save timecard.') }
    finally { setLoading(false) }
  }

  const up = (field: Partial<Timecard>) => setSelectedTimecard(prev => prev ? { ...prev, ...field } : prev)

  if (!payrollType) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl mb-4 opacity-30">access_time</span>
        <p className="font-semibold">Select a payroll type (Regular or Casual) from the sidebar first.</p>
      </div>
    )
  }

  const filtered = timecards.filter(tc =>
    !searchQuery ||
    tc.emp_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.emp_nm.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tc.dep_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalGross = timecards.reduce((s, t) => s + Number(t.grs_pay), 0)
  const totalDed = timecards.reduce((s, t) => s + Number(t.tot_ded), 0)
  const totalNet = timecards.reduce((s, t) => s + Number(t.net_pay), 0)

  return (
    <div className="flex flex-col gap-0 h-full -mx-10 -my-10">
      {/* ── Top content area ── */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-10 pt-10 pb-5">
          <PageHeader
            breadcrumb={`PAYROLL / ${payrollType?.toUpperCase()} EMPLOYEES`}
            title="Timecard Entry"
            subtitle={`Data entry for earnings (A–P) and deductions (Q–AE) for ${MONTHS[currentPeriod.month - 1]} ${currentPeriod.year}`}
            actions={
              <>
                {/* Period selectors */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Period</span>
                  <select
                    className="px-2 py-1.5 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none"
                    value={currentPeriod.month}
                    onChange={e => setCurrentPeriod(p => ({ ...p, month: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{MONTHS[m - 1]}</option>
                    ))}
                  </select>
                  <select
                    className="px-2 py-1.5 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none"
                    value={currentPeriod.year}
                    onChange={e => setCurrentPeriod(p => ({ ...p, year: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 8 }, (_, i) => currentPeriod.year - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleOpenAddDialog} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">person_add</span> Add Employee
                </button>
              </>
            }
          />

          {/* Period summary stats */}
          <div className="grid grid-cols-4 gap-4 mt-2">
            {[
              { label: 'Employees', val: timecards.length.toString(), icon: 'group', color: 'text-primary' },
              { label: 'Total Gross', val: `₱${fmt(totalGross)}`, icon: 'payments', color: 'text-emerald-600' },
              { label: 'Total Deductions', val: `₱${fmt(totalDed)}`, icon: 'remove_circle', color: 'text-error' },
              { label: 'Net Payroll', val: `₱${fmt(totalNet)}`, icon: 'account_balance', color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-outline-variant/15 px-5 py-4 flex items-center gap-3 shadow-sm">
                <span className={`material-symbols-outlined text-[22px] ${s.color} opacity-70`}>{s.icon}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">{s.label}</div>
                  <div className={`font-mono font-bold text-base ${s.color}`}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-10 pb-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow shadow-sm"
              placeholder="Search by employee number, name, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-grow overflow-auto px-10 pb-10">
          {timecards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4">assignment</span>
              <p className="font-semibold text-on-surface-variant">No timecards for {MONTHS[currentPeriod.month-1]} {currentPeriod.year}</p>
              <p className="text-sm text-on-surface-variant/60 mt-1 mb-5">Use Initialize Timecard or click Add Employee to begin</p>
              <button onClick={handleOpenAddDialog} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">person_add</span> Add Employee
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_2.5fr_1fr_1fr_1fr_1.5fr_1.5fr_1.8fr_1fr_120px] px-5 py-3 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                <span>Emp No.</span>
                <span>Name</span>
                <span>Dept</span>
                <span className="text-right">Reg Hrs</span>
                <span className="text-right">OT Hrs</span>
                <span className="text-right">Gross Pay</span>
                <span className="text-right">Deductions</span>
                <span className="text-right">Net Pay</span>
                <span className="text-center">Status</span>
                <span className="text-right">Actions</span>
              </div>

              {filtered.map((tc, i) => {
                const flag = (tc as any).trn_flag
                const statusLabel = flag === 'P' ? 'Computed' : flag === 'X' ? 'Posted' : 'Pending'
                const statusClass = flag === 'P' ? 'bg-emerald-100 text-emerald-700' : flag === 'X' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                return (
                  <div
                    key={tc.emp_no}
                    className={`grid grid-cols-[1fr_2.5fr_1fr_1fr_1fr_1.5fr_1.5fr_1.8fr_1fr_120px] px-5 py-3.5 border-t border-outline-variant/10 text-sm hover:bg-surface-container-low transition-colors group cursor-pointer ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/40'}`}
                    onClick={() => handleEdit(tc)}
                  >
                    <span className="font-mono font-bold text-primary">{tc.emp_no}</span>
                    <span className="font-medium text-on-surface truncate">{tc.emp_nm}</span>
                    <span className="text-on-surface-variant">{tc.dep_no}</span>
                    <span className="text-right font-mono">{Number(tc.reg_hrs).toFixed(2)}</span>
                    <span className="text-right font-mono">{Number(tc.rot_hrs).toFixed(2)}</span>
                    <span className="text-right font-mono font-semibold text-emerald-700">{fmt(tc.grs_pay)}</span>
                    <span className="text-right font-mono text-error">{fmt(tc.tot_ded)}</span>
                    <span className="text-right font-mono font-bold text-on-surface">{fmt(tc.net_pay)}</span>
                    <span className="flex justify-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>{statusLabel}</span>
                    </span>
                    <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(tc)}
                        className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all"
                        title="Edit Timecard"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(tc)}
                        className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-error hover:text-white hover:border-error transition-all"
                        title="Delete Timecard"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Totals footer */}
              <div className="grid grid-cols-[1fr_2.5fr_1fr_1fr_1fr_1.5fr_1.5fr_1.8fr_1fr_120px] px-5 py-4 bg-surface-container-highest border-t-2 border-outline-variant/20 text-sm font-bold">
                <span className="col-span-5 text-on-surface-variant">TOTALS — {filtered.length} of {timecards.length} employees</span>
                <span className="text-right font-mono text-emerald-700">{fmt(totalGross)}</span>
                <span className="text-right font-mono text-error">{fmt(totalDed)}</span>
                <span className="text-right font-mono text-on-surface">{fmt(totalNet)}</span>
                <span className="col-span-2" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal (slide-in panel) ─────────────────────────── */}
      {showEdit && selectedTimecard && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm" onClick={() => { setShowEdit(false); setIsNewEntry(false) }}>
          <div
            className="w-full max-w-4xl bg-white flex flex-col h-full shadow-2xl border-l border-outline-variant/20 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-outline-variant/10 flex items-start justify-between bg-surface-container-lowest sticky top-0 z-10">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-1">
                  {isNewEntry ? 'CREATE' : 'EDIT'} · {payrollType?.toUpperCase()} Payroll
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface">{selectedTimecard.emp_nm}</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {selectedTimecard.emp_no} · Dept: {selectedTimecard.dep_no || '—'} · {MONTHS[selectedTimecard.period_month - 1]} {selectedTimecard.period_year}
                </p>
              </div>
              <button onClick={() => { setShowEdit(false); setIsNewEntry(false) }} className="text-on-surface-variant/60 hover:text-on-surface mt-1 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form body */}
            <div className="flex-grow p-8 space-y-8">
              {/* EARNINGS */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-[14px]">trending_up</span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface">Earnings (A – P)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumInput label="A. Regular Hours" value={selectedTimecard.reg_hrs} onChange={v => up({ reg_hrs: v })} />
                  <NumInput label="B. Absent Hours" value={selectedTimecard.abs_hrs} onChange={v => up({ abs_hrs: v })} />
                  <NumInput label="C. Regular OT Hours" value={selectedTimecard.rot_hrs} onChange={v => up({ rot_hrs: v })} />
                  <NumInput label="D. Special Holiday Hrs" value={selectedTimecard.sphp_hrs} onChange={v => up({ sphp_hrs: v })} />
                  <NumInput label="E. Spl. Holiday OT Hrs" value={selectedTimecard.spot_hrs} onChange={v => up({ spot_hrs: v })} />
                  <NumInput label="F. Legal Holiday Hrs" value={selectedTimecard.lghp_hrs} onChange={v => up({ lghp_hrs: v })} />
                  <NumInput label="G. Legal Holiday OT Hrs" value={selectedTimecard.lgot_hrs} onChange={v => up({ lgot_hrs: v })} />
                  <NumInput label="H. Night Shift Diff. Hrs" value={selectedTimecard.nsd_hrs} onChange={v => up({ nsd_hrs: v })} />
                  <NumInput label="I. VL Days Used" value={selectedTimecard.lv_hrs} onChange={v => up({ lv_hrs: v })} step="0.5" />
                  <NumInput label="J. SL Days Used" value={selectedTimecard.ls_hrs} onChange={v => up({ ls_hrs: v })} step="0.5" />
                  <NumInput label="K. CTPA/SEA (Taxable)" value={selectedTimecard.oth_pay1} onChange={v => up({ oth_pay1: v })} />
                  <NumInput label="L. Taxable Other Pay 2" value={selectedTimecard.oth_pay2} onChange={v => up({ oth_pay2: v })} />
                  <NumInput label="M. Non-Tax Other Pay 1" value={selectedTimecard.oth_pay3} onChange={v => up({ oth_pay3: v })} />
                  <NumInput label="N. Non-Tax Other Pay 2" value={selectedTimecard.oth_pay4} onChange={v => up({ oth_pay4: v })} />
                  <NumInput label="O. VL Days Encash" value={selectedTimecard.lv_cashout} onChange={v => up({ lv_cashout: v })} />
                  <NumInput label="P. SL Days Encash" value={selectedTimecard.ls_cashout} onChange={v => up({ ls_cashout: v })} />
                </div>
              </div>

              {/* DEDUCTIONS */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-md bg-error flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-[14px]">remove_circle</span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface">Deductions (Q – AE)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumInput label="Q. Salary Loan" value={selectedTimecard.sln_ded} onChange={v => up({ sln_ded: v })} />
                  <NumInput label="R. HDMF Loan" value={selectedTimecard.hdmf_ded} onChange={v => up({ hdmf_ded: v })} />
                  <NumInput label="S. SSS Calamity Loan" value={selectedTimecard.cal_ded} onChange={v => up({ cal_ded: v })} />
                  <NumInput label="T. Company Loan" value={selectedTimecard.comp_ded} onChange={v => up({ comp_ded: v })} />
                  <NumInput label="U. Company Deduction" value={selectedTimecard.comd_ded} onChange={v => up({ comd_ded: v })} />
                  <NumInput label="V. Other Deduction 1" value={selectedTimecard.oth_ded1} onChange={v => up({ oth_ded1: v })} />
                  <NumInput label="W. Other Deduction 2" value={selectedTimecard.oth_ded2} onChange={v => up({ oth_ded2: v })} />
                  <NumInput label="X. Other Deduction 3" value={selectedTimecard.oth_ded3} onChange={v => up({ oth_ded3: v })} />
                  <NumInput label="Y. Other Deduction 4" value={selectedTimecard.oth_ded4} onChange={v => up({ oth_ded4: v })} />
                  <NumInput label="Z. Other Deduction 5" value={selectedTimecard.oth_ded5} onChange={v => up({ oth_ded5: v })} />
                  <NumInput label="AA. Other Deduction 6" value={selectedTimecard.oth_ded6} onChange={v => up({ oth_ded6: v })} />
                  <NumInput label="AB. Other Deduction 7" value={selectedTimecard.oth_ded7} onChange={v => up({ oth_ded7: v })} />
                  <NumInput label="AC. Other Deduction 8" value={selectedTimecard.oth_ded8} onChange={v => up({ oth_ded8: v })} />
                  <NumInput label="AD. Other Deduction 9" value={selectedTimecard.oth_ded9} onChange={v => up({ oth_ded9: v })} />
                  <NumInput label="AE. Additional Tax" value={selectedTimecard.tax_add} onChange={v => up({ tax_add: v })} />
                </div>
              </div>

              {/* SPECIAL FLAGS */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-[14px]">flag</span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-on-surface">Special Flags (AF – AG)</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div className="flex items-center gap-3 py-2 col-span-2">
                    <input
                      type="checkbox" id="withbonus" checked={selectedTimecard.withbonus}
                      onChange={e => up({ withbonus: e.target.checked })}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <label htmlFor="withbonus" className="text-sm font-medium cursor-pointer">AF. Include in 13th Month Pay</label>
                  </div>
                  <NumInput label="AG. 13th Month Amount" value={selectedTimecard.bonus} onChange={v => up({ bonus: v })} />
                </div>
              </div>

              {/* COMPUTED SUMMARY */}
              <div className="bg-[#05111E] rounded-2xl p-6 text-white">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-5">Computed Summary (Read-Only)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3">Earnings</div>
                    {[
                      ['Reg Pay', selectedTimecard.reg_pay], ['OT Pay', selectedTimecard.rot_pay],
                      ['SPH Pay', selectedTimecard.sphp_pay], ['LH Pay', selectedTimecard.lghp_pay],
                      ['NSD Pay', selectedTimecard.nsd_pay], ['VL Pay', selectedTimecard.lv_pay],
                      ['SL Pay', selectedTimecard.ls_pay],
                    ].map(([l, v]) => (
                      <div key={String(l)} className="flex justify-between text-xs">
                        <span className="text-white/50">{l}</span>
                        <span className="font-mono">₱{fmt(Number(v))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3">Government</div>
                    {[
                      ['SSS (EE)', selectedTimecard.sss_ee], ['SSS (ER)', selectedTimecard.sss_er],
                      ['Medicare (EE)', selectedTimecard.med_ee], ['Medicare (ER)', selectedTimecard.med_er],
                      ['Pag-IBIG (EE)', selectedTimecard.pgbg_ee], ['Pag-IBIG (ER)', selectedTimecard.pgbg_er],
                      ['EC (ER)', selectedTimecard.ec_er], ['Tax (EE)', selectedTimecard.tax_ee],
                    ].map(([l, v]) => (
                      <div key={String(l)} className="flex justify-between text-xs">
                        <span className="text-white/50">{l}</span>
                        <span className="font-mono">₱{fmt(Number(v))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2 md:col-span-2 flex flex-col justify-end gap-3 border-t border-white/10 pt-4 mt-2 md:mt-0 md:border-t-0 md:pt-0 md:border-l md:pl-6 md:border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Gross Pay</span>
                      <span className="font-mono font-bold text-lg text-emerald-400">₱{fmt(selectedTimecard.grs_pay)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Total Deductions</span>
                      <span className="font-mono font-bold text-lg text-red-400">₱{fmt(selectedTimecard.tot_ded)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/20 pt-3">
                      <span className="text-white font-bold">NET PAY</span>
                      <span className="font-mono font-bold text-2xl text-white">₱{fmt(selectedTimecard.net_pay)}</span>
                    </div>
                    {selectedTimecard.bonus > 0 && (
                      <div className="flex justify-between items-center text-xs text-white/50">
                        <span>13th Month Bonus</span>
                        <span className="font-mono">₱{fmt(selectedTimecard.bonus)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-8 py-5 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => { setShowEdit(false); setIsNewEntry(false) }} className="px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-2">
                {loading ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Saving...</> : <>{isNewEntry ? 'Add Timecard' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee Picker Dialog ─ */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <h2 className="font-headline font-bold text-lg text-on-surface">Select Employee</h2>
              <button onClick={() => setShowAddDialog(false)} className="text-on-surface-variant hover:text-on-surface transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-6 py-3 border-b border-outline-variant/10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50">search</span>
                <input autoFocus className="w-full pl-10 pr-4 py-2 border border-outline-variant/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Search by name or ID..." value={empSearch} onChange={e => setEmpSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingEmps ? (
                <div className="py-10 text-center text-sm text-on-surface-variant/60 animate-pulse">Loading employees…</div>
              ) : (
                employees
                  .filter(e => !empSearch || e.emp_no.toLowerCase().includes(empSearch.toLowerCase()) || e.emp_nm.toLowerCase().includes(empSearch.toLowerCase()))
                  .filter(e => !timecards.some(t => t.emp_no === e.emp_no))
                  .map(emp => (
                    <div key={emp.emp_no} onClick={() => handleSelectEmployee(emp)}
                      className="flex items-center px-6 py-3 border-b border-outline-variant/10 hover:bg-primary/5 cursor-pointer transition-colors group">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
                        {emp.emp_nm.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-on-surface text-sm">{emp.emp_nm}</div>
                        <div className="text-xs text-on-surface-variant/60">{emp.emp_no} · {emp.dep_no}</div>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant/30 group-hover:text-primary transition-colors">chevron_right</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-96 p-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface text-center mb-2">Delete Timecard</h3>
            <p className="text-sm text-on-surface-variant text-center mb-1">
              <strong>{deleteConfirm.emp_nm}</strong> ({deleteConfirm.emp_no})
            </p>
            <p className="text-xs text-on-surface-variant/60 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex-1 px-4 py-2 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 disabled:opacity-60 transition-colors">
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
