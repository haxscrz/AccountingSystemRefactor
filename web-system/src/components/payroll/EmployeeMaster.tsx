import { useState, useEffect } from 'react'
import PageHeader from '../PageHeader'

interface Employee {
  emp_no: string; emp_nm: string; dep_no: string; position: string
  b_rate: number; cola: number; emp_stat: string; status: string
  date_hire: string; date_resign: string
  sss_no: string; tin_no: string; phic_no: string; pgbg_no: string
  sss_member: boolean; pgbg: boolean
  sln_bal: number; sln_amt: number; sln_term: number; sln_date: string
  hdmf_bal: number; hdmf_amt: number; hdmf_term: number; hdmf_date: string
  cal_bal: number; cal_amt: number; cal_term: number; cal_date: string
  comp_bal: number; comp_amt: number; comp_term: number; comp_date: string
  comd_bal: number; comd_amt: number; comd_term: number; comd_date: string
  sick_leave: number; vacation_leave: number
  m_basic: number; m_cola: number; m_hol: number; m_ot: number; m_leave: number; m_gross: number
  m_ssee: number; m_sser: number; m_medee: number; m_meder: number
  m_pgee: number; m_pger: number; m_ecer: number
  m_tax: number; m_othp1: number; m_othp2: number; m_othp3: number; m_othp4: number; m_netpay: number
  q1_gross: number; q1_ssee: number; q1_medee: number; q1_pgee: number; q1_tax: number
  q2_gross: number; q2_ssee: number; q2_medee: number; q2_pgee: number; q2_tax: number
  q3_gross: number; q3_ssee: number; q3_medee: number; q3_pgee: number; q3_tax: number
  y_basic: number; y_cola: number; y_hol: number; y_ot: number; y_leave: number; y_gross: number
  y_ssee: number; y_sser: number; y_medee: number; y_meder: number
  y_pgee: number; y_pger: number; y_ecer: number
  y_tax: number; y_othp1: number; y_othp2: number; y_othp3: number; y_othp4: number
  y_bonus: number; y_btax: number; y_netpay: number
  spouse: string; address: string; birthdate: string
}

const emptyEmployee: Employee = {
  emp_no: '', emp_nm: '', dep_no: '', position: '', b_rate: 0, cola: 0,
  emp_stat: 'R', status: 'A', date_hire: '', date_resign: '',
  sss_no: '', tin_no: '', phic_no: '', pgbg_no: '',
  sss_member: true, pgbg: false,
  sln_bal: 0, sln_amt: 0, sln_term: 0, sln_date: '',
  hdmf_bal: 0, hdmf_amt: 0, hdmf_term: 0, hdmf_date: '',
  cal_bal: 0, cal_amt: 0, cal_term: 0, cal_date: '',
  comp_bal: 0, comp_amt: 0, comp_term: 0, comp_date: '',
  comd_bal: 0, comd_amt: 0, comd_term: 0, comd_date: '',
  sick_leave: 0, vacation_leave: 0,
  m_basic: 0, m_cola: 0, m_hol: 0, m_ot: 0, m_leave: 0, m_gross: 0,
  m_ssee: 0, m_sser: 0, m_medee: 0, m_meder: 0, m_pgee: 0, m_pger: 0, m_ecer: 0,
  m_tax: 0, m_othp1: 0, m_othp2: 0, m_othp3: 0, m_othp4: 0, m_netpay: 0,
  q1_gross: 0, q1_ssee: 0, q1_medee: 0, q1_pgee: 0, q1_tax: 0,
  q2_gross: 0, q2_ssee: 0, q2_medee: 0, q2_pgee: 0, q2_tax: 0,
  q3_gross: 0, q3_ssee: 0, q3_medee: 0, q3_pgee: 0, q3_tax: 0,
  y_basic: 0, y_cola: 0, y_hol: 0, y_ot: 0, y_leave: 0, y_gross: 0,
  y_ssee: 0, y_sser: 0, y_medee: 0, y_meder: 0, y_pgee: 0, y_pger: 0, y_ecer: 0,
  y_tax: 0, y_othp1: 0, y_othp2: 0, y_othp3: 0, y_othp4: 0,
  y_bonus: 0, y_btax: 0, y_netpay: 0,
  spouse: '', address: '', birthdate: ''
}

