import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import React from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

//  Types 

interface TcRow {
  empNo: string; empNm: string; depNo: string; depNm: string; trnFlag: string
  regHrs: number; absHrs: number; rotHrs: number; sphpHrs: number; spotHrs: number
  lghpHrs: number; lgotHrs: number; nsdHrs: number; lvHrs: number; lsHrs: number
  regPay: number; rotPay: number; sphpPay: number; spotPay: number
  lghpPay: number; lgotPay: number; nsdPay: number
  lvPay: number; lv2Pay: number; lsPay: number
  othPay1: number; othPay2: number; othPay3: number; othPay4: number
  bonus: number; grsPay: number
  taxEe: number; sssEe: number; sssEr: number; medEe: number; medEr: number
  pgbgEe: number; pgbgEr: number; ecEr: number
  slnDed: number; calDed: number; hdmfDed: number; compDed: number; comdDed: number
  othDed1: number; othDed2: number; othDed3: number; othDed4: number; othDed5: number
  othDed6: number; othDed7: number; othDed8: number; othDed9: number; othDed10: number
  totDed: number; netPay: number; bonustax: number
  bRate: number; sssNo: string; tinNo: string; phicNo: string; pgbgNo: string
  yGross: number; yTax: number
  slnBal: number; calBal: number; hdmfBal: number; compBal: number; comdBal: number
}

interface MasterRow {
  empNo: string; empNm: string; depNo: string; depNm: string
  position: string; bRate: number
  sssNo: string; tinNo: string; phicNo: string; pgbgNo: string
  dateHire: string; dateResign: string; empStat: string; status: string
  yGross: number; yTax: number
  ySsee: number; ySser: number; yMedee: number; yMeder: number
  yPgee: number; yPger: number; yEcer: number; yBonus: number
  mBasic: number; mHol: number; mOt: number; mGross: number; mTax: number
  mSsee: number; mSser: number; mMedee: number; mMeder: number
  mPgee: number; mPger: number; mEcer: number; mLeave: number; mNetpay: number
  mOthp1: number; mOthp2: number; mOthp3: number; mOthp4: number
  slnBal: number; calBal: number; hdmfBal: number; compBal: number; comdBal: number
}

interface DeptRow {
  depNo: string; depNm: string
  regPay: number; otPay: number; holPay: number; grsPay: number
  tax: number; sssEe: number; sssEr: number; medEe: number; medEr: number
  pgbgEe: number; pgbgEr: number; ecEr: number; netPay: number; empCtr: number
}

interface SysInfo {
  company: string; begDate: string; endDate: string
  presMo: number; presYr: number; payType: number; monthName: string
  trnCtr: number; trnPrc: number; trnUpd: number
}

interface ReportData {
  sysInfo: SysInfo
  timecards: TcRow[]
  masters: MasterRow[]
  departments: DeptRow[]
}

//  Formatting helpers 
const fmt = (v: number, dec = 2): string => {
  if (!v && v !== 0) return ''
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
const fmtZ = (v: number, dec = 2): string => { if (!v) return ''; return fmt(v, dec) }

//  Sub-option definitions 
const SUB_OPTIONS: Record<string, { label: string; key: string }[]> = {
  payslip: [
    { label: 'All Pay Slips w/ Summary', key: 'all' },
    { label: 'Selected Pay Slips',       key: 'selected' },
    { label: 'Pay Slip Summary Only',    key: 'summary' },
    { label: 'ATM Payroll Summary',      key: 'atm' },
  ],
  monthly: [
    { label: 'Monthly Payroll Recap',           key: 'recap' },
    { label: 'Monthly SSS/PHIC/EC/PGBG/Tax',   key: 'all' },
    { label: 'Monthly SSS/PHIC/EC/PGBG',       key: 'pbg' },
    { label: 'Monthly SSS, PHIC & EC',         key: 'sss-phic-ec' },
    { label: 'Monthly SSS & EC',               key: 'sss-ec' },
    { label: 'Monthly Philhealth',             key: 'phic' },
    { label: 'Monthly Pag-Ibig',              key: 'pagibig' },
    { label: 'Monthly Tax Withheld',           key: 'tax' },
    { label: 'Monthly Dept. Summary',          key: 'dept' },
    { label: 'Monthly Loan Deduction Summary', key: 'loan' },
    { label: 'SSS-LMS Diskette Project',       key: 'sss-lms' },
    { label: 'SSS R-3 Tape Diskette Project',  key: 'sss-r3' },
    { label: 'HDMF Loan Diskette Project',     key: 'hdmf' },
    { label: 'Philhealth Regular RF-1',        key: 'rf1' },
  ],
  quarterly: [
    { label: 'Quarterly SSS, Philhealth & EC',   key: 'sss-phic-ec' },
    { label: 'Quarterly Pag-Ibig Premium',       key: 'pbg' },
    { label: 'Quarterly Withholding Tax',        key: 'tax' },
    { label: 'Quarterly SSS Loan Payments',      key: 'sss-loan' },
    { label: 'Quarterly Pag-Ibig Loan Payments', key: 'pbg-loan' },
    { label: 'PHIC Remittance (Hard Copy)',       key: 'phic-hard' },
    { label: 'PHIC Remittance (Diskette)',        key: 'phic-disk' },
  ],
  'employee-master': [
    { label: 'Employee Master List',   key: 'list' },
    { label: 'Personal Information',   key: 'personal' },
    { label: 'Employee Salary Rate',   key: 'salary' },
    { label: 'Employee Loan Balance',  key: 'loan' },
    { label: 'Employee VL/SL Balance', key: 'vlsl' },
  ],
  bonus: [
    { label: 'Advance Bonus P.Slip/Sheet',   key: 'advance' },
    { label: 'Bonus Pay Sheet',              key: 'sheet' },
    { label: 'Bonus ATM Summary',            key: 'atm' },
    { label: 'All Bonus Slips w/ Summary',   key: 'all' },
    { label: 'Selected Bonus Slips',         key: 'selected' },
    { label: 'Bonus Slip Summary Only',      key: 'summary' },
    { label: 'Denomination Breakdown',       key: 'den' },
  ],
  'year-end-tax': [
    { label: "Tax Recon - Emp.'s Taxable Income",     key: 'recon-taxable' },
    { label: "Tax Recon - Emp.'s Non-Taxable Income", key: 'recon-nontaxable' },
    { label: 'Tax Refund Report',                     key: 'refund' },
    { label: 'Tax Refund Denomination Breakdown',     key: 'refund-den' },
    { label: 'Tax Refund Slip',                       key: 'refund-slip' },
    { label: 'BIR Tax Withheld Report',               key: 'bir-withheld' },
    { label: 'Individual BIR W2 Form',                key: 'w2' },
    { label: 'Alpha List',                            key: 'alpha' },
    { label: 'Form 1604CF - Schedule 7.3',            key: '1604cf-73' },
    { label: 'Form 1604CF - Schedule 7.1',            key: '1604cf-71' },
  ],
  'premium-cert': [
    { label: 'SSS Premium Payment Certification',      key: 'sss' },
    { label: 'Medicare Premium Payment Certification', key: 'med' },
    { label: 'Pag-Ibig Premium Payment Certification', key: 'pbg' },
    { label: 'All Premiums Payment Certification',     key: 'all' },
  ],
}

const REPORT_TITLES: Record<string, string> = {
  'timecard-validation': 'Timecard Validation',
  register:              'Payroll Register',
  payslip:               'Payroll Slip',
  denomination:          'Denomination Breakdown',
  deductions:            'Deductions Report',
  monthly:               'Monthly Reports',
  quarterly:             'Quarterly Reports',
  'quarterly-sss-form':  'Quarterly SSS Loan (SSS Form)',
  'yearly-recap':        'Year-End Payroll Recap',
  'employee-master':     'Employee Master File',
  bonus:                 'Bonus',
  'year-end-tax':        'Year-End Tax/Refund',
  'premium-cert':        'Premium Payment Certification',
}

//  Table style constants 
const CELL: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 8, padding: '0 3px',
  whiteSpace: 'nowrap', borderBottom: '1px solid #e0e0e0',
  lineHeight: '14px', textAlign: 'right',
}
const CELL_L: React.CSSProperties = { ...CELL, textAlign: 'left' }
const TH: React.CSSProperties = { ...CELL, fontWeight: 700, borderBottom: '2px solid #999', background: '#f5f5f5', fontSize: 7, lineHeight: '13px', textAlign: 'right' }
const TH_L: React.CSSProperties = { ...TH, textAlign: 'left' }
const TOTAL_ROW: React.CSSProperties = { ...CELL, fontWeight: 700, borderTop: '1px solid #888', borderBottom: '2px solid #888', background: '#fffde7' }
const GRAND_ROW: React.CSSProperties = { ...CELL, fontWeight: 700, borderTop: '2px solid #333', borderBottom: '2px solid #333', background: '#fff9c4' }
const DEPT_ROW: React.CSSProperties = { ...CELL_L, fontWeight: 700, background: '#f0f0f0', fontSize: 8, paddingTop: 4, paddingBottom: 1 }

