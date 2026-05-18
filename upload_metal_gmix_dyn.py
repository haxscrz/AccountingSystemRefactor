import os
import requests
import json
import sys

# Configure stdout for UTF-8
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'https://acctng-api-demo-2026-hxgyfdf3eeg6hycq.indonesiacentral-01.azurewebsites.net'

def get_token():
    auth_data = {
        'username': 'superadmin',
        'password': 'SUPERadmin!234'
    }
    r = requests.post(f"{BASE_URL}/api/auth/login", json=auth_data)
    resp = r.json()
    if not resp.get('success'):
        raise RuntimeError(f"Login failed: {resp.get('message')}")
    return resp['tokens']['accessToken']

token = get_token()
print(f"✓ Authenticated successfully (token length: {len(token)})")

headers = {
    'Authorization': f'Bearer {token}'
}

def upload_company_data(company_code, folder_path):
    print(f"\n{'='*70}")
    print(f"  UPLOADING: {company_code.upper()} from {folder_path}")
    print(f"{'='*70}")
    
    files_to_upload = []
    all_files = sorted(os.listdir(folder_path))
    dbf_files = [f for f in all_files if f.upper().endswith('.DBF')]
    
    print(f"  Found {len(dbf_files)} DBF files in directory:")
    for f in dbf_files:
        size = os.path.getsize(os.path.join(folder_path, f))
        print(f"    • {f} ({size:,} bytes)")
    
    for filename in dbf_files:
        file_path = os.path.join(folder_path, filename)
        files_to_upload.append(('files', (filename, open(file_path, 'rb'), 'application/octet-stream')))
    
    if not files_to_upload:
        print(f"  ⚠ No DBF files found in {folder_path}")
        return

    data = {
        'companyCode': company_code
    }

    url = f"{BASE_URL}/api/admin/import/upload"
    
    try:
        response = requests.post(url, headers=headers, data=data, files=files_to_upload, stream=True)
        print(f"\n  HTTP Status: {response.status_code}")
        if response.status_code != 200:
            print(f"  ✗ ERROR: {response.text}")
            return
            
        total_seeded = 0
        total_skipped = 0
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    payload = json.loads(line_str[6:])
                    p = payload.get('payload', {})
                    evt_type = payload.get('type', '')
                    
                    if evt_type == 'file_done':
                        count = p.get('recordCount', 0)
                        total_seeded += count
                        print(f"  ✓ [SEEDED]  {p.get('fileName')}: {count} records")
                    elif evt_type == 'parsed':
                        print(f"  → [PARSED]  {p.get('fileName')}: {p.get('recordCount')} records from DBF")
                    elif evt_type == 'skip':
                        total_skipped += 1
                        print(f"  ⊘ [SKIP]    {p.get('fileName')}: {p.get('reason')}")
                    elif evt_type == 'error':
                        print(f"  ✗ [ERROR]   {p.get('message')}")
                    elif evt_type == 'file_error':
                        print(f"  ✗ [F_ERROR] {p.get('fileName')}: {p.get('error')}")
                    elif evt_type == 'complete':
                        print(f"\n  ✓ COMPLETE: {p.get('message')}")
                    elif evt_type == 'start':
                        print(f"  → Starting import for '{p.get('company')}'...")
                    elif evt_type == 'reading':
                        pass  # silent
                    elif evt_type == 'clearing':
                        print(f"  ⟳ [CLEAR]   Clearing existing {p.get('table')} data...")
                    else:
                        print(f"  ? [{evt_type}] {json.dumps(p)}")
        
        print(f"\n  Summary: {total_seeded} records seeded, {total_skipped} files skipped")
        
    except Exception as e:
        print(f"  ✗ [EXCEPTION] {e}")
    finally:
        for _, (name, f, mime) in files_to_upload:
            f.close()

# ── Companies to migrate ─────────────────────────────────────────────────
base_dir = r'd:\DOWNLOADS\Accounting System\thermalex,john,cyber\Updated Data for Metal,Gmix,Dyn'

migration_targets = {
    'dynamiq':  os.path.join(base_dir, 'Dynamiq', 'DATA'),
    'gmixteam': os.path.join(base_dir, 'Gmixteam', 'DATA'),
    'metaleon': os.path.join(base_dir, 'Metaleon', 'DATA'),
}

print(f"\n{'#'*70}")
print(f"  DATA MIGRATION: Metaleon, Gmixteam, Dynamiq")
print(f"  Target: {BASE_URL}")
print(f"{'#'*70}")

for code, path in migration_targets.items():
    if os.path.exists(path):
        upload_company_data(code, path)
    else:
        print(f"\n  ✗ Path not found: {path}")

print(f"\n{'#'*70}")
print(f"  MIGRATION COMPLETE")
print(f"{'#'*70}")