function fmt(n: number) { return Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-1">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, maxLength, placeholder, disabled, type = 'text' }: {
  value: string; onChange: (v: string) => void; maxLength?: number
  placeholder?: string; disabled?: boolean; type?: string
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      maxLength={maxLength} placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow disabled:opacity-50 disabled:bg-surface-container"
    />
  )
}
function NumInput({ value, onChange, step = '0.01' }: { value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <input type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
    />
  )
}

function LoanBlock({ title, amt, bal, term, date, onChange }: {
  title: string
  amt: number; bal: number; term: number; date: string
  onChange: (f: { amt?: number; bal?: number; term?: number; date?: string }) => void
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-3">{title}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Amount"><NumInput value={amt} onChange={v => onChange({ amt: v })} /></Field>
        <Field label="Balance"><NumInput value={bal} onChange={v => onChange({ bal: v })} /></Field>
        <Field label="Term (mo.)"><NumInput value={term} onChange={v => onChange({ term: v })} step="1" /></Field>
        <Field label="Loan Date"><TextInput type="date" value={date} onChange={v => onChange({ date: v })} /></Field>
      </div>
    </div>
  )
}

const statusLabel = (s: string | undefined) => {
  const v = (s ?? '').toUpperCase()
  if (v === 'A' || v === 'C') return 'Active'
  if (v === 'R') return 'Resigned'
  if (v === 'L') return 'On Leave'
  return v || 'Unknown'
}
const statusClass = (s: string | undefined) => {
  const v = (s ?? '').toUpperCase()
  if (v === 'A' || v === 'C') return 'bg-emerald-100 text-emerald-700'
  if (v === 'R') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}
const matchStatusFilter = (status: string | undefined, filter: string) => {
  const s = (status ?? '').toUpperCase()
  if (filter === '') return true
  if (filter === 'A') return s === 'A' || s === 'C'
  return s === filter
}

const TABS = [
  { id: 1, label: 'Basic Info', icon: 'person' },
  { id: 2, label: "Gov't IDs", icon: 'badge' },
  { id: 3, label: 'Loans', icon: 'account_balance_wallet' },
  { id: 4, label: 'Counters', icon: 'bar_chart' },
  { id: 5, label: 'Personal', icon: 'home' },
]