//  SubOptionSelector 
function SubOptionSelector({ parentTitle, options, onSelect }: {
  parentTitle: string
  options: { label: string; key: string }[]
  onSelect: (key: string, label: string) => void
}) {
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
          Report Generation
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>{parentTitle}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map((opt, i) => (
          <button key={opt.key} onClick={() => onSelect(opt.key, opt.label)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all var(--t-base)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 18 }}>{i + 1}.</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{opt.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>&gt;</span>
          </button>
        ))}
      </div>
    </div>
  )
}

//  Report Header 
function ReportHeader({ si, title }: { si: SysInfo; title: string }) {
  return (
    <div style={{ marginBottom: 6, fontFamily: 'monospace', fontSize: 9 }}>
      <div style={{ fontWeight: 700, fontSize: 10 }}>{si.company || 'COMPANY NAME'}</div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div>Payroll Period: {si.begDate} - {si.endDate}</div>
    </div>
  )
}

//  Group timecards by dept 
function groupByDept(rows: TcRow[]) {
  const map = new Map<string, { depNo: string; depNm: string; rows: TcRow[] }>()
  for (const r of rows) {
    const key = r.depNo || '00'
    if (!map.has(key)) map.set(key, { depNo: r.depNo, depNm: r.depNm, rows: [] })
    map.get(key)!.rows.push(r)
  }
  return [...map.values()].sort((a, b) => a.depNo.localeCompare(b.depNo))
}

