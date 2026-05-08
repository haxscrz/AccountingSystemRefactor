"""
migrate_bing_new_data.py (v3 — Transaction-Authored)
Forces account balances to match the POURNALS.DBF transaction totals.
This ensures perfect parity with Bing's legacy system and guarantees a balanced Trial Balance.
"""
import os, sys, sqlite3, zipfile, tempfile, shutil
from datetime import datetime
from dbfread import DBF

BASE_DIR = r"d:\DOWNLOADS\Accounting System\new_companies_data\Bing's data from other FS system"
DB_PATH  = r"d:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db"

COMPANIES = {
    '3jcrt': {'data': '3JCRTData.zip', 'feb': '3JCRT202602.zip', 'target_tb': 5952044.81},
    'gian':  {'data': 'GIANData.zip',  'feb': 'GIAN202602.zip',  'target_tb': 4942418.55},
    'jimi':  {'data': 'JIMIData.zip',  'feb': 'JIMI202602.zip',  'target_tb': 9512615.92},
    'lmjay': {'data': 'LMJAYData.zip', 'feb': 'LMJAY202602.zip', 'target_tb': 10314488.85},
}

NOW = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def extract_zip(zip_path, target_dir):
    os.makedirs(target_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(target_dir)
    return target_dir

def find_dbf(directory, name):
    for root, _, files in os.walk(directory):
        for f in files:
            if f.upper() == name.upper():
                return os.path.join(root, f)
    return None

def read_dbf(path):
    if path is None or not os.path.exists(path): return []
    try:
        table = DBF(path, load=True)
        return [{k: v.strip() if isinstance(v, str) else v for k, v in rec.items()} for rec in table]
    except Exception as e:
        print(f"  WARN: {path}: {e}")
        return []

def d(val):
    if val is None: return '0001-01-01'
    if isinstance(val, str): return val[:10] if len(val) >= 10 else val
    try: return val.strftime('%Y-%m-%d')
    except: return '0001-01-01'

def n(val):
    try: return float(val or 0)
    except: return 0.0

def s(val): return str(val or '').strip()

def migrate_company(conn, code, info):
    print(f"\n=== {code.upper()} ===")
    tmpdir = os.path.join(tempfile.gettempdir(), f'bing_v3_{code}')
    data_dir = extract_zip(os.path.join(BASE_DIR, info['data']), os.path.join(tmpdir, 'data'))
    feb_dir  = extract_zip(os.path.join(BASE_DIR, info['feb']),  os.path.join(tmpdir, 'feb'))

    c = conn.cursor()

    # 1. Clear tables
    for t in ('fs_accounts','fs_checkmas','fs_checkvou','fs_cashrcpt',
              'fs_salebook','fs_journals','fs_purcbook','fs_adjstmnt',
              'fs_pournals','fs_effects','fs_schedule','fs_banks','fs_sys_id'):
        try: c.execute(f"DELETE FROM {t} WHERE company_code=?", (code,))
        except: pass
    conn.commit()

    # 2. Extract balanced transaction summaries from POURNALS.DBF
    # This is the secret to matching Bing's numbers exactly.
    pournals_dbf = find_dbf(feb_dir, 'POURNALS.DBF')
    pournals = read_dbf(pournals_dbf)
    
    acct_movement = {} # acct -> {'D': sum, 'C': sum}
    for rec in pournals:
        ac = s(rec.get('ACCT_CODE'))
        amt = n(rec.get('J_CK_AMT'))
        side = s(rec.get('J_D_OR_C')).upper()
        if ac not in acct_movement: acct_movement[ac] = {'D': 0.0, 'C': 0.0}
        acct_movement[ac][side] += amt
        
        # Save to fs_pournals
        c.execute("""INSERT INTO fs_pournals (j_jv_no, j_date, acct_code, j_ck_amt, j_d_or_c, created_at, company_code)
                     VALUES (?,?,?,?,?,?,?)""",
                  (s(rec.get('J_JV_NO')), d(rec.get('J_DATE')), ac, amt, side, NOW, code))

    # 3. Import Accounts with corrected movements
    for rec in read_dbf(find_dbf(feb_dir, 'ACCOUNTS.DBF')):
        ac = s(rec.get('ACCT_CODE'))
        if not ac: continue
        
        # Use movement from POURNALS instead of whatever is in ACCOUNTS.DBF
        mov = acct_movement.get(ac, {'D': 0.0, 'C': 0.0})
        cd = mov['D']
        cc = mov['C']
        
        ob = n(rec.get('OPEN_BAL'))
        fm = s(rec.get('FORMULA')) or 'DC'
        eb = ob + cd - cc if fm == 'DC' else ob + cc - cd
        
        c.execute("""INSERT INTO fs_accounts
            (acct_code,acct_desc,acct_type,group_code,sub_group,formula,
             open_bal,cur_debit,cur_credit,end_bal,gl_report,gl_effect,schedule,
             initialize,is_active,created_at,updated_at,company_code)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)""",
            (ac, s(rec.get('ACCT_DESC')), s(rec.get('ACCT_TYPE')), s(rec.get('GROUP_CODE')),
             s(rec.get('SUB_GROUP')), fm, ob, cd, cc, eb,
             s(rec.get('GL_REPORT')), s(rec.get('GL_EFFECT')), s(rec.get('SCHEDULE')),
             1 if rec.get('INITIALIZE') else 0, NOW, NOW, code))

    # 4. Import Support Tables (Masters, etc.)
    # We import these for viewing but they won't affect the TB since we pre-calculated it
    for rec in read_dbf(find_dbf(feb_dir, 'CHECKMAS.DBF')) + read_dbf(find_dbf(data_dir, 'ACHECKMA.DBF')):
        c.execute("INSERT INTO fs_checkmas (j_jv_no,j_ck_no,j_date,j_pay_to,j_ck_amt,j_desc,bank_no,sup_no,created_at,updated_at,is_deleted,company_code) VALUES (?,?,?,?,?,?,0,0,?,?,0,?)",
                  (s(rec.get('J_JV_NO')), s(rec.get('J_CK_NO')), d(rec.get('J_DATE')), s(rec.get('J_PAY_TO')), n(rec.get('J_CK_AMT')), s(rec.get('J_DESC','')), NOW, NOW, code))
    
    # ... (Other tables remain same as v2 but included here for completeness)
    for rec in read_dbf(find_dbf(feb_dir, 'CHECKVOU.DBF')) + read_dbf(find_dbf(data_dir, 'ACHECKVO.DBF')):
        c.execute("INSERT INTO fs_checkvou (j_ck_no,acct_code,j_ck_amt,j_d_or_c,created_at,updated_at,is_deleted,company_code) VALUES (?,?,?,?,?,?,0,?)",
                  (s(rec.get('J_CK_NO')), s(rec.get('ACCT_CODE')), n(rec.get('J_CK_AMT')), s(rec.get('J_D_OR_C')), NOW, NOW, code))
    
    for tbl, dbf in [('fs_cashrcpt','CASHRCPT.DBF'),('fs_salebook','SALEBOOK.DBF'),('fs_journals','JOURNALS.DBF'),('fs_purcbook','PURCBOOK.DBF'),('fs_adjstmnt','ADJSTMNT.DBF')]:
        for rec in read_dbf(find_dbf(feb_dir, dbf)):
            c.execute(f"INSERT INTO {tbl} (j_jv_no,j_date,acct_code,j_ck_amt,j_d_or_c,created_at,updated_at,is_deleted,company_code) VALUES (?,?,?,?,?,?,?,0,?)",
                      (s(rec.get('J_JV_NO')), d(rec.get('J_DATE')), s(rec.get('ACCT_CODE')), n(rec.get('J_CK_AMT')), s(rec.get('J_D_OR_C')), NOW, NOW, code))

    for rec in read_dbf(find_dbf(feb_dir, 'EFFECTS.DBF')):
        c.execute("INSERT INTO fs_effects (gl_report,gl_effect,gl_head,company_code) VALUES (?,?,?,?)", (s(rec.get('GL_REPORT')), s(rec.get('GL_EFFECT')), s(rec.get('GL_HEAD')), code))
    
    for rec in read_dbf(find_dbf(feb_dir, 'SCHEDULE.DBF')):
        c.execute("INSERT INTO fs_schedule (gl_head,acct_code,company_code) VALUES (?,?,?)", (s(rec.get('GL_HEAD')), s(rec.get('ACCT_CODE')), code))
    
    for rec in read_dbf(find_dbf(data_dir, 'BANKS.DBF')):
        if not s(rec.get('BANK_NAME')): continue
        c.execute("INSERT INTO fs_banks (bank_no,bank_name,bank_addr,bank_acct,company_code) VALUES (?,?,?,?,?)", (int(rec.get('BANK_NO',0) or 0), s(rec.get('BANK_NAME')), s(rec.get('BANK_ADDR','')), s(rec.get('BANK_ACCT','')), code))

    c.execute("INSERT INTO fs_sys_id (pres_mo,pres_yr,beg_date,end_date,updated_at,company_code) VALUES (2,2026,'2026-02-01','2026-02-28',?,?)", (NOW, code))

    conn.commit()
    print(f"  ✅ {code.upper()} Migrated. TB Debit: {sum(m['D'] for m in acct_movement.values()):,.2f}")

def verify(conn):
    print(f"\n{'='*60}\n  FINAL VERIFICATION\n{'='*60}")
    c = conn.cursor()
    all_ok = True
    for code, info in COMPANIES.items():
        tb_d = c.execute("SELECT SUM(CAST(cur_debit AS REAL)) FROM fs_accounts WHERE company_code=?",(code,)).fetchone()[0] or 0
        tb_c = c.execute("SELECT SUM(CAST(cur_credit AS REAL)) FROM fs_accounts WHERE company_code=?",(code,)).fetchone()[0] or 0
        assets = c.execute("SELECT SUM(CASE WHEN formula='DC' THEN CAST(open_bal AS REAL)+CAST(cur_debit AS REAL)-CAST(cur_credit AS REAL) ELSE CAST(open_bal AS REAL)+CAST(cur_credit AS REAL)-CAST(cur_debit AS REAL) END) FROM fs_accounts WHERE company_code=? AND gl_report LIKE 'BA%'",(code,)).fetchone()[0] or 0
        t_ok = abs(tb_d - info['target_tb']) < 0.01 and abs(tb_d - tb_c) < 0.01
        if not t_ok: all_ok = False
        print(f"  {code.upper():6s} {'✅' if t_ok else '❌'}  TB={tb_d:>14,.2f}  (Balanced: {'Yes' if abs(tb_d-tb_c)<0.01 else 'NO'})  Assets={assets:>14,.2f}")
    return all_ok

if __name__ == '__main__':
    conn = sqlite3.connect(DB_PATH)
    for code, info in COMPANIES.items(): migrate_company(conn, code, info)
    if verify(conn): print(f"\n  🎉 SUCCESS! ALL DATA MATCHES BING'S EXPECTATIONS.")
    conn.close()
