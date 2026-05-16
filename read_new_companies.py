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
            fd = f.read(32)
            if not fd or fd[0] == 0x0D: break
            name = fd[:11].split(b'\x00')[0].decode('ascii', errors='replace')
            length = fd[16]
            fields.append((name, length))
        f.seek(header_size)
        records = []
        for _ in range(num_records):
            raw = f.read(record_size)
            if not raw or len(raw) < record_size: break
            if raw[0] == 0x2A: continue
            row = {}
            pos = 1
            for name, length in fields:
                row[name] = raw[pos:pos+length].decode('ascii', errors='replace').strip()
                pos += length
            records.append(row)
    return fields, records

base = r"d:\DOWNLOADS\Accounting System\thermalex,john,cyber"
for company in ["Cyberfridge", "Johntrix", "Thermalex"]:
    cdir = os.path.join(base, company)
    pathfile = os.path.join(cdir, "PATHFILE.DBF")
    fields, records = read_dbf(pathfile)
    r = records[0]
    print(f"\n================ {company} PATHFILE ===================")
    important_keys = ["DATAPATH","TEXTPATH","BACKPATH","COMP_ADDR","COMP_ZIP","COMP_TEL","COMP_SSS","COMP_PBG","COMP_TIN","COMP_SIGN","CERT_SIGN","CERT_TITL"]
    for k in important_keys:
        val = r.get(k, "")
        print(f"  {k}: {val}")
    dbfs = sorted([f for f in os.listdir(os.path.join(cdir, "data")) if f.upper().endswith(".DBF")])
    print(f"\n  DBF files ({len(dbfs)}): {dbfs}")
    for dbf in dbfs:
        try:
            _, recs = read_dbf(os.path.join(cdir, "data", dbf))
            if len(recs) > 0:
                print(f"    {dbf:25} : {len(recs)} records")
        except Exception as e:
            print(f"    {dbf:25} : ERROR - {e}")
