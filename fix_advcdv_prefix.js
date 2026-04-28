// fix_advcdv_prefix.js
// Renames ADVCDV###### → ADV###### in fs_checkmas and fs_checkvou
// ADVB###### is intentional (B is part of thermalex's check number format) — leave as-is

const { execSync } = require('child_process');
const DB = 'd:/DOWNLOADS/Accounting System/web-system/server/AccountingApi/accounting_v8.db';

function sql(query) {
  return execSync(`sqlite3 "${DB}" "${query.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
}

// Find all ADVCDV##### entries across all companies
const rows = sql(`SELECT id, company_code, j_ck_no, j_jv_no FROM fs_checkmas WHERE j_ck_no LIKE 'ADVCDV%'`);

if (!rows) {
  console.log('No ADVCDV entries found — already clean.');
  process.exit(0);
}

let fixed = 0;
for (const line of rows.split('\n').filter(l => l.trim())) {
  const [id, company, ckNo, jvNo] = line.split('|');

  // ADVCDV183028 → ADV183028  (strip the CDV part, keep only ADV + numeric ID)
  const newCkNo = ckNo.replace(/^ADVCDV/, 'ADV');
  const newJvNo = jvNo && jvNo.startsWith('ADVCDV') ? jvNo.replace(/^ADVCDV/, 'ADV') : jvNo;

  // Update checkmas
  sql(`UPDATE fs_checkmas SET j_ck_no='${newCkNo}', j_jv_no='${newJvNo}' WHERE id=${id} AND company_code='${company}'`);
  // Update checkvou (must match on old ck_no)
  sql(`UPDATE fs_checkvou SET j_ck_no='${newCkNo}' WHERE j_ck_no='${ckNo}' AND company_code='${company}'`);

  console.log(`  [${company}] ${ckNo} → ${newCkNo}`);
  fixed++;
}

console.log(`\n✅ Fixed ${fixed} check numbers.`);

// Verify final state
console.log('\n=== Final ADV check numbers per company ===');
const allAdv = sql(`SELECT company_code, j_ck_no, j_date FROM fs_checkmas WHERE j_ck_no LIKE 'ADV%' ORDER BY company_code, j_date`);
allAdv.split('\n').filter(l=>l).forEach(l => console.log(' ', l));
