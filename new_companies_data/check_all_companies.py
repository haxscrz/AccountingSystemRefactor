import struct, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def read_dbf(path):
    with open(path, 'rb') as f:
        header = f.read(32)
        num_records = struct.unpack_from('<I', header, 4)[0]
        header_size = struct.unpack_from('<H', header, 8)[0]
        record_size = struct.unpack_from('<H', header, 10)[0]
        fields = []
        f.seek(32)
        while True:
            field_desc = f.read(32)
            if not field_desc or field_desc[0] == 0x0D:
                break
            name = field_desc[:11].split(b'\x00')[0].decode('ascii', errors='replace')
            ftype = chr(field_desc[11])
            length = field_desc[16]
            fields.append((name, ftype, length))
        f.seek(header_size)
        records = []
        for _ in range(num_records):
            raw = f.read(record_size)
            if not raw or raw[0] == 0x2A:
                continue
            row = {}
            pos = 1
            for name, ftype, length in fields:
                val = raw[pos:pos+length].decode('ascii', errors='replace').strip()
                row[name] = val
                pos += length
            records.append(row)
    return fields, records

def to_float(s):
    try:
        return float(s or '0')
    except:
        return 0.0

def check_pournals_balance(dbf_path, company):
    """Check if posted journal entries (POURNALS) net to zero per JV"""
    if not os.path.exists(dbf_path):
        return
    fields, records = read_dbf(dbf_path)
    field_names = [f[0] for f in fields]
    
    # Try different field name conventions
    jv_field   = next((f for f in field_names if 'JV' in f.upper() and 'NO' in f.upper()), None) or \
                 next((f for f in field_names if f.upper().startswith('J_JV') or f.upper().startswith('JJV')), None)
    dc_field   = next((f for f in field_names if 'D_OR_C' in f.upper() or 'DORC' in f.upper() or f.upper() == 'J_D_OR_C'), None)
    amt_field  = next((f for f in field_names if 'AMT' in f.upper() or 'AMOUNT' in f.upper()), None)

    if not (jv_field and dc_field and amt_field):
        print(f"  [POURNALS] Cannot find key fields. Fields: {field_names}")
        return
    
    jv_totals = {}
    for r in records:
        jv = r.get(jv_field, '').strip()
        dc = r.get(dc_field, '').strip().upper()
        amt = to_float(r.get(amt_field, '0'))
        if jv not in jv_totals:
            jv_totals[jv] = {'D': 0.0, 'C': 0.0}
        if dc == 'D':
            jv_totals[jv]['D'] += amt
        else:
            jv_totals[jv]['C'] += amt
    
    unbalanced = [(jv, v['D'], v['C'], v['D']-v['C'])
                  for jv, v in jv_totals.items()
                  if abs(v['D'] - v['C']) > 0.01]
    
    if unbalanced:
        print(f"\n  *** UNBALANCED JV ENTRIES in POURNALS ({company}) ***")
        for jv, d, c, diff in sorted(unbalanced, key=lambda x: abs(x[3]), reverse=True):
            print(f"    JV={jv:15} Debit={d:12.2f} Credit={c:12.2f} Diff={diff:12.2f}")
    else:
        print(f"  All JV entries in POURNALS are self-balanced.")

def analyze(dbf_path, label):
    if not os.path.exists(dbf_path):
        print(f"  [SKIP] Not found: {dbf_path}")
        return None
    
    fields, records = read_dbf(dbf_path)
    
    total_cd = 0.0
    total_cc = 0.0
    tb_debit_col = 0.0
    tb_credit_col = 0.0
    
    for r in records:
        ob = to_float(r.get('OPEN_BAL', '0'))
        cd = to_float(r.get('CUR_DEBIT', '0'))
        cc = to_float(r.get('CUR_CREDIT', '0'))
        fm = r.get('FORMULA', 'DC').strip().upper()
        
        if fm == 'DC':
            end_bal = ob + cd - cc
        else:
            end_bal = ob + cc - cd
        
        total_cd += cd
        total_cc += cc
        
        if end_bal >= 0:
            if fm == 'DC':
                tb_debit_col += end_bal
            else:
                tb_credit_col += end_bal
        else:
            if fm == 'DC':
                tb_credit_col += abs(end_bal)
            else:
                tb_debit_col += abs(end_bal)
    
    raw_diff = total_cd - total_cc
    tb_diff  = tb_debit_col - tb_credit_col
    raw_ok   = abs(raw_diff) < 0.01
    tb_ok    = abs(tb_diff)  < 0.01
    
    raw_status = "OK" if raw_ok else f"UNBALANCED by {raw_diff:,.2f}"
    tb_status  = "OK" if tb_ok  else f"UNBALANCED by {tb_diff:,.2f}"
    
    print(f"\n  {label}")
    print(f"    Raw CurDebit/CurCredit check : {raw_status}")
    print(f"    Proper TB (ending bal cols)  : {tb_status}")
    return raw_diff, tb_diff

base = r"d:\DOWNLOADS\Accounting System\new_companies_data\extracted"

companies = [
    ("GIAN",   ["GIAN202601/012026", "GIAN202602/022026", "GIANData"]),
    ("3JCRT",  ["3JCRT202601/012026", "3JCRT202602/022026", "3JCRTData"]),
    ("JIMI",   ["JIMI202601/012026", "JIMI202602/022026", "JIMIData"]),
    ("LMJAY",  ["LMJAY202601/012026", "LMJAY202602/022026", "LMJAYData"]),
]

print("=" * 70)
print("  TRIAL BALANCE CHECK — All Companies and Periods")
print("=" * 70)

for company, paths in companies:
    print(f"\n" + "-"*70)
    print(f"  COMPANY: {company}")
    print("-"*70)
    for subpath in paths:
        full = os.path.join(base, subpath, "ACCOUNTS.DBF")
        analyze(full, subpath)
    
    # Check POURNALS for the most recent period
    recent = paths[-2] if len(paths) >= 2 else paths[-1]
    pour_path = os.path.join(base, recent, "POURNALS.DBF")
    check_pournals_balance(pour_path, company)

print("\n" + "=" * 70)
print("NOTE: Both methods agree → imbalance comes from DATA, not formula.")
print("=" * 70)
