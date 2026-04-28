// fix_advance_cdvs.js
// Fixes all broken advance CDVs in accounting_v6.db:
// 1. Sets correct fs_sys_id (February 2026) for all 5 companies
// 2. Prefixes all future-dated checks with ADV so ZAP logic protects them

const { execSync } = require('child_process');
const DB = 'd:/DOWNLOADS/Accounting System/web-system/server/AccountingApi/accounting_v6.db';

function sql(query) {
  try {
    const result = execSync(`sqlite3 "${DB}" "${query.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    console.error('SQL Error:', e.message);
    throw e;
  }
}

// ========================================================
// STEP 1: Insert correct fs_sys_id for all 5 companies
// Active period = February 2026 (the earliest check month)
// ========================================================
console.log('\n=== STEP 1: Setting fs_sys_id for all companies ===');

const companies = [
  { code: 'gian',     mo: 2, yr: 2026, beg: '2026-02-01', end: '2026-02-28' },
  { code: '3jcrt',   mo: 2, yr: 2026, beg: '2026-02-01', end: '2026-02-28' },
  { code: 'jimi',    mo: 2, yr: 2026, beg: '2026-02-01', end: '2026-02-28' },
  { code: 'lmjay',   mo: 2, yr: 2026, beg: '2026-02-01', end: '2026-02-28' },
  { code: 'thermalex', mo: 2, yr: 2026, beg: '2026-02-01', end: '2026-02-28' },
];

for (const c of companies) {
  // Delete any existing (stale) sys_id rows
  sql(`DELETE FROM fs_sys_id WHERE company_code='${c.code}'`);
  // Insert exactly one correct row
  sql(`INSERT INTO fs_sys_id (pres_mo, pres_yr, beg_date, end_date, updated_at, company_code) VALUES (${c.mo}, ${c.yr}, '${c.beg}', '${c.end}', datetime('now'), '${c.code}')`);
  console.log(`✓ ${c.code}: period set to ${c.mo}/${c.yr}`);
}

// ========================================================
// STEP 2: Prefix all future-dated checks with ADV
// A check is an "advance" if j_date > the company's end_date (Feb 28, 2026)
// These companies are all on February 2026 (end = 2026-02-28)
// ========================================================
console.log('\n=== STEP 2: Fixing advance CDVs (adding ADV prefix) ===');

const PERIOD_END = '2026-02-28';

for (const c of companies) {
  // Find all advance checks (future-dated, no ADV prefix yet)
  const rows = sql(`SELECT id, j_ck_no, j_jv_no FROM fs_checkmas WHERE company_code='${c.code}' AND j_date > '${PERIOD_END}' AND j_ck_no NOT LIKE 'ADV%'`);
  
  if (!rows) {
    console.log(`  ${c.code}: No broken advance CDVs found ✓`);
    continue;
  }

  const lines = rows.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const [id, j_ck_no, j_jv_no] = line.split('|');
    const newCkNo = `ADV${j_ck_no}`;
    const newJvNo = j_jv_no && !j_jv_no.startsWith('ADV') ? `ADV${j_jv_no}` : j_jv_no;
    
    // Update fs_checkmas
    sql(`UPDATE fs_checkmas SET j_ck_no='${newCkNo}', j_jv_no='${newJvNo}' WHERE id=${id} AND company_code='${c.code}'`);
    // Update fs_checkvou to match the new check number
    sql(`UPDATE fs_checkvou SET j_ck_no='${newCkNo}' WHERE j_ck_no='${j_ck_no}' AND company_code='${c.code}'`);
    
    console.log(`  ${c.code}: ${j_ck_no} → ${newCkNo} (jv: ${j_jv_no} → ${newJvNo})`);
  }
}

// ========================================================
// STEP 3: Verify final state
// ========================================================
console.log('\n=== STEP 3: Verification ===');

for (const c of companies) {
  const period = sql(`SELECT pres_mo || '/' || pres_yr FROM fs_sys_id WHERE company_code='${c.code}' LIMIT 1`);
  const currentChecks = sql(`SELECT COUNT(*) FROM fs_checkmas WHERE company_code='${c.code}' AND j_ck_no NOT LIKE 'ADV%'`);
  const advanceChecks = sql(`SELECT COUNT(*) FROM fs_checkmas WHERE company_code='${c.code}' AND j_ck_no LIKE 'ADV%'`);
  const advDetails = sql(`SELECT j_ck_no, j_date FROM fs_checkmas WHERE company_code='${c.code}' AND j_ck_no LIKE 'ADV%' ORDER BY j_date`);
  
  console.log(`\n  ${c.code.toUpperCase()}:`);
  console.log(`    Period: ${period || 'NOT SET'}`);
  console.log(`    Current-period checks (non-ADV): ${currentChecks}`);
  console.log(`    Advance CDVs (ADV prefix): ${advanceChecks}`);
  if (advDetails) {
    advDetails.split('\n').filter(l=>l).forEach(l => console.log(`      → ${l}`));
  }
}

console.log('\n✅ All done! accounting_v6.db is fixed.');
