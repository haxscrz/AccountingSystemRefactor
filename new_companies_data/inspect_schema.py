import sqlite3, struct, os, sys
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

db_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get all FS table schemas
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'fs_%' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print("FS Tables:", tables)

for t in tables:
    cur.execute(f"PRAGMA table_info({t})")
    cols = cur.fetchall()
    print(f"\n{t}:")
    for c in cols:
        print(f"  {c[1]:20} {c[2]:10} {'NOT NULL' if c[3] else 'NULL':>8}  pk={c[5]}")
    # Count records for existing company
    cur.execute(f"SELECT COUNT(*) FROM {t} WHERE company_code='gian'")
    cnt = cur.fetchone()[0]
    print(f"  (gian has {cnt} records)")

conn.close()
