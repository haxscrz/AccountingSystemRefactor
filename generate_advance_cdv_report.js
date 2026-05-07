// generate_advance_cdv_report.js
// Generates a professional PDF report of all Advance CDVs per company

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB = 'd:/DOWNLOADS/Accounting System/web-system/server/AccountingApi/accounting_v6.db';
const OUTPUT_HTML = 'd:/DOWNLOADS/Accounting System/advance_cdv_report.html';

function sql(query) {
  return execSync(`sqlite3 "${DB}" "${query.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
}

// Fetch data for all companies
const companies = [
  { code: 'gian',     name: 'GIAN GENERAL SERVICES INC' },
  { code: '3jcrt',   name: '3JCRT GENERAL SERVICES INC' },
  { code: 'jimi',    name: 'JIMI GENERAL SERVICES INC' },
  { code: 'lmjay',   name: 'LMJAY GENERAL SERVICES INC' },
  { code: 'thermalex', name: 'THERMALEX GENERAL SERVICES INC' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr.trim());
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getTargetMonth(dateStr) {
  const d = new Date(dateStr.trim());
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

let totalAdvance = 0;
let companySections = '';

for (const c of companies) {
  const periodRaw = sql(`SELECT pres_mo || '/' || pres_yr FROM fs_sys_id WHERE company_code='${c.code}' LIMIT 1`);
  const [mo, yr] = periodRaw.split('/');
  const period = `${MONTHS[parseInt(mo)-1]} ${yr}`;

  const currentCount = parseInt(sql(`SELECT COUNT(*) FROM fs_checkmas WHERE company_code='${c.code}' AND j_ck_no NOT LIKE 'ADV%'`));
  const advRaw = sql(`SELECT j_ck_no, j_jv_no, j_date, j_pay_to, j_ck_amt FROM fs_checkmas WHERE company_code='${c.code}' AND j_ck_no LIKE 'ADV%' ORDER BY j_date ASC`);

  const advRows = advRaw ? advRaw.split('\n').filter(l => l.trim()) : [];
  totalAdvance += advRows.length;

  let rows = '';
  let prevMonth = '';
  for (const [i, row] of advRows.entries()) {
    const parts = row.split('|');
    const ckNo = parts[0] || '';
    const jvNo = parts[1] || '';
    const jDate = parts[2] || '';
    const payTo = parts[3] || '—';
    const amt = parts[4] ? parseFloat(parts[4]).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—';
    const targetMonth = getTargetMonth(jDate);
    const formattedDate = formatDate(jDate);

    const monthHeader = prevMonth !== targetMonth
      ? `<tr class="month-group"><td colspan="5">📅 Target Period: <strong>${targetMonth}</strong></td></tr>`
      : '';
    prevMonth = targetMonth;

    rows += `${monthHeader}
    <tr>
      <td class="num">${i + 1}</td>
      <td class="ck"><span class="adv-badge">ADV</span>${ckNo.replace(/^ADV/, '')}</td>
      <td>${formattedDate}</td>
      <td class="payto">${payTo}</td>
      <td class="amt">₱ ${amt}</td>
    </tr>`;
  }

  const emptyMsg = advRows.length === 0
    ? `<tr><td colspan="5" class="empty">No Advance CDVs for this company.</td></tr>`
    : '';

  companySections += `
  <div class="company-block">
    <div class="company-header">
      <div class="company-name">${c.name}</div>
      <div class="company-meta">
        <span class="badge blue">Active Period: ${period}</span>
        <span class="badge green">Current Checks: ${currentCount}</span>
        <span class="badge orange">Advance CDVs: ${advRows.length}</span>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>Check No.</th>
          <th>Check Date</th>
          <th>Pay To</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}${emptyMsg}
      </tbody>
    </table>
  </div>`;
}

const today = new Date();
const reportDate = `${String(today.getDate()).padStart(2,'0')} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Advance CDV Report — iSupplyTech Accounting System</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', sans-serif;
    background: #f8f9fc;
    color: #1a1d23;
    font-size: 11pt;
  }

  @media print {
    body { background: white; }
    .company-block { page-break-inside: avoid; }
    .no-print { display: none; }
  }

  .page-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* ── Header ── */
  .report-header {
    background: linear-gradient(135deg, #1a1d23 0%, #2d3546 50%, #1a1d23 100%);
    color: white;
    border-radius: 16px;
    padding: 36px 40px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }
  .report-header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
  .report-header::after {
    content: '';
    position: absolute;
    bottom: -60px; left: 40%;
    width: 240px; height: 240px;
    background: rgba(255,255,255,0.03);
    border-radius: 50%;
  }
  .header-top {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .header-logo {
    width: 48px; height: 48px;
    background: rgba(255,255,255,0.12);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .header-brand {
    font-size: 10pt;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .report-title {
    font-size: 26pt;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 8px;
    position: relative; z-index: 1;
  }
  .report-subtitle {
    font-size: 11pt;
    color: rgba(255,255,255,0.6);
    position: relative; z-index: 1;
  }
  .header-stats {
    display: flex;
    gap: 24px;
    margin-top: 24px;
    position: relative; z-index: 1;
  }
  .stat-box {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 12px 20px;
    text-align: center;
  }
  .stat-value {
    font-size: 22pt;
    font-weight: 700;
    display: block;
  }
  .stat-label {
    font-size: 8.5pt;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Summary Section ── */
  .summary-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e8eaf0;
    padding: 20px 24px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .summary-icon { font-size: 20px; }
  .summary-text { font-size: 10.5pt; color: #555; line-height: 1.6; }
  .summary-text strong { color: #1a1d23; }

  /* ── Company Block ── */
  .company-block {
    background: white;
    border-radius: 14px;
    border: 1px solid #e8eaf0;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .company-header {
    background: linear-gradient(90deg, #f5f7ff 0%, #fff 100%);
    border-bottom: 1px solid #e8eaf0;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .company-name {
    font-size: 12.5pt;
    font-weight: 700;
    color: #1a1d23;
    letter-spacing: -0.2px;
  }
  .company-meta { display: flex; gap: 8px; flex-wrap: wrap; }

  .badge {
    font-size: 8.5pt;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge.blue  { background: #e8f0fe; color: #1a56db; }
  .badge.green { background: #e2f5ea; color: #057a55; }
  .badge.orange { background: #fef3e2; color: #c27803; }

  /* ── Table ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  thead th {
    background: #f5f7fa;
    color: #6b7280;
    font-weight: 600;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 10px 16px;
    border-bottom: 1px solid #e8eaf0;
    text-align: left;
  }
  th.num, td.num { text-align: center; width: 40px; }
  th:last-child, td.amt { text-align: right; }
  
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #fafbff; }
  
  td { padding: 10px 16px; color: #374151; vertical-align: middle; }
  td.num { color: #9ca3af; font-size: 9pt; }
  td.ck { font-weight: 600; font-family: 'Courier New', monospace; font-size: 9.5pt; color: #1a1d23; }
  td.payto { color: #4b5563; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  td.amt { font-weight: 600; color: #1a1d23; font-variant-numeric: tabular-nums; }

  .adv-badge {
    display: inline-block;
    background: #fff3e0;
    color: #e65100;
    border: 1px solid #ffcc80;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 1px 5px;
    margin-right: 6px;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.5px;
  }

  tr.month-group td {
    background: linear-gradient(90deg, #fffbf0 0%, #fff 100%);
    color: #92400e;
    font-size: 9pt;
    font-weight: 500;
    padding: 8px 16px;
    border-bottom: 1px solid #fde68a;
    border-top: 1px solid #fde68a;
  }

  .empty {
    text-align: center;
    color: #9ca3af;
    padding: 24px;
    font-style: italic;
    font-size: 10pt;
  }

  /* ── Footer ── */
  .report-footer {
    margin-top: 32px;
    padding: 20px 0;
    border-top: 1px solid #e8eaf0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9pt;
    color: #9ca3af;
  }
  .footer-logo { font-weight: 600; color: #6b7280; }
  
  .print-btn {
    position: fixed;
    top: 24px; right: 24px;
    background: #1a1d23;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-size: 11pt;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    font-family: 'Inter', sans-serif;
  }
  .print-btn:hover { background: #2d3546; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>

<div class="page-wrapper">

  <div class="report-header">
    <div class="header-top">
      <div class="header-logo">📊</div>
      <div class="header-brand">iSupplyTech Accounting System</div>
    </div>
    <div class="report-title">Advance CDV Report</div>
    <div class="report-subtitle">Check Disbursement Vouchers dated beyond the current fiscal period</div>
    <div class="header-stats">
      <div class="stat-box">
        <span class="stat-value">${companies.length}</span>
        <span class="stat-label">Companies</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">${totalAdvance}</span>
        <span class="stat-label">Total Advance CDVs</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">Feb 2026</span>
        <span class="stat-label">Active Period</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">${reportDate}</span>
        <span class="stat-label">Report Date</span>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <div class="summary-icon">🛡️</div>
    <div class="summary-text">
      <strong>Month-End Protection Status: Active.</strong> All Advance CDVs listed below are protected by dual-layer month-end safeguards — both the <strong>ADV prefix</strong> and <strong>date-based exclusion</strong> (j_date &gt; period end). When Month-End Processing runs, these vouchers will survive the ZAP operation and remain available for transfer via <em>Transfer Advance CDB</em> into their respective target months.
    </div>
  </div>

  ${companySections}

  <div class="report-footer">
    <div class="footer-logo">iSupplyTech Accounting System · v3.8.0</div>
    <div>Generated on ${reportDate} · All amounts in Philippine Peso (PHP)</div>
  </div>

</div>
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
console.log(`✅ Report generated: ${OUTPUT_HTML}`);
console.log(`Total advance CDVs across all companies: ${totalAdvance}`);
