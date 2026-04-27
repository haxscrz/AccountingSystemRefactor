# patch_gian_from_backup.ps1
# Builds accounting_v6.db by starting from v3 (all companies intact)
# then wiping Gian's transaction data and restoring it from the backup (v5).

$srcDb  = "d:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v3.db"
$backupDb = "d:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v5.db"
$destDb = "d:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v6.db"

# Start fresh from v3 (has all companies)
Copy-Item $srcDb $destDb -Force
Write-Host "Copied v3 -> v6"

# The tables that hold Gian's transaction + period data
$tables = @(
    "fs_checkmas",
    "fs_checkvou",
    "fs_cashrcpt",
    "fs_salebook",
    "fs_purcbook",
    "fs_adjstmnt",
    "fs_journals",
    "fs_pournals",
    "fs_sys_id"
)

# Step 1: Delete Gian's data from v6
foreach ($tbl in $tables) {
    $sql = "DELETE FROM $tbl WHERE company_code = 'gian';"
    sqlite3 $destDb $sql
    Write-Host "Cleared $tbl for gian in v6"
}

# Step 2: Attach backup and copy Gian's rows back in
$attachSql = @"
ATTACH DATABASE '$($backupDb.Replace('\','\\'))' AS backup;
"@

foreach ($tbl in $tables) {
    $copySql = "INSERT INTO main.$tbl SELECT * FROM backup.$tbl WHERE company_code = 'gian';"
    $fullSql = "ATTACH DATABASE '$($backupDb.Replace('\','\\'))' AS bk; INSERT INTO main.$tbl SELECT * FROM bk.$tbl WHERE company_code = 'gian';"
    sqlite3 $destDb $fullSql
    Write-Host "Restored $tbl for gian from backup into v6"
}

# Verify
$count = sqlite3 $destDb "SELECT COUNT(*) FROM fs_checkmas WHERE company_code='gian';"
$period = sqlite3 $destDb "SELECT pres_mo, pres_yr FROM fs_sys_id WHERE company_code='gian' LIMIT 1;"
Write-Host ""
Write-Host "=== VERIFICATION ==="
Write-Host "Gian checks in v6: $count"
Write-Host "Gian period (mo|yr): $period"

$otherCompanies = sqlite3 $destDb "SELECT DISTINCT company_code FROM fs_accounts WHERE company_code != 'gian';"
Write-Host "Other companies in fs_accounts: $otherCompanies"
Write-Host "Done! accounting_v6.db is ready."