//  Payroll Register with Hours (RPREGIST Format 2) 
function RegisterWithHours({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const groups = groupByDept(timecards.filter(t => t.trnFlag === 'P' || t.trnFlag === 'X'))

  type ColDef = { label: string; key: string; w: number; align?: 'left' }
  const COLS: ColDef[] = [
    { label: 'EMP#',      key: 'empNo',    w: 48, align: 'left' },
    { label: 'NAME',      key: 'empNm',    w: 140, align: 'left' },
    { label: 'REG.HR',   key: 'regHrs',   w: 44 },
    { label: 'OT.HR',    key: 'rotHrs',   w: 44 },
    { label: 'NSD.HR',   key: 'nsdHrs',   w: 44 },
    { label: 'SPH.HR',   key: 'sphpHrs',  w: 44 },
    { label: 'LGH.HR',   key: 'lghpHrs',  w: 44 },
    { label: 'LGH.OT',   key: 'lgotHrs',  w: 44 },
    { label: 'LV.DYS',   key: 'lvHrs',    w: 44 },
    { label: 'REG.PAY',  key: 'regPay',   w: 64 },
    { label: 'OT.PAY',   key: 'rotPay',   w: 64 },
    { label: 'NSD-PAY',  key: 'nsdPay',   w: 64 },
    { label: 'SPH.PAY',  key: 'sphpPay',  w: 64 },
    { label: 'LGH.PAY',  key: 'lghpPay',  w: 60 },
    { label: 'LV.PAY',   key: 'lvPay',    w: 60 },
    { label: 'CTPA/SEA', key: 'othPay1',  w: 60 },
    { label: 'TxblPay2', key: 'othPay3',  w: 60 },
    { label: 'NtaxPay1', key: 'othPay2',  w: 60 },
    { label: 'NtaxPay2', key: 'othPay4',  w: 60 },
    { label: '13thMo',   key: 'bonus',    w: 60 },
    { label: 'GROSS-PAY',key: 'grsPay',   w: 72 },
    { label: 'TAX-DED',  key: 'taxEe',    w: 60 },
    { label: 'SSS-DED',  key: 'sssEe',    w: 60 },
    { label: 'MED-DED',  key: 'medEe',    w: 60 },
    { label: 'PBG-DED',  key: 'pgbgEe',   w: 60 },
    { label: 'LOAN-DED', key: '_loanDed', w: 64 },
    { label: 'OTHR-DED', key: '_othrDed', w: 64 },
    { label: 'TOTAL-DED',key: 'totDed',   w: 64 },
    { label: 'NET PAY',  key: 'netPay',   w: 72 },
  ]

  const getV = (r: TcRow, key: string): number => {
    if (key === '_loanDed') return r.slnDed + r.calDed + r.hdmfDed + r.compDed + r.comdDed
    if (key === '_othrDed') return r.othDed1+r.othDed2+r.othDed3+r.othDed4+r.othDed5+r.othDed6+r.othDed7+r.othDed8+r.othDed9+r.othDed10
    return (r as unknown as Record<string,number>)[key] ?? 0
  }
  const getGA = (key: string) => timecards.reduce((s, r) => s + getV(r, key), 0)

  const SPLIT = 20  // after GROSS-PAY
  const cols1 = COLS.slice(0, SPLIT + 1)
  const cols2 = COLS.slice(SPLIT + 1)

  const renderBlock = (cols: ColDef[], rows: TcRow[], depLabel: string) => {
    const dt = Object.fromEntries(cols.map(c => [c.key, rows.reduce((s, r) => s + (c.align ? 0 : getV(r, c.key)), 0)]))
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{cols.map(c => <th key={c.key} style={{ ...TH, textAlign: c.align ?? 'right', width: c.w }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.empNo}>{cols.map(c => {
              const isL = !!c.align
              const isHrs = c.key.includes('Hrs') || c.key.includes('hrs')
              const txt = isL ? (c.key === 'empNm' ? r.empNm.substring(0,22) : r.empNo) : (isHrs ? fmtZ(getV(r,c.key),2) : fmtZ(getV(r,c.key)))
              return <td key={c.key} style={isL ? CELL_L : CELL}>{txt}</td>
            })}</tr>
          ))}
          <tr>{cols.map(c => c.key === 'empNo' ? <td key={c.key} style={TOTAL_ROW}></td> : c.key === 'empNm' ? <td key={c.key} style={{ ...TOTAL_ROW, textAlign:'left' }}>{depLabel}</td> : <td key={c.key} style={TOTAL_ROW}>{c.align ? '' : fmtZ(dt[c.key] as number, 2)}</td>)}</tr>
        </tbody>
      </table>
    )
  }

  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="P A Y R O L L   R E G I S T E R   (With Hours)" />
      {groups.map(g => (
        <div key={g.depNo} style={{ marginBottom:6 }}>
          <div style={DEPT_ROW}>Dept: {g.depNo} - {g.depNm}</div>
          {renderBlock(cols1, g.rows, 'DEPARTMENT TOTAL')}
          <div style={{ marginTop:2 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{cols2.map(c => <th key={c.key} style={{ ...TH, width:c.w }}>{c.label}</th>)}</tr></thead>
              <tbody>
                {g.rows.map(r => <tr key={r.empNo}>{cols2.map(c => <td key={c.key} style={CELL}>{fmtZ(getV(r,c.key))}</td>)}</tr>)}
                <tr>{cols2.map(c => <td key={c.key} style={TOTAL_ROW}>{fmtZ(g.rows.reduce((s,r) => s+getV(r,c.key),0))}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div style={{ marginTop:10 }}>
        <div style={{ fontWeight:700, fontSize:8, marginBottom:2 }}>GRAND TOTAL</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{cols1.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
          <tbody><tr>{cols1.map(c => c.key==='empNo' ? <td key={c.key} style={GRAND_ROW}></td> : c.key==='empNm' ? <td key={c.key} style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td> : <td key={c.key} style={GRAND_ROW}>{c.align ? '' : fmtZ(getGA(c.key),2)}</td>)}</tr></tbody>
        </table>
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:2 }}>
          <thead><tr>{cols2.map(c => <th key={c.key} style={{ ...TH, width:c.w }}>{c.label}</th>)}</tr></thead>
          <tbody><tr>{cols2.map(c => <td key={c.key} style={GRAND_ROW}>{fmtZ(getGA(c.key))}</td>)}</tr></tbody>
        </table>
      </div>
    </div>
  )
}

//  Payroll Register Summarized (Format 2 no-hours) 
function RegisterSummarized({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const groups = groupByDept(timecards.filter(t => t.trnFlag==='P' || t.trnFlag==='X'))
  type ColDef = { label:string; key:string; w:number; align?:'left' }
  const COLS: ColDef[] = [
    { label:'EMP#',      key:'empNo',       w:48,  align:'left' },
    { label:'EMPLOYEE NAME', key:'empNm',   w:140, align:'left' },
    { label:'REG-PAY',   key:'regPay',      w:72 },
    { label:'NSD-PAY',   key:'nsdPay',      w:64 },
    { label:'SPH-PAY',   key:'_sphpSpot',   w:64 },
    { label:'LGH-PAY',   key:'_lghLgot',    w:64 },
    { label:'OT-PAY',    key:'rotPay',      w:64 },
    { label:'SL/VL-PAY', key:'_lvls',       w:64 },
    { label:'CTPA/SEA',  key:'othPay1',     w:60 },
    { label:'TxblePay2', key:'othPay3',     w:60 },
    { label:'NtaxPay1',  key:'othPay2',     w:60 },
    { label:'NtaxPay2',  key:'othPay4',     w:60 },
    { label:'BONUS',     key:'bonus',       w:60 },
    { label:'GRS-PAY',   key:'grsPay',      w:72 },
    { label:'TAX-DED',   key:'taxEe',       w:60 },
    { label:'SSS-DED',   key:'sssEe',       w:60 },
    { label:'MED-DED',   key:'medEe',       w:60 },
    { label:'PGBG-DED',  key:'pgbgEe',      w:60 },
    { label:'LOAN-DED',  key:'_loanDed',    w:64 },
    { label:'OTHR-DED',  key:'_othrDed',    w:64 },
    { label:'TOTAL-DED', key:'totDed',      w:64 },
    { label:'NET PAY',   key:'netPay',      w:72 },
  ]
  const getV = (r: TcRow, key: string): number => {
    if (key==='_sphpSpot') return r.sphpPay+r.spotPay
    if (key==='_lghLgot')  return r.lghpPay+r.lgotPay
    if (key==='_lvls')     return r.lvPay+r.lv2Pay+r.lsPay
    if (key==='_loanDed')  return r.slnDed+r.calDed+r.hdmfDed+r.compDed+r.comdDed
    if (key==='_othrDed')  return r.othDed1+r.othDed2+r.othDed3+r.othDed4+r.othDed5+r.othDed6+r.othDed7+r.othDed8+r.othDed9+r.othDed10
    return (r as unknown as Record<string,number>)[key] ?? 0
  }
  const getGA = (key: string) => timecards.reduce((s,r) => s+getV(r,key), 0)
  const SPLIT = 13
  const cols1 = COLS.slice(0, SPLIT+1)
  const cols2 = COLS.slice(SPLIT+1)
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="P A Y R O L L   R E G I S T E R   (Summarized)" />
      {groups.map(g => {
        const dt = Object.fromEntries(COLS.map(c => [c.key, g.rows.reduce((s,r) => s+getV(r,c.key), 0)]))
        return (
          <div key={g.depNo} style={{ marginBottom:6 }}>
            <div style={DEPT_ROW}>Dept: {g.depNo} - {g.depNm}</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{cols1.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
              <tbody>
                {g.rows.map(r => <tr key={r.empNo}>{cols1.map(c => { const isL=!!c.align; return <td key={c.key} style={isL?CELL_L:CELL}>{isL?(c.key==='empNm'?r.empNm.substring(0,22):r.empNo):fmtZ(getV(r,c.key))}</td> })}</tr>)}
                <tr>{cols1.map(c => c.key==='empNo'?<td key={c.key} style={TOTAL_ROW}></td>:c.key==='empNm'?<td key={c.key} style={{ ...TOTAL_ROW, textAlign:'left' }}>DEPARTMENT TOTAL</td>:<td key={c.key} style={TOTAL_ROW}>{fmtZ(dt[c.key] as number)}</td>)}</tr>
              </tbody>
            </table>
            <table style={{ width:'100%', borderCollapse:'collapse', marginTop:2 }}>
              <thead><tr>{cols2.map(c => <th key={c.key} style={{ ...TH, width:c.w }}>{c.label}</th>)}</tr></thead>
              <tbody>
                {g.rows.map(r => <tr key={r.empNo}>{cols2.map(c => <td key={c.key} style={CELL}>{fmtZ(getV(r,c.key))}</td>)}</tr>)}
                <tr>{cols2.map(c => <td key={c.key} style={TOTAL_ROW}>{fmtZ(dt[c.key] as number)}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )
      })}
      <div style={{ marginTop:8 }}>
        <div style={{ fontWeight:700, fontSize:8, marginBottom:2 }}>GRAND TOTAL</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{cols1.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
          <tbody><tr>{cols1.map(c => c.key==='empNo'?<td key={c.key} style={GRAND_ROW}></td>:c.key==='empNm'?<td key={c.key} style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td>:<td key={c.key} style={GRAND_ROW}>{fmtZ(getGA(c.key))}</td>)}</tr></tbody>
        </table>
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:2 }}>
          <thead><tr>{cols2.map(c => <th key={c.key} style={{ ...TH, width:c.w }}>{c.label}</th>)}</tr></thead>
          <tbody><tr>{cols2.map(c => <td key={c.key} style={GRAND_ROW}>{fmtZ(getGA(c.key))}</td>)}</tr></tbody>
        </table>
      </div>
    </div>
  )
}

//  Payroll Summary page (after register) 
function PayrollSummaryPage({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const rows = timecards.filter(t => t.trnFlag==='P'||t.trnFlag==='X')
  const g = {
    regPay:  rows.reduce((s,r)=>s+r.regPay,0),
    rotPay:  rows.reduce((s,r)=>s+r.rotPay,0),
    sphpPay: rows.reduce((s,r)=>s+r.sphpPay,0),
    spotPay: rows.reduce((s,r)=>s+r.spotPay,0),
    lghpPay: rows.reduce((s,r)=>s+r.lghpPay,0),
    lgotPay: rows.reduce((s,r)=>s+r.lgotPay,0),
    nsdPay:  rows.reduce((s,r)=>s+r.nsdPay,0),
    lvPay:   rows.reduce((s,r)=>s+r.lvPay+r.lv2Pay,0),
    lsPay:   rows.reduce((s,r)=>s+r.lsPay,0),
    oth1:    rows.reduce((s,r)=>s+r.othPay1,0),
    oth2:    rows.reduce((s,r)=>s+r.othPay2,0),
    oth3:    rows.reduce((s,r)=>s+r.othPay3,0),
    oth4:    rows.reduce((s,r)=>s+r.othPay4,0),
    bonus:   rows.reduce((s,r)=>s+r.bonus,0),
    grsPay:  rows.reduce((s,r)=>s+r.grsPay,0),
    tax:     rows.reduce((s,r)=>s+r.taxEe,0),
    sssEe:   rows.reduce((s,r)=>s+r.sssEe,0),
    medEe:   rows.reduce((s,r)=>s+r.medEe,0),
    pgbgEe:  rows.reduce((s,r)=>s+r.pgbgEe,0),
    slnDed:  rows.reduce((s,r)=>s+r.slnDed,0),
    calDed:  rows.reduce((s,r)=>s+r.calDed,0),
    hdmfDed: rows.reduce((s,r)=>s+r.hdmfDed,0),
    compDed: rows.reduce((s,r)=>s+r.compDed,0),
    comdDed: rows.reduce((s,r)=>s+r.comdDed,0),
    othDed:  rows.reduce((s,r)=>s+r.othDed1+r.othDed2+r.othDed3+r.othDed4+r.othDed5+r.othDed6+r.othDed7+r.othDed8+r.othDed9+r.othDed10,0),
    totDed:  rows.reduce((s,r)=>s+r.totDed,0),
    netPay:  rows.reduce((s,r)=>s+r.netPay+r.bonus,0),
  }
  const L: React.CSSProperties = { fontFamily:'monospace', fontSize:9, padding:'1px 4px', borderBottom:'1px solid #ddd' }
  const R: React.CSSProperties = { ...L, textAlign:'right', width:110 }
  const earnings: [string, number][] = [
    ['REGULAR PAY', g.regPay], ['REGULAR OT', g.rotPay],
    ['SPECIAL HOLIDAY', g.sphpPay], ['SPECIAL HOLIDAY OT', g.spotPay],
    ['LEGAL HOLIDAY', g.lghpPay], ['LEGAL HOLIDAY OT', g.lgotPay],
    ['NIGHT SHIFT DIFFERENTIAL', g.nsdPay],
    ['V.LEAVE ENCASHMENT', g.lvPay], ['S.LEAVE ENCASHMENT', g.lsPay],
    ['TAXABLE PAY-1 (CTPA/SEA)', g.oth1], ['TAXABLE PAY-2', g.oth3],
    ['NON-TAXABLE PAY-1', g.oth2], ['NON-TAXABLE PAY-2', g.oth4],
    ['BONUS', g.bonus], ['GROSS PAY', g.grsPay + g.bonus],
  ]
  const deductions: [string, number][] = [
    ['TAX WITHHELD', g.tax], ['SSS PREMIUM', g.sssEe], ['MEDICARE PREMIUM', g.medEe],
    ['PAG-IBIG PREMIUM', g.pgbgEe], ['SSS LOAN', g.slnDed], ['CALAMITY LOAN', g.calDed],
    ['HDMF LOAN', g.hdmfDed], ['COMPANY LOAN', g.compDed], ['COMPANY DEDUCTION', g.comdDed],
    ['OTHER DEDUCTIONS', g.othDed], ['TOTAL DEDUCTIONS', g.totDed], ['NET PAY', g.netPay],
  ]
  return (
    <div style={{ fontFamily:'monospace', fontSize:9, maxWidth:380, marginTop:16 }}>
      <ReportHeader si={si} title="P A Y R O L L   S U M M A R Y" />
      <table style={{ borderCollapse:'collapse' }}>
        <tbody>
          <tr><td style={L} colSpan={2}><b>EARNINGS</b></td></tr>
          {earnings.map(([lbl, v]) => <tr key={lbl}><td style={{ ...L, paddingLeft:16 }}>{lbl}</td><td style={R}>{fmt(v)}</td></tr>)}
          <tr><td style={{ ...L, paddingTop:6 }} colSpan={2}><b>DEDUCTIONS</b></td></tr>
          {deductions.map(([lbl, v]) => <tr key={lbl}><td style={{ ...L, paddingLeft:16 }}>{lbl}</td><td style={R}>{fmt(v)}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}

//  Pay Slips (RPPAYSLP.PRG) 
function PaySlips({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const rows = timecards.filter(t => t.trnFlag==='P'||t.trnFlag==='X')
  const SL: React.CSSProperties = { fontFamily:'monospace', fontSize:8, border:'1px solid #ccc', padding:'1px 4px' }
  const SLH: React.CSSProperties = { ...SL, fontWeight:700, background:'#f5f5f5' }
  const SLW: React.CSSProperties = { ...SL, width:90, textAlign:'right' }
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="P A Y S L I P" />
      {rows.map(r => (
        <div key={r.empNo} style={{ border:'1px solid #999', marginBottom:10, padding:6, pageBreakInside:'avoid' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:4 }}>
            <tbody>
              <tr>
                <td style={{ ...SLH, width:140 }}>{si.company||'COMPANY'}</td>
                <td style={{ ...SLH, textAlign:'center' }}>P A Y S L I P  {si.begDate} to {si.endDate}</td>
                <td style={{ ...SLH, width:200 }}>*** RECEIPT OF PAY ***</td>
              </tr>
              <tr>
                <td style={SL}>EMP. NO.: {r.empNo}</td>
                <td style={SL}>DEPT: {r.depNo} - {r.depNm.substring(0,18)}</td>
                <td style={SL}>of the amount of P {fmt(r.netPay+r.bonus)}</td>
              </tr>
              <tr>
                <td style={SL} colSpan={2}>NAME: {r.empNm.substring(0,30)} &nbsp; RATE: {fmt(r.bRate)}</td>
                <td style={SL}>representing salary for {si.begDate} - {si.endDate}</td>
              </tr>
            </tbody>
          </table>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...SLH, width:170, textAlign:'left' }}>EARNINGS</th>
                <th style={{ ...SLH, width:50 }}>HRS</th>
                <th style={{ ...SLH, width:85 }}>AMOUNT</th>
                <th style={{ ...SLH, width:150, textAlign:'left' }}>DEDUCTIONS</th>
                <th style={{ ...SLH, width:85 }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['REGULAR HRS/PAY', r.regHrs, r.regPay, 'TAX WITHHELD', r.taxEe],
                ['REG. OT HRS/PAY', r.rotHrs, r.rotPay, 'SSS PREMIUM', r.sssEe],
                ['SUN/SPL HRS/PAY', r.sphpHrs, r.sphpPay, 'PHILHEALTH', r.medEe],
                ['SUN/SPL OT HRS', r.spotHrs, r.spotPay, 'PAG-IBIG PREM', r.pgbgEe],
                ['LGL.HOL HRS/PAY', r.lghpHrs, r.lghpPay, 'PAG-IBIG LOAN', r.hdmfDed],
                ['LGL.H.OT HRS/PAY', r.lgotHrs, r.lgotPay, 'SSS LOAN', r.slnDed],
                ['NSDIFF HRS/PAY', r.nsdHrs, r.nsdPay, 'CAL LOAN', r.calDed],
                ['VL-ENC DAYS/PAY', r.lvHrs, r.lvPay+r.lv2Pay, 'COMP LOAN', r.compDed],
                ['SL-ENC DAYS/PAY', r.lsHrs, r.lsPay, 'COMD DED', r.comdDed],
                ['CTPA/SEA', 0, r.othPay1, 'OTH DED 1', r.othDed1],
                ['TAXABLE-PAY2', 0, r.othPay3, 'OTH DED 2', r.othDed2],
                ['NON-TAX-PAY1&2', 0, r.othPay2+r.othPay4, 'OTH DED 3', r.othDed3],
                ['13TH MONTH PAY', 0, r.bonus, 'TOTAL DED.', r.totDed],
                ['GROSS PAY', 0, r.grsPay+r.bonus, 'NET PAY', r.netPay+r.bonus],
              ] as [string,number,number,string,number][]).map(([earn, hrs, earnAmt, ded, dedAmt], idx) => (
                <tr key={idx}>
                  <td style={{ ...SL, textAlign:'left' }}>{earn}</td>
                  <td style={SLW}>{hrs ? fmtZ(hrs, 3)  : ''}</td>
                  <td style={SLW}>{fmtZ(earnAmt)}</td>
                  <td style={{ ...SL, textAlign:'left' }}>{ded}</td>
                  <td style={SLW}>{fmtZ(dedAmt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:3, fontSize:8 }}>
            GRS-TO-DT: {fmt(r.yGross)} &nbsp; TAX-TO-DT: {fmt(r.yTax)} &nbsp;
            SS-SAL BAL: {fmt(r.slnBal)} &nbsp; PBG-SAL BAL: {fmt(r.hdmfBal)}
          </div>
        </div>
      ))}
    </div>
  )
}

//  Pay Slip Summary (RPPAYSLP p_ssum) 
function PaySlipSummary({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const rows = timecards.filter(t => t.trnFlag==='P'||t.trnFlag==='X')
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="P A Y S L I P   S U M M A R Y" />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...TH_L, width:48 }}>EMP#</th>
            <th style={{ ...TH_L, width:210 }}>EMPLOYEE NAME</th>
            <th style={{ ...TH, width:90 }}>GROSS-PAY</th>
            <th style={{ ...TH, width:90 }}>TOTAL-DED</th>
            <th style={{ ...TH, width:90 }}>NET-PAY</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.empNo}>
              <td style={CELL_L}>{r.empNo}</td>
              <td style={CELL_L}>{r.empNm.substring(0,30)}</td>
              <td style={CELL}>{fmt(r.grsPay+r.bonus)}</td>
              <td style={CELL}>{fmt(r.totDed)}</td>
              <td style={CELL}>{fmt(r.netPay+r.bonus)}</td>
            </tr>
          ))}
          <tr>
            <td style={GRAND_ROW} colSpan={2}>GRAND TOTAL ({rows.length} employees)</td>
            <td style={GRAND_ROW}>{fmt(rows.reduce((s,r)=>s+r.grsPay+r.bonus,0))}</td>
            <td style={GRAND_ROW}>{fmt(rows.reduce((s,r)=>s+r.totDed,0))}</td>
            <td style={GRAND_ROW}>{fmt(rows.reduce((s,r)=>s+r.netPay+r.bonus,0))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

//  Employee Master List (RPMASTER.PRG) 
function MasterList({ data }: { data: ReportData }) {
  const { sysInfo: si, masters } = data
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="E M P L O Y E E   M A S T E R   L I S T" />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...TH_L, width:48 }}>EMP#</th>
            <th style={{ ...TH_L, width:180 }}>NAME</th>
            <th style={{ ...TH_L, width:36 }}>DEPT</th>
            <th style={{ ...TH_L, width:120 }}>POSITION</th>
            <th style={{ ...TH, width:72 }}>SALARY</th>
            <th style={{ ...TH_L, width:90 }}>SSS NO.</th>
            <th style={{ ...TH_L, width:90 }}>TIN NO.</th>
            <th style={{ ...TH_L, width:90 }}>PHIC NO.</th>
            <th style={{ ...TH_L, width:90 }}>PBG NO.</th>
            <th style={{ ...TH_L, width:72 }}>DATE HIRED</th>
          </tr>
        </thead>
        <tbody>
          {masters.map(m => (
            <tr key={m.empNo}>
              <td style={CELL_L}>{m.empNo}</td>
              <td style={CELL_L}>{m.empNm.substring(0,26)}</td>
              <td style={CELL_L}>{m.depNo}</td>
              <td style={CELL_L}>{(m.position||'').substring(0,18)}</td>
              <td style={CELL}>{fmt(m.bRate)}</td>
              <td style={CELL_L}>{m.sssNo||''}</td>
              <td style={CELL_L}>{m.tinNo||''}</td>
              <td style={CELL_L}>{m.phicNo||''}</td>
              <td style={CELL_L}>{m.pgbgNo||''}</td>
              <td style={CELL_L}>{m.dateHire}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

//  Salary Rate only 
function SalaryRate({ data }: { data: ReportData }) {
  const { sysInfo: si, masters } = data
  const groups: Record<string, MasterRow[]> = {}
  for (const m of masters) { const k = m.depNo||'00'; (groups[k]=groups[k]||[]).push(m) }
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="E M P L O Y E E   S A L A R Y   R A T E" />
      {Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([depNo, rows]) => (
        <div key={depNo} style={{ marginBottom:6 }}>
          <div style={DEPT_ROW}>Dept: {depNo} - {rows[0].depNm}</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={{ ...TH_L, width:48 }}>EMP#</th><th style={{ ...TH_L, width:200 }}>NAME</th><th style={{ ...TH_L, width:130 }}>POSITION</th><th style={{ ...TH, width:90 }}>BASIC RATE</th><th style={{ ...TH_L, width:72 }}>DATE HIRED</th></tr></thead>
            <tbody>{rows.map(m => <tr key={m.empNo}><td style={CELL_L}>{m.empNo}</td><td style={CELL_L}>{m.empNm.substring(0,28)}</td><td style={CELL_L}>{(m.position||'').substring(0,20)}</td><td style={CELL}>{fmt(m.bRate)}</td><td style={CELL_L}>{m.dateHire}</td></tr>)}</tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

//  Loan Balance 
function LoanBalance({ data }: { data: ReportData }) {
  const { sysInfo: si, masters } = data
  const withLoans = masters.filter(m => m.slnBal+m.calBal+m.hdmfBal+m.compBal+m.comdBal > 0)
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="E M P L O Y E E   L O A N   B A L A N C E S" />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>
          <th style={{ ...TH_L, width:48 }}>EMP#</th>
          <th style={{ ...TH_L, width:190 }}>NAME</th>
          <th style={{ ...TH, width:80 }}>SSS LOAN</th>
          <th style={{ ...TH, width:80 }}>CAL LOAN</th>
          <th style={{ ...TH, width:80 }}>HDMF LOAN</th>
          <th style={{ ...TH, width:80 }}>COMP LOAN</th>
          <th style={{ ...TH, width:80 }}>COMD DED</th>
        </tr></thead>
        <tbody>
          {withLoans.map(m => (
            <tr key={m.empNo}>
              <td style={CELL_L}>{m.empNo}</td>
              <td style={CELL_L}>{m.empNm.substring(0,28)}</td>
              <td style={CELL}>{fmtZ(m.slnBal)}</td>
              <td style={CELL}>{fmtZ(m.calBal)}</td>
              <td style={CELL}>{fmtZ(m.hdmfBal)}</td>
              <td style={CELL}>{fmtZ(m.compBal)}</td>
              <td style={CELL}>{fmtZ(m.comdBal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

//  Monthly Payroll Recap (RPPAYMON.PRG) 
function MonthlyRecap({ data }: { data: ReportData }) {
  const { sysInfo: si, masters } = data
  const groups: Record<string, MasterRow[]> = {}
  for (const m of masters) { const k = m.depNo||'00'; (groups[k]=groups[k]||[]).push(m) }
  type Col = { label:string; key:string; w:number; align?:'left' }
  const COLS: Col[] = [
    { label:'EMP#',    key:'empNo',   w:48, align:'left' },
    { label:'NAME',    key:'empNm',   w:140, align:'left' },
    { label:'REG-PAY', key:'mBasic',  w:72 },
    { label:'HOL-PAY', key:'mHol',    w:72 },
    { label:'OT-PAY',  key:'mOt',     w:72 },
    { label:'LEAVE',   key:'mLeave',  w:72 },
    { label:'GROSS',   key:'mGross',  w:80 },
    { label:'SSS EE',  key:'mSsee',   w:64 },
    { label:'SSS ER',  key:'mSser',   w:64 },
    { label:'MED EE',  key:'mMedee',  w:64 },
    { label:'MED ER',  key:'mMeder',  w:64 },
    { label:'PBG EE',  key:'mPgee',   w:60 },
    { label:'PBG ER',  key:'mPger',   w:60 },
    { label:'EC ER',   key:'mEcer',   w:56 },
    { label:'TAX',     key:'mTax',    w:72 },
    { label:'NET PAY', key:'mNetpay', w:80 },
  ]
  const getV = (m: MasterRow, key: string): number => (m as unknown as Record<string,number>)[key] ?? 0
  const getGA = (key: string) => masters.reduce((s,m) => s+getV(m,key), 0)
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title={`M O N T H L Y   P A Y R O L L   R E C A P  ${si.monthName||''} ${si.presYr}`} />
      {Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([depNo, rows]) => {
        const dt = Object.fromEntries(COLS.map(c => [c.key, rows.reduce((s,m) => s+getV(m,c.key), 0)]))
        return (
          <div key={depNo} style={{ marginBottom:6 }}>
            <div style={DEPT_ROW}>Dept: {depNo} - {rows[0].depNm}</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
              <tbody>
                {rows.filter(m=>m.mGross>0).map(m => <tr key={m.empNo}>{COLS.map(c => { const isL=!!c.align; return <td key={c.key} style={isL?CELL_L:CELL}>{isL?(c.key==='empNm'?m.empNm.substring(0,22):m.empNo):fmtZ(getV(m,c.key))}</td> })}</tr>)}
                <tr>{COLS.map(c => c.key==='empNo'?<td key={c.key} style={TOTAL_ROW}></td>:c.key==='empNm'?<td key={c.key} style={{ ...TOTAL_ROW, textAlign:'left' }}>DEPT TOTAL</td>:<td key={c.key} style={TOTAL_ROW}>{fmtZ(dt[c.key] as number)}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )
      })}
      <table style={{ width:'100%', borderCollapse:'collapse', marginTop:6 }}>
        <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
        <tbody><tr>{COLS.map(c => c.key==='empNo'?<td key={c.key} style={GRAND_ROW}></td>:c.key==='empNm'?<td key={c.key} style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td>:<td key={c.key} style={GRAND_ROW}>{fmtZ(getGA(c.key))}</td>)}</tr></tbody>
      </table>
    </div>
  )
}

//  Monthly Premiums (RPMONSSS.PRG) 
function MonthlyPremiums({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const groups = groupByDept(timecards.filter(t => t.trnFlag==='P'||t.trnFlag==='X'))
  type Col = { label:string; key:string; w:number; align?:'left' }
  const COLS: Col[] = [
    { label:'EMP#',      key:'empNo',  w:48, align:'left' },
    { label:'NAME',      key:'empNm',  w:150, align:'left' },
    { label:'SSS NO.',   key:'sssNo',  w:90, align:'left' },
    { label:'GROSS',     key:'grsPay', w:72 },
    { label:'SSS EE',    key:'sssEe',  w:64 },
    { label:'SSS ER',    key:'sssEr',  w:64 },
    { label:'PHIC EE',   key:'medEe',  w:64 },
    { label:'PHIC ER',   key:'medEr',  w:64 },
    { label:'EC ER',     key:'ecEr',   w:56 },
    { label:'PBG EE',    key:'pgbgEe', w:60 },
    { label:'PBG ER',    key:'pgbgEr', w:60 },
    { label:'TAX EE',    key:'taxEe',  w:60 },
    { label:'TOTAL DED', key:'totDed', w:64 },
  ]
  const getV = (r: TcRow, key: string): string | number => {
    if (key==='sssNo') return r.sssNo||''
    return (r as unknown as Record<string,number>)[key] ?? 0
  }
  const getGA = (key: string) => timecards.reduce((s,r) => s+(typeof (r as unknown as Record<string,number>)[key]==='number'?(r as unknown as Record<string,number>)[key]:0), 0)
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title={`M O N T H L Y   S S S / P H I C / E C / P B G  ${si.monthName||''} ${si.presYr}`} />
      {groups.map(g => {
        const dt = Object.fromEntries(COLS.map(c => [c.key, c.align==='left' ? '' : g.rows.reduce((s,r) => s+(typeof (r as unknown as Record<string,number>)[c.key]==='number'?(r as unknown as Record<string,number>)[c.key]:0), 0)]))
        return (
          <div key={g.depNo} style={{ marginBottom:6 }}>
            <div style={DEPT_ROW}>Dept: {g.depNo} - {g.depNm}</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
              <tbody>
                {g.rows.map(r => <tr key={r.empNo}>{COLS.map(c => { const isL=!!c.align; const v=getV(r,c.key); const txt=isL?(c.key==='empNm'?r.empNm.substring(0,22):String(v)):fmtZ(Number(v)); return <td key={c.key} style={isL?CELL_L:CELL}>{txt}</td> })}</tr>)}
                <tr>{COLS.map(c => c.key==='empNo'?<td key={c.key} style={TOTAL_ROW}></td>:c.align==='left'?<td key={c.key} style={{ ...TOTAL_ROW, textAlign:'left' }}>DEPT TOTAL</td>:<td key={c.key} style={TOTAL_ROW}>{fmtZ(dt[c.key] as number)}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )
      })}
      <table style={{ width:'100%', borderCollapse:'collapse', marginTop:6 }}>
        <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
        <tbody><tr>{COLS.map(c => c.key==='empNo'?<td key={c.key} style={GRAND_ROW}></td>:c.align==='left'?<td key={c.key} style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td>:<td key={c.key} style={GRAND_ROW}>{fmtZ(getGA(c.key))}</td>)}</tr></tbody>
      </table>
    </div>
  )
}

//  Dept Summary (RPDEPSUM.PRG) 
function DeptSummary({ data }: { data: ReportData }) {
  const { sysInfo: si, departments } = data
  const tot = departments.reduce((acc,d) => { for (const k of ['regPay','otPay','holPay','grsPay','tax','sssEe','sssEr','medEe','medEr','pgbgEe','pgbgEr','ecEr','netPay'] as const) acc[k]=(acc[k]||0)+d[k]; acc.empCtr=(acc.empCtr||0)+d.empCtr; return acc }, {} as Record<string,number>)
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title={`D E P A R T M E N T   S U M M A R Y  ${si.monthName||''} ${si.presYr}`} />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>
          <th style={{ ...TH_L, width:40 }}>DEPT#</th>
          <th style={{ ...TH_L, width:150 }}>DEPARTMENT</th>
          <th style={{ ...TH, width:48 }}>#EMP</th>
          <th style={{ ...TH, width:72 }}>REG-PAY</th>
          <th style={{ ...TH, width:65 }}>OT-PAY</th>
          <th style={{ ...TH, width:65 }}>HOL-PAY</th>
          <th style={{ ...TH, width:80 }}>GROSS</th>
          <th style={{ ...TH, width:60 }}>TAX</th>
          <th style={{ ...TH, width:60 }}>SSS EE</th>
          <th style={{ ...TH, width:60 }}>SSS ER</th>
          <th style={{ ...TH, width:60 }}>MED EE</th>
          <th style={{ ...TH, width:60 }}>MED ER</th>
          <th style={{ ...TH, width:58 }}>PBG EE</th>
          <th style={{ ...TH, width:58 }}>PBG ER</th>
          <th style={{ ...TH, width:54 }}>EC ER</th>
          <th style={{ ...TH, width:78 }}>NET PAY</th>
        </tr></thead>
        <tbody>
          {departments.map(d => (
            <tr key={d.depNo}>
              <td style={CELL_L}>{d.depNo}</td>
              <td style={CELL_L}>{d.depNm.substring(0,20)}</td>
              <td style={CELL}>{d.empCtr||''}</td>
              <td style={CELL}>{fmtZ(d.regPay)}</td>
              <td style={CELL}>{fmtZ(d.otPay)}</td>
              <td style={CELL}>{fmtZ(d.holPay)}</td>
              <td style={CELL}>{fmtZ(d.grsPay)}</td>
              <td style={CELL}>{fmtZ(d.tax)}</td>
              <td style={CELL}>{fmtZ(d.sssEe)}</td>
              <td style={CELL}>{fmtZ(d.sssEr)}</td>
              <td style={CELL}>{fmtZ(d.medEe)}</td>
              <td style={CELL}>{fmtZ(d.medEr)}</td>
              <td style={CELL}>{fmtZ(d.pgbgEe)}</td>
              <td style={CELL}>{fmtZ(d.pgbgEr)}</td>
              <td style={CELL}>{fmtZ(d.ecEr)}</td>
              <td style={CELL}>{fmtZ(d.netPay)}</td>
            </tr>
          ))}
          <tr>
            <td style={GRAND_ROW}></td>
            <td style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td>
            <td style={GRAND_ROW}>{tot.empCtr||0}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.regPay)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.otPay)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.holPay)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.grsPay)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.tax)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.sssEe)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.sssEr)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.medEe)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.medEr)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.pgbgEe)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.pgbgEr)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.ecEr)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.netPay)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

//  Year-End Recap 
function YearEndRecap({ data }: { data: ReportData }) {
  const { sysInfo: si, masters } = data
  const tot = { yGross:0, ySsee:0, yMedee:0, yPgee:0, yEcer:0, yTax:0, yBonus:0 }
  for (const m of masters) { tot.yGross+=m.yGross; tot.ySsee+=m.ySsee; tot.yMedee+=m.yMedee; tot.yPgee+=m.yPgee; tot.yEcer+=m.yEcer; tot.yTax+=m.yTax; tot.yBonus+=(m.yBonus||0) }
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title={`Y E A R - E N D   P A Y R O L L   R E C A P   ${si.presYr}`} />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>
          <th style={{ ...TH_L, width:48 }}>EMP#</th>
          <th style={{ ...TH_L, width:185 }}>NAME</th>
          <th style={{ ...TH, width:82 }}>TTL GROSS</th>
          <th style={{ ...TH, width:72 }}>SSS EE</th>
          <th style={{ ...TH, width:72 }}>MED EE</th>
          <th style={{ ...TH, width:72 }}>PBG EE</th>
          <th style={{ ...TH, width:60 }}>EC ER</th>
          <th style={{ ...TH, width:72 }}>TTL TAX</th>
          <th style={{ ...TH, width:72 }}>BONUS</th>
        </tr></thead>
        <tbody>
          {masters.filter(m=>m.yGross>0).map(m => (
            <tr key={m.empNo}>
              <td style={CELL_L}>{m.empNo}</td>
              <td style={CELL_L}>{m.empNm.substring(0,26)}</td>
              <td style={CELL}>{fmtZ(m.yGross)}</td>
              <td style={CELL}>{fmtZ(m.ySsee)}</td>
              <td style={CELL}>{fmtZ(m.yMedee)}</td>
              <td style={CELL}>{fmtZ(m.yPgee)}</td>
              <td style={CELL}>{fmtZ(m.yEcer)}</td>
              <td style={CELL}>{fmtZ(m.yTax)}</td>
              <td style={CELL}>{fmtZ((m as unknown as Record<string,number>).yBonus||0)}</td>
            </tr>
          ))}
          <tr>
            <td style={GRAND_ROW}></td>
            <td style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td>
            <td style={GRAND_ROW}>{fmtZ(tot.yGross)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.ySsee)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.yMedee)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.yPgee)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.yEcer)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.yTax)}</td>
            <td style={GRAND_ROW}>{fmtZ(tot.yBonus)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

//  Alpha List (RPALPHAL.PRG simplified) 
function AlphaList({ data }: { data: ReportData }) {
  const { sysInfo: si, masters } = data
  const sorted = [...masters].sort((a,b) => a.empNm.localeCompare(b.empNm))
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title={`A L P H A   L I S T   (BIR)   ${si.presYr}`} />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>
          <th style={{ ...TH, width:30 }}>SEQ</th>
          <th style={{ ...TH_L, width:90 }}>TIN</th>
          <th style={{ ...TH_L, width:120 }}>LAST NAME</th>
          <th style={{ ...TH_L, width:110 }}>FIRST NAME</th>
          <th style={{ ...TH, width:82 }}>GROSS INC</th>
          <th style={{ ...TH, width:72 }}>SSS/GSIS</th>
          <th style={{ ...TH, width:72 }}>PHIC</th>
          <th style={{ ...TH, width:72 }}>HDMF</th>
          <th style={{ ...TH, width:72 }}>BONUS</th>
          <th style={{ ...TH, width:72 }}>TAX DUE</th>
          <th style={{ ...TH, width:72 }}>TAX W/H</th>
        </tr></thead>
        <tbody>
          {sorted.map((m, i) => {
            const parts = m.empNm.trim().split(',')
            const ln = parts[0]?.trim()||m.empNm
            const fn = parts[1]?.trim()||''
            return (
              <tr key={m.empNo}>
                <td style={CELL}>{i+1}</td>
                <td style={CELL_L}>{m.tinNo||''}</td>
                <td style={CELL_L}>{ln.substring(0,18)}</td>
                <td style={CELL_L}>{fn.substring(0,16)}</td>
                <td style={CELL}>{fmtZ(m.yGross+(m as unknown as Record<string,number>).yBonus||0)}</td>
                <td style={CELL}>{fmtZ(m.ySsee)}</td>
                <td style={CELL}>{fmtZ(m.yMedee)}</td>
                <td style={CELL}>{fmtZ(m.yPgee)}</td>
                <td style={CELL}>{fmtZ((m as unknown as Record<string,number>).yBonus||0)}</td>
                <td style={CELL}>{fmtZ(m.yTax)}</td>
                <td style={CELL}>{fmtZ(m.yTax)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

//  Timecard Validation 
function TimecardValidation({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const groups = groupByDept(timecards)
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="T I M E C A R D   V A L I D A T I O N" />
      {groups.map(g => (
        <div key={g.depNo} style={{ marginBottom:6 }}>
          <div style={DEPT_ROW}>Dept: {g.depNo} - {g.depNm}</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={{ ...TH_L, width:48 }}>EMP#</th>
              <th style={{ ...TH_L, width:160 }}>NAME</th>
              <th style={{ ...TH, width:44 }}>REG</th>
              <th style={{ ...TH, width:44 }}>ABS</th>
              <th style={{ ...TH, width:44 }}>OT</th>
              <th style={{ ...TH, width:44 }}>SPHP</th>
              <th style={{ ...TH, width:44 }}>SPOT</th>
              <th style={{ ...TH, width:44 }}>LGHP</th>
              <th style={{ ...TH, width:44 }}>LGOT</th>
              <th style={{ ...TH, width:44 }}>NSD</th>
              <th style={{ ...TH, width:44 }}>LV</th>
              <th style={{ ...TH, width:44 }}>LS</th>
              <th style={{ ...TH_L, width:30 }}>FLG</th>
            </tr></thead>
            <tbody>
              {g.rows.map(r => (
                <tr key={r.empNo}>
                  <td style={CELL_L}>{r.empNo}</td>
                  <td style={CELL_L}>{r.empNm.substring(0,22)}</td>
                  <td style={CELL}>{fmtZ(r.regHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.absHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.rotHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.sphpHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.spotHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.lghpHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.lgotHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.nsdHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.lvHrs,2)}</td>
                  <td style={CELL}>{fmtZ(r.lsHrs,2)}</td>
                  <td style={CELL_L}>{r.trnFlag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

//  Deductions Loans Only (RPREGIST Format 3) 
function LoansOnly({ data }: { data: ReportData }) {
  const { sysInfo: si, timecards } = data
  const groups = groupByDept(timecards.filter(t => t.trnFlag==='P'||t.trnFlag==='X'))
  const getV = (r: TcRow, key: string): number => {
    if (key==='_tot') return r.slnDed+r.calDed+r.hdmfDed+r.compDed+r.comdDed
    return (r as unknown as Record<string,number>)[key]??0
  }
  const getGA = (key: string) => timecards.reduce((s,r) => s+getV(r,key), 0)
  const COLS = [
    { label:'EMP#',      key:'empNo',   w:48, align:'left' as const },
    { label:'NAME',      key:'empNm',   w:160, align:'left' as const },
    { label:'SSS LOAN',  key:'slnDed',  w:72 },
    { label:'CAL LOAN',  key:'calDed',  w:72 },
    { label:'HDMF LOAN', key:'hdmfDed', w:72 },
    { label:'COMP LOAN', key:'compDed', w:72 },
    { label:'COMD DED',  key:'comdDed', w:72 },
    { label:'TOTAL',     key:'_tot',    w:80 },
  ]
  return (
    <div style={{ fontFamily:'monospace', fontSize:8 }}>
      <ReportHeader si={si} title="D E D U C T I O N S  Loans Only" />
      {groups.map(g => (
        <div key={g.depNo} style={{ marginBottom:6 }}>
          <div style={DEPT_ROW}>Dept: {g.depNo} - {g.depNm}</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
            <tbody>
              {g.rows.map(r => <tr key={r.empNo}>{COLS.map(c => { const isL=!!c.align; return <td key={c.key} style={isL?CELL_L:CELL}>{isL?(c.key==='empNm'?r.empNm.substring(0,24):r.empNo):fmtZ(getV(r,c.key))}</td> })}</tr>)}
              <tr>{COLS.map(c => c.key==='empNo'?<td key={c.key} style={TOTAL_ROW}></td>:c.key==='empNm'?<td key={c.key} style={{ ...TOTAL_ROW, textAlign:'left' }}>DEPT TOTAL</td>:<td key={c.key} style={TOTAL_ROW}>{fmtZ(g.rows.reduce((s,r)=>s+getV(r,c.key),0))}</td>)}</tr>
            </tbody>
          </table>
        </div>
      ))}
      <table style={{ width:'100%', borderCollapse:'collapse', marginTop:6 }}>
        <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align??'right', width:c.w }}>{c.label}</th>)}</tr></thead>
        <tbody><tr>{COLS.map(c => c.key==='empNo'?<td key={c.key} style={GRAND_ROW}></td>:c.key==='empNm'?<td key={c.key} style={{ ...GRAND_ROW, textAlign:'left' }}>GRAND TOTAL</td>:<td key={c.key} style={GRAND_ROW}>{fmtZ(getGA(c.key))}</td>)}</tr></tbody>
      </table>
    </div>
  )
}

//  Stub for not-yet-implemented formats 
function ReportStub({ data, title, subKey }: { data: ReportData; title: string; subKey?: string }) {
  const { sysInfo: si } = data
  return (
    <div style={{ fontFamily:'monospace', fontSize:9 }}>
      <ReportHeader si={si} title={title} />
      <p style={{ color:'#888', marginTop:12, fontSize:12 }}>
        <b>{title}</b>{subKey?` / ${subKey}`:''}<br/>
        Data available: {data.timecards.length} timecards, {data.masters.length} employees.<br/>
        This detailed report layout is not yet fully implemented.
      </p>
    </div>
  )
}

//  Route report type to component 
function renderReport(reportType: string, subOptionKey: string|undefined, title: string, data: ReportData): React.ReactNode {
  switch (reportType) {
    case 'register':
      if (subOptionKey==='loans')    return <LoansOnly data={data} />
      if (subOptionKey==='summary')  return <RegisterSummarized data={data} />
      return <RegisterWithHours data={data} />
    case 'timecard-validation':      return <TimecardValidation data={data} />
    case 'deductions':               return <LoansOnly data={data} />
    case 'payslip': case 'bonus':
      if (subOptionKey==='summary'||subOptionKey==='atm') return <PaySlipSummary data={data} />
      return <PaySlips data={data} />
    case 'employee-master':
      if (subOptionKey==='salary')   return <SalaryRate data={data} />
      if (subOptionKey==='loan')     return <LoanBalance data={data} />
      return <MasterList data={data} />
    case 'monthly':
      if (subOptionKey==='recap')    return <MonthlyRecap data={data} />
      if (subOptionKey==='dept')     return <DeptSummary data={data} />
      return <MonthlyPremiums data={data} />
    case 'quarterly':                return <ReportStub data={data} title={title} subKey={subOptionKey} />
    case 'yearly-recap':             return <YearEndRecap data={data} />
    case 'year-end-tax':
      if (subOptionKey==='alpha')    return <AlphaList data={data} />
      return <ReportStub data={data} title={title} subKey={subOptionKey} />
    case 'premium-cert':             return <MonthlyPremiums data={data} />
    default:                         return <ReportStub data={data} title={title} subKey={subOptionKey} />
  }
}

//  Print CSS 
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #pay-print-area, #pay-print-area * { visibility: visible !important; }
  #pay-print-area {
    position: absolute; left: 0; top: 0; width: 100%;
    overflow: visible !important;
    border: none !important;
    padding: 5mm !important;
  }
  @page { size: legal landscape; margin: 6mm 5mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    padding: 0 3px !important;
    line-height: 14px !important;
    white-space: nowrap !important;
    font-size: 8pt !important;
    font-family: 'Courier New', monospace !important;
  }
  div { overflow: visible !important; }
}
`

//  ReportViewer 
function ReportViewer({ reportType, subOptionKey, title, onBack }: {
  reportType: string; subOptionKey?: string; title: string; onBack?: () => void
}) {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/payroll/report-data')
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      setData(await res.json() as ReportData)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const handlePrint = async () => {
    if (!printRef.current || pdfLoading) return
    setPdfLoading(true)
    const el = printRef.current

    // Temporarily expand overflow so html2canvas captures the full scrollable width
    const prevOverflow = el.style.overflow
    const prevOverflowX = el.style.overflowX
    const prevWidth = el.style.width
    el.style.overflow = 'visible'
    el.style.overflowX = 'visible'
    el.style.width = el.scrollWidth + 'px'

    try {
      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      // Legal landscape: 14" × 8.5" at 72pt/in
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'legal' })
      const pW = pdf.internal.pageSize.getWidth()
      const pH = pdf.internal.pageSize.getHeight()
      const margin = 18
      const contentH = pH - margin * 2

      const cW = canvas.width
      const cH = canvas.height
      const scaleRatio = pW / cW
      const scaledFullH = cH * scaleRatio

      let yRendered = 0
      let page = 0

      while (yRendered < scaledFullH) {
        if (page > 0) pdf.addPage()

        const srcY = yRendered / scaleRatio
        const srcSliceH = Math.min(contentH / scaleRatio, cH - srcY)

        const slice = document.createElement('canvas')
        slice.width = cW
        slice.height = Math.ceil(srcSliceH)
        const ctx = slice.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, slice.width, slice.height)
        ctx.drawImage(canvas, 0, srcY, cW, srcSliceH, 0, 0, cW, srcSliceH)

        const imgData = slice.toDataURL('image/jpeg', 0.95)
        pdf.addImage(imgData, 'JPEG', 0, margin, pW, srcSliceH * scaleRatio)

        yRendered += contentH
        page++
      }

      const filename = title.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') + '.pdf'
      pdf.save(filename)
    } finally {
      el.style.overflow = prevOverflow
      el.style.overflowX = prevOverflowX
      el.style.width = prevWidth
      setPdfLoading(false)
    }
  }

  const reportNode = data ? renderReport(reportType, subOptionKey, title, data) : null
  const canShowSummary = reportType==='register' || reportType==='payslip'

  return (
    <div className="card">
      <style>{PRINT_STYLE}</style>
      {onBack && (
        <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom:12, fontSize:12 }}>
          &larr; Back
        </button>
      )}
      <h2 style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{title}</h2>
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <button className="btn btn-secondary" style={{ fontSize:12, padding:'4px 14px' }} onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading...' : '\u21BA Refresh'}
        </button>
        <button className="btn btn-primary" style={{ fontSize:12, padding:'4px 14px' }} onClick={() => { void handlePrint() }} disabled={!data||loading||pdfLoading}>
          {pdfLoading ? 'Generating PDF...' : 'Export PDF'}
        </button>
        {canShowSummary && (
          <button className="btn btn-secondary" style={{ fontSize:12, padding:'4px 14px' }} onClick={() => setShowSummary(s=>!s)}>
            {showSummary ? 'Hide Summary' : 'Show Payroll Summary'}
          </button>
        )}
      </div>
      {error && <div style={{ color:'var(--error)', marginBottom:10 }}>{error}</div>}
      {loading && <div style={{ color:'var(--text-muted)', marginBottom:10 }}>Loading report data...</div>}
      {data && (
        <div id="pay-print-area" ref={printRef}
          style={{ background:'white', border:'1px solid var(--border)', borderRadius:6, padding:10, overflowX:'auto' }}>
          {reportNode}
          {showSummary && <PayrollSummaryPage data={data} />}
        </div>
      )}
    </div>
  )
}

//  Main export 
export default function PayrollReports() {
  const { reportType } = useParams<{ reportType: string }>()
  const [subOption, setSubOption] = useState<{ key: string; label: string } | null>(null)

  const subOptions = SUB_OPTIONS[reportType || ''] ?? []
  const parentTitle = REPORT_TITLES[reportType || ''] || 'Payroll Report'
  const activeTitle = subOption ? subOption.label : parentTitle

  useEffect(() => { setSubOption(null) }, [reportType])

  if (subOptions.length > 0 && !subOption) {
    return (
      <SubOptionSelector
        parentTitle={parentTitle}
        options={subOptions}
        onSelect={(key, label) => setSubOption({ key, label })}
      />
    )
  }

  return (
    <ReportViewer
      reportType={reportType || ''}
      subOptionKey={subOption?.key}
      title={activeTitle}
      onBack={subOptions.length > 0 ? () => setSubOption(null) : undefined}
    />
  )
}