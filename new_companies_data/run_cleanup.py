import requests

TOKEN_FILE = r'd:\DOWNLOADS\Accounting System\new_companies_data\live_token_clean.txt'
BASE_URL = 'https://acctng-api-demo-2026-hxgyfdf3eeg6hycq.indonesiacentral-01.azurewebsites.net'

with open(TOKEN_FILE, 'r', encoding='utf-8-sig') as f:
    token = f.read().strip()

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

url = f"{BASE_URL}/api/admin/import/cleanup-mistake"
try:
    res = requests.post(url, headers=headers)
    print(f"Status Code: {res.status_code}")
    print(res.text)
except Exception as e:
    print(f"Error: {e}")
