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
            if not raw or len(raw) < record_size:
                break
            if raw[0] == 0x2A:
                continue
            row = {}
            pos = 1
            for name, ftype, length in fields:
                val = raw[pos:pos+length].decode('ascii', errors='replace').strip()
                row[name] = val
                pos += length
            records.append(row)
    return fields, records

base = r"d:\DOWNLOADS\Accounting System\new_companies_data\extracted"

new_companies = ["KOTEData", "JEMTData", "RCMIData", "JASCData"]

for company in new_companies:
    cdir = os.path.join(base, company)
    print("=" * 70)
    print(f"  COMPANY: {company}")
    print("=" * 70)
    
    # List all DBF files
    dbf_files = sorted([f for f in os.listdir(cdir) if f.upper().endswith('.DBF')])
    print(f"  DBF files: {dbf_files}")
    
    # Read PATHFILE.DBF if exists
    pathfile = os.path.join(cdir, "PATHFILE.DBF")
    if os.path.exists(pathfile):
        fields, records = read_dbf(pathfile)
        print(f"\n  PATHFILE.DBF fields: {[f[0] for f in fields]}")
        print(f"  Records: {len(records)}")
        for r in records:
            for k, v in r.items():
                if v:
                    print(f"    {k}: {v}")
            print()
    else:
        print("  PATHFILE.DBF not found")
    
    # Show ACCOUNTS.DBF stats
    acctfile = os.path.join(cdir, "ACCOUNTS.DBF")
    if os.path.exists(acctfile):
        fields, records = read_dbf(acctfile)
        print(f"  ACCOUNTS.DBF: {len(records)} accounts")
    
    # Count records in each DBF
    print(f"\n  Record counts:")
    for dbf in dbf_files:
        try:
            _, recs = read_dbf(os.path.join(cdir, dbf))
            if len(recs) > 0:
                print(f"    {dbf:25} : {len(recs)} records")
        except:
            print(f"    {dbf:25} : ERROR reading")
    print()
