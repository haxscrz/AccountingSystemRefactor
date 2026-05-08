import struct, sys, os

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
            if not raw or raw[0] == 0x2A:  # deleted record
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

def analyze_accounts(dbf_path, label):
    print(f"\n{'='*80}")
    print(f"  {label}")
    print(f"  File: {dbf_path}")
    print(f"{'='*80}")

    fields, records = read_dbf(dbf_path)
    print(f"Fields: {[f[0] for f in fields]}")
    print(f"Total records: {len(records)}")
    print()

    header = f"{'ACCT':10} | {'DESCRIPTION':30} | {'OPEN_BAL':>14} | {'CUR_DEBIT':>14} | {'CUR_CREDIT':>14} | {'FORMULA':7} | {'END_BAL':>14}"
    print(header)
    print('-' * len(header))

    total_open = 0.0
    total_cd = 0.0
    total_cc = 0.0

    # For proper TB check: sum ending balances by column
    tb_debit_col = 0.0
    tb_credit_col = 0.0

    for r in records:
        ob = to_float(r.get('OPEN_BAL', '0'))
        cd = to_float(r.get('CUR_DEBIT', '0'))
        cc = to_float(r.get('CUR_CREDIT', '0'))
        fm = r.get('FORMULA', 'DC').strip().upper()
        code = r.get('ACCT_CODE', '').strip()
        desc = r.get('ACCT_DESC', '').strip()[:30]

        if fm == 'DC':
            end_bal = ob + cd - cc
        else:
            end_bal = ob + cc - cd

        total_open += ob
        total_cd += cd
        total_cc += cc

        # Place ending balance into appropriate TB column
        if end_bal >= 0:
            if fm == 'DC':
                tb_debit_col += end_bal
            else:
                tb_credit_col += end_bal
        else:
            # Contra/abnormal balance
            if fm == 'DC':
                tb_credit_col += abs(end_bal)
            else:
                tb_debit_col += abs(end_bal)

        if cd != 0 or cc != 0 or ob != 0:
            print(f"{code:10} | {desc:30} | {ob:14.2f} | {cd:14.2f} | {cc:14.2f} | {fm:7} | {end_bal:14.2f}")

    print('-' * len(header))
    print(f"\n--- RAW TOTALS (as current code does) ---")
    print(f"  SUM CUR_DEBIT  = {total_cd:,.2f}")
    print(f"  SUM CUR_CREDIT = {total_cc:,.2f}")
    print(f"  DIFFERENCE     = {total_cd - total_cc:,.2f}  ({'BALANCED' if abs(total_cd - total_cc) < 0.01 else 'UNBALANCED'})")

    print(f"\n--- PROPER TB CHECK (ending balance by column) ---")
    print(f"  TB Debit Column  = {tb_debit_col:,.2f}")
    print(f"  TB Credit Column = {tb_credit_col:,.2f}")
    print(f"  DIFFERENCE       = {tb_debit_col - tb_credit_col:,.2f}  ({'BALANCED' if abs(tb_debit_col - tb_credit_col) < 0.01 else 'UNBALANCED'})")

# Analyze GIAN Feb 2026 period data
base = r"d:\DOWNLOADS\Accounting System\new_companies_data\extracted"

analyze_accounts(
    os.path.join(base, r"GIAN202602\022026\ACCOUNTS.DBF"),
    "GIAN - February 2026 Period"
)

analyze_accounts(
    os.path.join(base, r"GIANData\ACCOUNTS.DBF"),
    "GIAN - Base/Master Data (GIANData)"
)
