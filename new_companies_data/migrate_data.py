"""
Migrate all FS data for kote, jemt, rcmi, jasc from accounting_v9.db to accounting_v8.db.
Copies all records from all fs_* tables for these 4 company codes.
"""
import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

src_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v9.db'
dst_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db'

companies = ['kote', 'jemt', 'rcmi', 'jasc']

# FS tables to migrate (order matters for foreign key deps)
fs_tables = [
    'fs_accounts', 'fs_adjstmnt', 'fs_banks', 'fs_cashrcpt',
    'fs_checkmas', 'fs_checkvou', 'fs_effects', 'fs_journals',
    'fs_pournals', 'fs_purcbook', 'fs_salebook', 'fs_schedule',
    'fs_signatories', 'fs_supplier', 'fs_sys_id'
]

src_conn = sqlite3.connect(src_path)
dst_conn = sqlite3.connect(dst_path)

total_migrated = 0

for table in fs_tables:
    # Get column names from source
    src_cur = src_conn.cursor()
    src_cur.execute(f"PRAGMA table_info({table})")
    all_cols = [row[1] for row in src_cur.fetchall()]
    
    # Skip Id column (auto-increment)
    cols = [c for c in all_cols if c != 'Id']
    
    for company in companies:
        # First delete any existing records for this company in destination
        dst_conn.execute(f"DELETE FROM {table} WHERE company_code = ?", (company,))
        
        # Read from source
        src_cur.execute(f"SELECT {','.join(cols)} FROM {table} WHERE company_code = ?", (company,))
        rows = src_cur.fetchall()
        
        if rows:
            placeholders = ','.join(['?'] * len(cols))
            dst_conn.executemany(
                f"INSERT INTO {table} ({','.join(cols)}) VALUES ({placeholders})",
                rows
            )
            total_migrated += len(rows)
            print(f"  {table:20} | {company:6} | {len(rows):4} records migrated")

dst_conn.commit()

# Also check for additional tables: fs_acheckma, fs_acheckvo  
for table in ['fs_acheckma', 'fs_acheckvo']:
    try:
        src_cur = src_conn.cursor()
        src_cur.execute(f"PRAGMA table_info({table})")
        info = src_cur.fetchall()
        if info:
            cols = [row[1] for row in info if row[1] != 'Id']
            for company in companies:
                dst_conn.execute(f"DELETE FROM {table} WHERE company_code = ?", (company,))
                src_cur.execute(f"SELECT {','.join(cols)} FROM {table} WHERE company_code = ?", (company,))
                rows = src_cur.fetchall()
                if rows:
                    placeholders = ','.join(['?'] * len(cols))
                    dst_conn.executemany(
                        f"INSERT INTO {table} ({','.join(cols)}) VALUES ({placeholders})",
                        rows
                    )
                    total_migrated += len(rows)
                    print(f"  {table:20} | {company:6} | {len(rows):4} records migrated")
    except Exception as e:
        print(f"  {table}: skipped ({e})")

dst_conn.commit()

# Verify
print(f"\n{'='*60}")
print(f"TOTAL RECORDS MIGRATED: {total_migrated}")
print(f"{'='*60}")

# Verify counts
dst_cur = dst_conn.cursor()
for table in fs_tables:
    for company in companies:
        dst_cur.execute(f"SELECT COUNT(*) FROM {table} WHERE company_code = ?", (company,))
        cnt = dst_cur.fetchone()[0]
        if cnt > 0:
            # Also check source count
            src_conn.cursor().execute(f"SELECT COUNT(*) FROM {table} WHERE company_code = ?", (company,))
            src_cnt = src_conn.cursor().fetchone()[0]
            status = "OK" if cnt == src_cnt else f"MISMATCH (src={src_cnt})"
            print(f"  {table:20} | {company:6} | dst={cnt:4} | {status}")

src_conn.close()
dst_conn.close()
print("\nMigration complete!")
