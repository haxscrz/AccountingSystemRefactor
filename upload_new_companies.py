import os
import requests
import json
import sys

# Configure stdout for UTF-8
sys.stdout.reconfigure(encoding='utf-8')

TOKEN_FILE = r'd:\DOWNLOADS\Accounting System\new_companies_data\live_token_clean.txt'
BASE_URL = 'https://acctng-api-demo-2026-hxgyfdf3eeg6hycq.indonesiacentral-01.azurewebsites.net'

def get_token():
    auth_data = {
        'username': 'superadmin',
        'password': 'SUPERadmin!234'
    }
    r = requests.post(f"{BASE_URL}/api/auth/login", json=auth_data)
    return r.json()['tokens']['accessToken']

token = get_token()
headers = {
    'Authorization': f'Bearer {token}'
}

def upload_company_data(company_code, folder_path):
    print(f"\n--- Uploading data for {company_code} from {folder_path} ---")
    files_to_upload = []
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.dbf'):
            file_path = os.path.join(folder_path, filename)
            files_to_upload.append(('files', (filename, open(file_path, 'rb'), 'application/octet-stream')))
    
    if not files_to_upload:
        print(f"No DBF files found in {folder_path}")
        return

    data = {
        'companyCode': company_code
    }

    url = f"{BASE_URL}/api/admin/import/upload"
    
    # SSE request, we need to read it streamingly or just get the whole thing if it's small enough
    # But since it's a POST with multipart, we'll just use requests.post
    try:
        response = requests.post(url, headers=headers, data=data, files=files_to_upload, stream=True)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(response.text)
            
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    payload = json.loads(line_str[6:])
                    p = payload.get('payload', {})
                    if payload['type'] == 'file_done':
                        print(f"  [OK] {p.get('fileName')}: {p.get('recordCount')} records seeded")
                    elif payload['type'] == 'parsed':
                        print(f"  [PARSED] {p.get('fileName')}: {p.get('recordCount')} records parsed from DBF")
                    elif payload['type'] == 'error':
                        print(f"  [ERROR] {p.get('message')}")
                    elif payload['type'] == 'file_error':
                        print(f"  [FILE_ERROR] {p.get('fileName')}: {p.get('error')}")
                    elif payload['type'] == 'complete':
                        print(f"  [COMPLETE] {p.get('message')}")
    except Exception as e:
        print(f"  [EXCEPTION] {e}")
    finally:
        for _, (name, f, mime) in files_to_upload:
            f.close()

# Companies to migrate
migration_targets = {
    'cyberfridge': r'd:\DOWNLOADS\Accounting System\thermalex,john,cyber\Cyberfridge\data',
    'johntrix': r'd:\DOWNLOADS\Accounting System\thermalex,john,cyber\Johntrix\data',
    'thermalex': r'd:\DOWNLOADS\Accounting System\thermalex,john,cyber\Thermalex\data'
}

for code, path in migration_targets.items():
    if os.path.exists(path):
        upload_company_data(code, path)
    else:
        print(f"Path not found: {path}")

print("\nMigration script finished.")
