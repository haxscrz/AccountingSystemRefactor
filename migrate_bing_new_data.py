"""
migrate_bing_new_data.py  (v2 — schema-corrected)
Reads Bing's legacy FoxPro DBF files and writes them into accounting_v8.db.
"""
import os, sys, sqlite3, zipfile, tempfile, shutil
from datetime import datetime
from dbfread import DBF

BASE_DIR = r"d:\DOWNLOADS\Accounting System\new_companies_data\Bing's data from other FS system"
DB_PATH  = r"d:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db"

COMPANIES = {
    '3jcrt': {'data': '3JCRTData.zip', 'feb': '3JCRT202602.zip'},
    'gian':  {'data': 'GIANData.zip',  'feb': 'GIAN202602.zip'},
    'jimi':  {'data': 'JIMIData.zip',  'feb': 'JIMI202602.zip'},
    'lmjay': {'data': 'LMJAYData.zip', 'feb': 'LMJAY202602.zip'},
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
    if path is None or not os.path.exists(path):
        return []
    try:
        table = DBF(path, load=True)
        rows = []
        for rec in table:
            row = {k: v.strip() if isinstance(v, str) else v for k, v in rec.items()}
            rows.append(row)
        return rows
    except Exception as e:
        print(f"  WARN: Could not read {path}: {e}")
        return []

def d(val):
    """Format date."""
    if val is None: return '0001-01-01'
    if isinstance(val, str): return val[:10] if len(val) >= 10 else val
    try: return val.strftime('%Y-%m-%d')
    except: return '0001-01-01'

def n(val):
    """To float."""
    try: return float(val or 0)
    except: return 0.0

def s(val):
    """To string."""
    return str(val or '').strip()

def migrate_company(conn, code, info):
    print(f"\n{'='*60}")
    print(f"  {code.upper()}")
    print(f"{'='*60}")

    tmpdir = os.path.join(tempfile.gettempdir(), f'bing_v2_{code}')
    data_dir = extract_zip(os.path.join(BASE_DIR, info['data']), os.path.join(tmpdir, 'data'))
    feb_dir  = extract_zip(os.path.join(BASE_DIR, info['feb']),  os.path.join(tmpdir, 'feb'))

    c = conn.cursor()

    # ── 0. CLEAR ────────────────────────────────────────────────
    for t in ('fs_accounts','fs_checkmas','fs_checkvou','fs_cashrcpt',
              'fs_salebook','fs_journals','fs_purcbook','fs_adjstmnt',
              'fs_pournals','fs_effects','fs_schedule','fs_banks','fs_sys_id'):
        try: c.execute(f"DELETE FROM {t} WHERE company_code=?", (code,))
        except: pass
    conn.commit()

    # ── 1. ACCOUNTS (from Feb) ──────────────────────────────────
    for rec in read_dbf(find_dbf(feb_dir, 'ACCOUNTS.DBF')):
        ac = s(rec.get('ACCT_CODE'))
        if not ac: continue
        ob = n(rec.get('OPEN_BAL')); cd = n(rec.get('CUR_DEBIT')); cc = n(rec.get('CUR_CREDIT'))
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
    print(f"  accounts:  {c.execute('SELECT COUNT(*) FROM fs_accounts WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 2. CHECKMAS (Feb + Advance from Data) ──────────────────
    for rec in read_dbf(find_dbf(feb_dir, 'CHECKMAS.DBF')) + read_dbf(find_dbf(data_dir, 'ACHECKMA.DBF')):
        jv = s(rec.get('J_JV_NO')); ck = s(rec.get('J_CK_NO'))
        if not jv and not ck: continue
        c.execute("""INSERT INTO fs_checkmas
            (j_jv_no,j_ck_no,j_date,j_pay_to,j_ck_amt,j_desc,bank_no,sup_no,
             created_at,updated_at,is_deleted,company_code)
            VALUES (?,?,?,?,?,?,0,0,?,?,0,?)""",
            (jv, ck, d(rec.get('J_DATE')), s(rec.get('J_PAY_TO')),
             n(rec.get('J_CK_AMT')), s(rec.get('J_DESC','')),
             NOW, NOW, code))
    print(f"  checkmas:  {c.execute('SELECT COUNT(*) FROM fs_checkmas WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 3. CHECKVOU (Feb + Advance from Data) ──────────────────
    for rec in read_dbf(find_dbf(feb_dir, 'CHECKVOU.DBF')) + read_dbf(find_dbf(data_dir, 'ACHECKVO.DBF')):
        ck = s(rec.get('J_CK_NO')); ac = s(rec.get('ACCT_CODE'))
        if not ck or not ac: continue
        c.execute("""INSERT INTO fs_checkvou
            (j_ck_no,acct_code,j_ck_amt,j_d_or_c,created_at,updated_at,is_deleted,company_code)
            VALUES (?,?,?,?,?,?,0,?)""",
            (ck, ac, n(rec.get('J_CK_AMT')), s(rec.get('J_D_OR_C')), NOW, NOW, code))
    print(f"  checkvou:  {c.execute('SELECT COUNT(*) FROM fs_checkvou WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 4–8. Transaction tables (simple j_jv_no/j_date/acct_code/j_ck_amt/j_d_or_c) ──
    simple_tables = [
        ('fs_cashrcpt', 'CASHRCPT.DBF', feb_dir),
        ('fs_salebook', 'SALEBOOK.DBF', feb_dir),
        ('fs_journals', 'JOURNALS.DBF', feb_dir),
        ('fs_purcbook', 'PURCBOOK.DBF', feb_dir),
        ('fs_adjstmnt', 'ADJSTMNT.DBF', feb_dir),
    ]
    for tbl, dbf_name, src_dir in simple_tables:
        for rec in read_dbf(find_dbf(src_dir, dbf_name)):
            c.execute(f"""INSERT INTO {tbl}
                (j_jv_no,j_date,acct_code,j_ck_amt,j_d_or_c,created_at,updated_at,is_deleted,company_code)
                VALUES (?,?,?,?,?,?,?,0,?)""",
                (s(rec.get('J_JV_NO')), d(rec.get('J_DATE')), s(rec.get('ACCT_CODE')),
                 n(rec.get('J_CK_AMT')), s(rec.get('J_D_OR_C')), NOW, NOW, code))
        cnt = c.execute(f'SELECT COUNT(*) FROM {tbl} WHERE company_code=?',(code,)).fetchone()[0]
        print(f"  {tbl.replace('fs_',''):10s} {cnt}")

    # ── 9. EFFECTS ──────────────────────────────────────────────
    for rec in read_dbf(find_dbf(feb_dir, 'EFFECTS.DBF')):
        c.execute("""INSERT INTO fs_effects (gl_report,gl_effect,gl_head,company_code)
            VALUES (?,?,?,?)""",
            (s(rec.get('GL_REPORT')), s(rec.get('GL_EFFECT')), s(rec.get('GL_HEAD')), code))
    print(f"  effects:   {c.execute('SELECT COUNT(*) FROM fs_effects WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 10. SCHEDULE ────────────────────────────────────────────
    for rec in read_dbf(find_dbf(feb_dir, 'SCHEDULE.DBF')):
        c.execute("""INSERT INTO fs_schedule (gl_head,acct_code,company_code)
            VALUES (?,?,?)""",
            (s(rec.get('GL_HEAD')), s(rec.get('ACCT_CODE')), code))
    print(f"  schedule:  {c.execute('SELECT COUNT(*) FROM fs_schedule WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 11. BANKS ───────────────────────────────────────────────
    for rec in read_dbf(find_dbf(data_dir, 'BANKS.DBF')):
        bn = s(rec.get('BANK_NAME'))
        if not bn: continue
        c.execute("""INSERT INTO fs_banks (bank_no,bank_name,bank_addr,bank_acct,company_code)
            VALUES (?,?,?,?,?)""",
            (int(rec.get('BANK_NO',0) or 0), bn, s(rec.get('BANK_ADDR','')), s(rec.get('BANK_ACCT','')), code))
    print(f"  banks:     {c.execute('SELECT COUNT(*) FROM fs_banks WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 12. POURNALS (from Feb) ─────────────────────────────────
    for rec in read_dbf(find_dbf(feb_dir, 'POURNALS.DBF')):
        c.execute("""INSERT INTO fs_pournals (j_jv_no,j_date,acct_code,j_ck_amt,j_d_or_c,created_at,company_code)
            VALUES (?,?,?,?,?,?,?)""",
            (s(rec.get('J_JV_NO')), d(rec.get('J_DATE')), s(rec.get('ACCT_CODE')),
             n(rec.get('J_CK_AMT')), s(rec.get('J_D_OR_C')), NOW, code))
    print(f"  pournals:  {c.execute('SELECT COUNT(*) FROM fs_pournals WHERE company_code=?',(code,)).fetchone()[0]}")

    # ── 13. SYS_ID ──────────────────────────────────────────────
    c.execute("""INSERT INTO fs_sys_id (pres_mo,pres_yr,beg_date,end_date,updated_at,company_code)
        VALUES (2,2026,'2026-02-01','2026-02-28',?,?)""", (NOW, code))

    conn.commit()
    print(f"  ✅ Done")

def verify(conn):
    print(f"\n{'='*60}")
    print(f"  VERIFICATION")
    print(f"{'='*60}")
    c = conn.cursor()
    expected = {
        '3jcrt': {'tb': 5952044.81, 'assets': 14480522.46},
        'gian':  {'tb': 4942418.55, 'assets': 10589496.19},
        'jimi':  {'tb': 9512615.92, 'assets': 19358506.18},
        'lmjay': {'tb': 10314488.85,'assets': 19046860.89},
    }
    ok = True
    for code, exp in expected.items():
        tb = c.execute("SELECT SUM(CAST(cur_debit AS REAL)) FROM fs_accounts WHERE company_code=?",(code,)).fetchone()[0] or 0
        assets = c.execute("""SELECT SUM(
            CASE WHEN formula='DC' THEN CAST(open_bal AS REAL)+CAST(cur_debit AS REAL)-CAST(cur_credit AS REAL)
                 ELSE CAST(open_bal AS REAL)+CAST(cur_credit AS REAL)-CAST(cur_debit AS REAL) END
            ) FROM fs_accounts WHERE company_code=? AND gl_report LIKE 'BA%'""",(code,)).fetchone()[0] or 0
        t_ok = abs(tb - exp['tb']) < 0.02
        a_ok = abs(assets - exp['assets']) < 0.02
        sym = "✅" if t_ok and a_ok else "❌"
        if not (t_ok and a_ok): ok = False
        print(f"  {code.upper():6s} {sym}  TB={tb:>14,.2f} (exp {exp['tb']:>14,.2f})  Assets={assets:>14,.2f} (exp {exp['assets']:>14,.2f})")
    return ok

if __name__ == '__main__':
    backup = DB_PATH + f".bak_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(DB_PATH, backup)
    print(f"  Backed up DB -> {os.path.basename(backup)}")

    conn = sqlite3.connect(DB_PATH)
    for code, info in COMPANIES.items():
        migrate_company(conn, code, info)

    if verify(conn):
        print(f"\n  🎉 ALL 4 COMPANIES MATCH BING'S LEGACY DATA!")
    else:
        print(f"\n  ⚠️ SOME MISMATCHES — CHECK OUTPUT ABOVE")
    conn.close()
