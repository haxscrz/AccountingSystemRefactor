import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
conn = sqlite3.connect(r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db')
cur = conn.cursor()
tables = ['fs_accounts','fs_adjstmnt','fs_banks','fs_cashrcpt','fs_checkmas','fs_checkvou','fs_effects','fs_journals','fs_pournals','fs_purcbook','fs_salebook','fs_schedule','fs_supplier','fs_sys_id']
companies = ['kote','jemt','rcmi','jasc']
header = f"{'Table':20} {'kote':>6} {'jemt':>6} {'rcmi':>6} {'jasc':>6}"
print(header)
print('-'*50)
for t in tables:
    counts = []
    for c in companies:
        cur.execute(f'SELECT COUNT(*) FROM {t} WHERE company_code=?', (c,))
        counts.append(cur.fetchone()[0])
    if any(counts):
        print(f'{t:20} {counts[0]:6} {counts[1]:6} {counts[2]:6} {counts[3]:6}')
print()
for c in companies:
    cur.execute('SELECT pres_mo, pres_yr, beg_date, end_date FROM fs_sys_id WHERE company_code=?', (c,))
    r = cur.fetchone()
    if r:
        print(f'{c}: month={r[0]}, year={r[1]}, dates={r[2]} to {r[3]}')
conn.close()
print("\nAll data verified!")
