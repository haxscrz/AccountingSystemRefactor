import sqlite3, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
db_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v9.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print('Tables:', tables)
if 'app_users' in tables:
    cur.execute('SELECT * FROM app_users LIMIT 5')
    cols = [d[0] for d in cur.description]
    print('Columns:', cols)
    for row in cur.fetchall():
        print(dict(zip(cols, row)))
if 'app_companies' in tables:
    cur.execute('SELECT * FROM app_companies')
    cols = [d[0] for d in cur.description]
    print('\nCompanies:')
    for row in cur.fetchall():
        print(dict(zip(cols, row)))
conn.close()
