import os
from dbfread import DBF

migration_targets = {
    'jemt': r'd:\DOWNLOADS\Accounting System\new_companies_data\extracted\JEMTData',
    'rcmi': r'd:\DOWNLOADS\Accounting System\new_companies_data\extracted\RCMIData',
    'jasc': r'd:\DOWNLOADS\Accounting System\new_companies_data\extracted\JASCData',
    'kote': r'd:\DOWNLOADS\Accounting System\new_companies_data\extracted\KOTEData'
}

for code, path in migration_targets.items():
    print(f"\n================ {code.upper()} ================")
    for filename in ['CHECKMAS.DBF', 'ACHECKMA.DBF']:
        file_path = os.path.join(path, filename)
        if os.path.exists(file_path):
            print(f"--- {filename} ---")
            try:
                table = DBF(file_path, load=True, encoding='latin1')
                dates = set()
                for record in table.records:
                    if 'J_DATE' in record and record['J_DATE']:
                        dates.add(str(record['J_DATE']))
                print(f"  Found dates: {sorted(list(dates))}")
            except Exception as e:
                print(f"  Error reading {filename}: {e}")
        else:
            print(f"  {filename} not found.")
