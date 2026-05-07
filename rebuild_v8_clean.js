// rebuild_v8_clean.js
// Builds accounting_v8.db: 
//   Start from v7 (all companies intact)
//   Wipe ALL Gian tables (checkmas, journals, cashrcpt, salebook, purcbook, adjstmnt, checkvou, pournals, sys_id)
//   Restore from the raw backup (exact original data, no changes)
//   Then apply ADV prefix to future-dated checks (> Feb 28 2026)
//   Then set correct fs_sys_id (Feb 2026)

const { execSync } = require('child_process');
const fs = require('fs');

const SRC  = 'd:/DOWNLOADS/Accounting System/web-system/server/AccountingApi/accounting_v7.db';
const BKUP = 'd:/DOWNLOADS/Accounting System/bing_old_database/accounting_backup_gian_20260427_1159.db';
const DEST = 'd:/DOWNLOADS/Accounting System/web-system/server/AccountingApi/accounting_v8.db';

function sql(db, query) {
  const q = query.replace(/\n/g, ' ').replace(/"/g, '\\"');
  return execSync(`sqlite3 "${db}" "${q}"`, { encoding: 'utf8' }).trim();
}

// Step 1: Copy v7 → v8
fs.copyFileSync(SRC.replace(/\//g, '\\'), DEST.replace(/\//g, '\\'));
console.log('✓ Copied v7 → v8');

// Step 2: Wipe ALL Gian data from v8
const tables = ['fs_checkmas','fs_checkvou','fs_cashrcpt','fs_salebook','fs_purcbook','fs_adjstmnt','fs_journals','fs_pournals','fs_sys_id'];
for (const t of tables) {
  sql(DEST, `DELETE FROM ${t} WHERE company_code='gian'`);
  console.log(`  Cleared ${t} for gian`);
}

// Step 3: Restore from backup (attach + INSERT SELECT)
for (const t of tables) {
  sql(DEST, `ATTACH DATABASE '${BKUP.replace(/\\/g,'/')}' AS bk; INSERT INTO main.${t} SELECT * FROM bk.${t} WHERE company_code='gian'`);
  const count = sql(DEST, `SELECT COUNT(*) FROM ${t} WHERE company_code='gian'`);
  console.log(`  Restored ${t}: ${count} rows`);
}

// Step 4: Verify what we have before ADV fix
console.log('\n--- Checks in restored data ---');
const checks = sql(DEST, "SELECT j_ck_no, j_date FROM fs_checkmas WHERE company_code='gian' ORDER BY j_date ASC");
checks.split('\n').filter(l=>l).forEach(l=>console.log(' ',l));

// Step 5: Apply ADV prefix to all checks dated after Feb 28 2026 (advance CDVs)
const PERIOD_END = '2026-02-28 23:59:59';
console.log('\n--- Applying ADV prefix to future-dated checks ---');
const advRows = sql(DEST, `SELECT id, j_ck_no, j_jv_no FROM fs_checkmas WHERE company_code='gian' AND j_date > '${PERIOD_END}' AND j_ck_no NOT LIKE 'ADV%'`);
let advCount = 0;
if (advRows) {
  for (const line of advRows.split('\n').filter(l=>l.trim())) {
    const [id, ck, jv] = line.split('|');
    const newCk = `ADV${ck}`;
    const newJv = jv && !jv.startsWith('ADV') ? `ADV${jv}` : jv;
    sql(DEST, `UPDATE fs_checkmas SET j_ck_no='${newCk}', j_jv_no='${newJv}' WHERE id=${id} AND company_code='gian'`);
    sql(DEST, `UPDATE fs_checkvou SET j_ck_no='${newCk}' WHERE j_ck_no='${ck}' AND company_code='gian'`);
    console.log(`  ${ck} → ${newCk}`);
    advCount++;
  }
}
console.log(`  Total advance CDVs prefixed: ${advCount}`);

// Step 6: Set correct fs_sys_id (wipe all and insert exactly 1 correct row)
sql(DEST, `DELETE FROM fs_sys_id WHERE company_code='gian'`);
sql(DEST, `INSERT INTO fs_sys_id (pres_mo, pres_yr, beg_date, end_date, updated_at, company_code) VALUES (2, 2026, '2026-02-01', '2026-02-28', datetime('now'), 'gian')`);
console.log('\n✓ fs_sys_id set to February 2026');

// Step 7: Final verification
console.log('\n=== FINAL VERIFICATION ===');
console.log('Period:', sql(DEST, "SELECT pres_mo || '/' || pres_yr FROM fs_sys_id WHERE company_code='gian' LIMIT 1"));
console.log('checkmas total:', sql(DEST, "SELECT COUNT(*) FROM fs_checkmas WHERE company_code='gian'"));
console.log('  current (non-ADV):', sql(DEST, "SELECT COUNT(*) FROM fs_checkmas WHERE company_code='gian' AND j_ck_no NOT LIKE 'ADV%'"));
console.log('  advance (ADV):', sql(DEST, "SELECT COUNT(*) FROM fs_checkmas WHERE company_code='gian' AND j_ck_no LIKE 'ADV%'"));
console.log('cashrcpt:', sql(DEST, "SELECT COUNT(*) FROM fs_cashrcpt WHERE company_code='gian'"));
console.log('salebook:', sql(DEST, "SELECT COUNT(*) FROM fs_salebook WHERE company_code='gian'"));
console.log('journals:', sql(DEST, "SELECT COUNT(*) FROM fs_journals WHERE company_code='gian'"));
console.log('purcbook:', sql(DEST, "SELECT COUNT(*) FROM fs_purcbook WHERE company_code='gian'"));
console.log('adjstmnt:', sql(DEST, "SELECT COUNT(*) FROM fs_adjstmnt WHERE company_code='gian'"));
console.log('pournals:', sql(DEST, "SELECT COUNT(*) FROM fs_pournals WHERE company_code='gian'"));

// Total unposted = current checks + journals + cashrcpt + salebook
const currentChecks = parseInt(sql(DEST, "SELECT COUNT(*) FROM fs_checkmas WHERE company_code='gian' AND j_ck_no NOT LIKE 'ADV%'"));
const journals = parseInt(sql(DEST, "SELECT COUNT(*) FROM fs_journals WHERE company_code='gian'"));
const cash = parseInt(sql(DEST, "SELECT COUNT(*) FROM fs_cashrcpt WHERE company_code='gian'"));
const sales = parseInt(sql(DEST, "SELECT COUNT(*) FROM fs_salebook WHERE company_code='gian'"));
console.log(`\nExpected dashboard unposted count: ${currentChecks} checks + ${journals} journals + ${cash} cash + ${sales} sales = ${currentChecks+journals+cash+sales}`);
console.log('\n✅ accounting_v8.db is ready!');