export default function EmployeeMaster() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [panelMsg, setPanelMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('A')

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    try {
      const r = await fetch('/api/payroll/employees/all')
      if (r.ok) setEmployees(await r.json())
    } catch { /* ignore */ }
  }

  const up = (field: Partial<Employee>) => setEditingEmp(prev => prev ? { ...prev, ...field } : prev)

  const handleAdd = () => { setEditingEmp({ ...emptyEmployee }); setActiveTab(1); setPanelMsg(null); setShowPanel(true) }
  const handleEdit = (emp: Employee) => { setEditingEmp({ ...emp }); setActiveTab(1); setPanelMsg(null); setShowPanel(true) }

  const handleSave = async () => {
    if (!editingEmp) return
    setLoading(true); setPanelMsg(null)
    try {
      const isNew = !employees.find(e => e.emp_no === editingEmp.emp_no)
      const url = isNew ? '/api/payroll/employees' : `/api/payroll/employees/${editingEmp.emp_no}`
      const r = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingEmp) })
      if (r.ok) {
        await fetchEmployees(); setShowPanel(false); setEditingEmp(null)
        setMsg({ text: isNew ? 'Employee created successfully.' : 'Employee updated successfully.', ok: true })
      } else {
        const err = await r.json()
        setPanelMsg({ text: err.message || 'Save failed.', ok: false })
      }
    } catch { setPanelMsg({ text: 'Failed to save. Check server connection.', ok: false }) }
    finally { setLoading(false) }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return
    const empNo = deleteTarget; setDeleteTarget(null)
    try {
      const r = await fetch(`/api/payroll/employees/${empNo}`, { method: 'DELETE' })
      if (r.ok) { await fetchEmployees(); setMsg({ text: `Employee ${empNo} deleted.`, ok: true }) }
      else { const err = await r.json(); setMsg({ text: err.message || 'Delete failed.', ok: false }) }
    } catch { setMsg({ text: 'Failed to delete employee.', ok: false }) }
  }

  const filtered = employees.filter(e => {
    const q = search.trim().toLowerCase()
    return matchStatusFilter(e.status, statusFilter) &&
      (!q || e.emp_no.toLowerCase().includes(q) || e.emp_nm.toLowerCase().includes(q) || (e.dep_no || '').toLowerCase().includes(q))
  })

  const totalActive = employees.filter(e => matchStatusFilter(e.status, 'A')).length
  const totalResigned = employees.filter(e => (e.status ?? '').toUpperCase() === 'R').length
  const totalOnLeave = employees.filter(e => (e.status ?? '').toUpperCase() === 'L').length

  return (
    <div className="flex flex-col gap-0 h-full -mx-10 -my-10">
      <div className="px-10 pt-10 pb-5">
        <PageHeader
          breadcrumb="EMPLOYEE RECORDS / MASTER FILE"
          title="Employee Master"
          subtitle="Comprehensive employee records with 5-screen data entry (MASTEDIT)"
          actions={
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-[16px]">person_add</span> Add Employee
            </button>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-2">
          {[
            { label: 'Total Employees', val: employees.length, icon: 'group', color: 'text-primary' },
            { label: 'Active', val: totalActive, icon: 'check_circle', color: 'text-emerald-600' },
            { label: 'Resigned', val: totalResigned, icon: 'logout', color: 'text-red-500' },
            { label: 'On Leave', val: totalOnLeave, icon: 'event_busy', color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-outline-variant/15 px-5 py-4 flex items-center gap-3 shadow-sm">
              <span className={`material-symbols-outlined text-[22px] ${s.color} opacity-70`}>{s.icon}</span>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">{s.label}</div>
                <div className={`font-mono font-bold text-xl ${s.color}`}>{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toast message */}
        {msg && (
          <div className={`mt-3 px-4 py-3 rounded-lg border-l-4 text-sm font-medium flex items-center justify-between ${msg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-red-50 text-red-800 border-red-500'}`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-inherit opacity-60 hover:opacity-100 ml-4">✕</button>
          </div>
        )}
      </div>

      {/* Search + filter */}
      <div className="px-10 pb-3 flex gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50">search</span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            placeholder="Search by employee number, name, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
        >
          <option value="">All</option>
          <option value="A">Active Only</option>
          <option value="R">Resigned</option>
          <option value="L">On Leave</option>
        </select>
        <span className="flex items-center text-xs text-on-surface-variant/60 font-medium whitespace-nowrap">
          {filtered.length} of {employees.length} employees
        </span>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-auto px-10 pb-10">
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_2.5fr_1fr_1.5fr_1.5fr_1fr_1fr_110px] px-5 py-3 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            <span>Emp No.</span><span>Name</span><span>Dept</span><span>Position</span>
            <span className="text-right">Basic Rate</span><span className="text-right">COLA</span>
            <span className="text-center">Status</span><span className="text-right">Actions</span>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant/50">
              <span className="material-symbols-outlined text-4xl mb-3">people_outline</span>
              <p className="text-sm">No employees match your search.</p>
            </div>
          ) : filtered.map((emp, i) => (
            <div
              key={emp.emp_no}
              onClick={() => handleEdit(emp)}
              className={`grid grid-cols-[1fr_2.5fr_1fr_1.5fr_1.5fr_1fr_1fr_110px] px-5 py-3.5 border-t border-outline-variant/10 text-sm hover:bg-primary/5 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/30'}`}
            >
              <span className="font-mono font-bold text-primary">{emp.emp_no}</span>
              <span className="font-medium text-on-surface truncate">{emp.emp_nm}</span>
              <span className="text-on-surface-variant">{emp.dep_no}</span>
              <span className="text-on-surface-variant text-xs truncate">{emp.position}</span>
              <span className="text-right font-mono font-semibold text-emerald-700">₱{fmt(emp.b_rate)}</span>
              <span className="text-right font-mono text-on-surface-variant">₱{fmt(emp.cola)}</span>
              <span className="flex justify-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass(emp.status)}`}>{statusLabel(emp.status)}</span>
              </span>
              <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleEdit(emp)} title="Edit" className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
                <button onClick={() => setDeleteTarget(emp.emp_no)} title="Delete" className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-error hover:text-white hover:border-error transition-all">
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Slide-in edit panel ── */}
      {showPanel && editingEmp && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowPanel(false)}>
          <div className="w-full max-w-4xl bg-white flex flex-col h-full shadow-2xl border-l border-outline-variant/20 overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Panel header */}
            <div className="px-8 py-6 border-b border-outline-variant/10 flex items-start justify-between bg-surface-container-lowest sticky top-0 z-10">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 mb-1">
                  {editingEmp.emp_no && employees.find(e => e.emp_no === editingEmp.emp_no) ? 'EDIT EMPLOYEE' : 'NEW EMPLOYEE'}
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface">{editingEmp.emp_nm || 'New Employee'}</h2>
                {editingEmp.emp_no && <p className="text-sm text-on-surface-variant mt-0.5">{editingEmp.emp_no} · {editingEmp.dep_no || 'No Dept'} · {editingEmp.position || 'No Position'}</p>}
              </div>
              <button onClick={() => setShowPanel(false)} className="text-on-surface-variant/60 hover:text-on-surface mt-1 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-outline-variant/10 px-8 bg-surface-container-lowest sticky top-[89px] z-10">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[15px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-grow p-8 space-y-6">

              {/* TAB 1: Basic Info */}
              {activeTab === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Employee Number *">
                      <TextInput value={editingEmp.emp_no} onChange={v => up({ emp_no: v })} maxLength={20}
                        disabled={!!employees.find(e => e.emp_no === editingEmp.emp_no)} />
                    </Field>
                    <div className="col-span-2">
                      <Field label="Full Name *">
                        <TextInput value={editingEmp.emp_nm} onChange={v => up({ emp_nm: v })} maxLength={160} />
                      </Field>
                    </div>
                    <Field label="Department No.">
                      <TextInput value={editingEmp.dep_no} onChange={v => up({ dep_no: v })} maxLength={30} />
                    </Field>
                    <div className="col-span-2">
                      <Field label="Position / Job Title">
                        <TextInput value={editingEmp.position} onChange={v => up({ position: v })} maxLength={100} />
                      </Field>
                    </div>
                    <Field label="Basic Rate *">
                      <NumInput value={editingEmp.b_rate} onChange={v => up({ b_rate: v })} />
                    </Field>
                    <Field label="COLA per Hour">
                      <NumInput value={editingEmp.cola} onChange={v => up({ cola: v })} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field label="Employee Type">
                      <select value={editingEmp.emp_stat} onChange={e => up({ emp_stat: e.target.value })}
                        className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="R">R — Regular</option>
                        <option value="C">C — Casual</option>
                        <option value="F">F — Confidential</option>
                        <option value="E">E — Executive</option>
                      </select>
                    </Field>
                    <Field label="Employment Status">
                      <select value={editingEmp.status} onChange={e => up({ status: e.target.value })}
                        className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="A">A — Active</option>
                        <option value="R">R — Resigned</option>
                        <option value="L">L — On Leave</option>
                      </select>
                    </Field>
                    <Field label="Date Hired">
                      <TextInput type="date" value={editingEmp.date_hire} onChange={v => up({ date_hire: v })} />
                    </Field>
                    <Field label="Date Resigned">
                      <TextInput type="date" value={editingEmp.date_resign} onChange={v => up({ date_resign: v })} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50">Leave Credits</div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Vacation Leave Days">
                          <NumInput value={editingEmp.vacation_leave} onChange={v => up({ vacation_leave: v })} step="0.5" />
                        </Field>
                        <Field label="Sick Leave Days">
                          <NumInput value={editingEmp.sick_leave} onChange={v => up({ sick_leave: v })} step="0.5" />
                        </Field>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50">Membership Flags</div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" id="sss_member" checked={editingEmp.sss_member} onChange={e => up({ sss_member: e.target.checked })} className="w-4 h-4 rounded accent-primary" />
                          <span className="text-sm font-medium">SSS Member</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" id="pgbg_member" checked={editingEmp.pgbg} onChange={e => up({ pgbg: e.target.checked })} className="w-4 h-4 rounded accent-primary" />
                          <span className="text-sm font-medium">PAG-IBIG Member</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Government IDs */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="SSS Number (99-9999999-9)">
                      <TextInput value={editingEmp.sss_no} onChange={v => up({ sss_no: v })} maxLength={30} placeholder="12-3456789-0" />
                    </Field>
                    <Field label="TIN (999-999-999)">
                      <TextInput value={editingEmp.tin_no} onChange={v => up({ tin_no: v })} maxLength={30} placeholder="123-456-789" />
                    </Field>
                    <Field label="PhilHealth (PHIC) Number">
                      <TextInput value={editingEmp.phic_no} onChange={v => up({ phic_no: v })} maxLength={30} />
                    </Field>
                    <Field label="Pag-IBIG (HDMF) Number">
                      <TextInput value={editingEmp.pgbg_no} onChange={v => up({ pgbg_no: v })} maxLength={30} />
                    </Field>
                  </div>
                </div>
              )}

              {/* TAB 3: Loans */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <LoanBlock title="1. Salary Loan" amt={editingEmp.sln_amt} bal={editingEmp.sln_bal} term={editingEmp.sln_term} date={editingEmp.sln_date}
                    onChange={f => up({ sln_amt: f.amt ?? editingEmp.sln_amt, sln_bal: f.bal ?? editingEmp.sln_bal, sln_term: f.term ?? editingEmp.sln_term, sln_date: f.date ?? editingEmp.sln_date })} />
                  <LoanBlock title="2. SSS Calamity Loan" amt={editingEmp.cal_amt} bal={editingEmp.cal_bal} term={editingEmp.cal_term} date={editingEmp.cal_date}
                    onChange={f => up({ cal_amt: f.amt ?? editingEmp.cal_amt, cal_bal: f.bal ?? editingEmp.cal_bal, cal_term: f.term ?? editingEmp.cal_term, cal_date: f.date ?? editingEmp.cal_date })} />
                  <LoanBlock title="3. HDMF / Pag-IBIG Loan" amt={editingEmp.hdmf_amt} bal={editingEmp.hdmf_bal} term={editingEmp.hdmf_term} date={editingEmp.hdmf_date}
                    onChange={f => up({ hdmf_amt: f.amt ?? editingEmp.hdmf_amt, hdmf_bal: f.bal ?? editingEmp.hdmf_bal, hdmf_term: f.term ?? editingEmp.hdmf_term, hdmf_date: f.date ?? editingEmp.hdmf_date })} />
                  <LoanBlock title="4. Company Loan" amt={editingEmp.comp_amt} bal={editingEmp.comp_bal} term={editingEmp.comp_term} date={editingEmp.comp_date}
                    onChange={f => up({ comp_amt: f.amt ?? editingEmp.comp_amt, comp_bal: f.bal ?? editingEmp.comp_bal, comp_term: f.term ?? editingEmp.comp_term, comp_date: f.date ?? editingEmp.comp_date })} />
                  <LoanBlock title="5. Company Deduction / Advances" amt={editingEmp.comd_amt} bal={editingEmp.comd_bal} term={editingEmp.comd_term} date={editingEmp.comd_date}
                    onChange={f => up({ comd_amt: f.amt ?? editingEmp.comd_amt, comd_bal: f.bal ?? editingEmp.comd_bal, comd_term: f.term ?? editingEmp.comd_term, comd_date: f.date ?? editingEmp.comd_date })} />
                </div>
              )}

              {/* TAB 4: Counters (Read-only) */}
              {activeTab === 4 && (
                <div className="space-y-6">
                  <div className="bg-[#05111E] rounded-2xl p-6 text-white">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-5">Monthly Counters (Auto-updated on Post)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {[
                        ['Basic Pay', editingEmp.m_basic], ['COLA', editingEmp.m_cola], ['Holiday', editingEmp.m_hol], ['Overtime', editingEmp.m_ot],
                        ['Leave', editingEmp.m_leave], ['Gross Pay', editingEmp.m_gross], ['SSS EE', editingEmp.m_ssee], ['SSS ER', editingEmp.m_sser],
                        ['Medicare EE', editingEmp.m_medee], ['Medicare ER', editingEmp.m_meder], ['Pag-IBIG EE', editingEmp.m_pgee], ['Pag-IBIG ER', editingEmp.m_pger],
                        ['EC ER', editingEmp.m_ecer], ['Tax', editingEmp.m_tax], ['Net Pay', editingEmp.m_netpay],
                      ].map(([l, v]) => (
                        <div key={String(l)} className="flex justify-between">
                          <span className="text-white/50">{l}</span>
                          <span className="font-mono">₱{fmt(Number(v))}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/15 rounded-2xl overflow-hidden">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 px-5 py-3 border-b border-outline-variant/10">Quarterly Counters</div>
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-high text-[10px] uppercase text-on-surface-variant/60 font-bold">
                        <tr>
                          <th className="px-5 py-2.5 text-left">Counter</th>
                          <th className="px-5 py-2.5 text-right">Q1</th>
                          <th className="px-5 py-2.5 text-right">Q2</th>
                          <th className="px-5 py-2.5 text-right">Q3</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {[
                          ['Gross Income', editingEmp.q1_gross, editingEmp.q2_gross, editingEmp.q3_gross],
                          ['SSS (EE)', editingEmp.q1_ssee, editingEmp.q2_ssee, editingEmp.q3_ssee],
                          ['Medicare (EE)', editingEmp.q1_medee, editingEmp.q2_medee, editingEmp.q3_medee],
                          ['Pag-IBIG (EE)', editingEmp.q1_pgee, editingEmp.q2_pgee, editingEmp.q3_pgee],
                          ['Tax Withheld', editingEmp.q1_tax, editingEmp.q2_tax, editingEmp.q3_tax],
                        ].map(([l, q1, q2, q3]) => (
                          <tr key={String(l)}>
                            <td className="px-5 py-2.5 font-medium text-on-surface">{l}</td>
                            <td className="px-5 py-2.5 font-mono text-right text-on-surface-variant">{fmt(Number(q1))}</td>
                            <td className="px-5 py-2.5 font-mono text-right text-on-surface-variant">{fmt(Number(q2))}</td>
                            <td className="px-5 py-2.5 font-mono text-right text-on-surface-variant">{fmt(Number(q3))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white border border-outline-variant/15 rounded-2xl overflow-hidden">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 px-5 py-3 border-b border-outline-variant/10">Yearly Counters (YTD)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-outline-variant/10">
                      {[
                        ['Basic Pay', editingEmp.y_basic], ['COLA', editingEmp.y_cola], ['Holiday', editingEmp.y_hol], ['Overtime', editingEmp.y_ot],
                        ['Leave', editingEmp.y_leave], ['Gross Pay', editingEmp.y_gross], ['SSS EE', editingEmp.y_ssee], ['SSS ER', editingEmp.y_sser],
                        ['Medicare EE', editingEmp.y_medee], ['Medicare ER', editingEmp.y_meder], ['Pag-IBIG EE', editingEmp.y_pgee], ['Pag-IBIG ER', editingEmp.y_pger],
                        ['EC ER', editingEmp.y_ecer], ['Tax', editingEmp.y_tax], ['13th Month', editingEmp.y_bonus], ['Net Pay', editingEmp.y_netpay],
                      ].map(([l, v]) => (
                        <div key={String(l)} className="px-4 py-3">
                          <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest">{l}</div>
                          <div className="font-mono font-semibold text-sm mt-0.5">₱{fmt(Number(v))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Personal */}
              {activeTab === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Spouse Name">
                      <TextInput value={editingEmp.spouse} onChange={v => up({ spouse: v })} maxLength={160} />
                    </Field>
                    <Field label="Date of Birth">
                      <TextInput type="date" value={editingEmp.birthdate} onChange={v => up({ birthdate: v })} />
                    </Field>
                  </div>
                  <Field label="Address">
                    <TextInput value={editingEmp.address} onChange={v => up({ address: v })} maxLength={300} />
                  </Field>
                </div>
              )}

              {/* Panel error */}
              {panelMsg && (
                <div className={`px-4 py-3 rounded-lg border-l-4 text-sm font-medium flex items-center gap-2 ${panelMsg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-red-50 text-red-800 border-red-500'}`}>
                  {panelMsg.text}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="px-8 py-5 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-between items-center sticky bottom-0">
              <div className="flex gap-2">
                {activeTab > 1 && <button onClick={() => setActiveTab(activeTab - 1)} className="px-3 py-2 border border-outline-variant/20 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">chevron_left</span> Back
                </button>}
                {activeTab < 5 && <button onClick={() => setActiveTab(activeTab + 1)} className="px-3 py-2 border border-outline-variant/20 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                  Next <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </button>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPanel(false)} className="px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-2">
                  {loading ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span>Saving…</> : 'Save Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-96 p-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface text-center mb-1">Delete Employee</h3>
            <p className="text-sm text-on-surface-variant text-center mb-1"><strong>{deleteTarget}</strong></p>
            <p className="text-xs text-on-surface-variant/60 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleDeleteConfirmed} className="flex-1 px-4 py-2 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
