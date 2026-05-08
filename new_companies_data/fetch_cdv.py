import requests

TOKEN_FILE = r'd:\DOWNLOADS\Accounting System\new_companies_data\live_token_clean.txt'
BASE_URL = 'https://acctng-api-demo-2026-hxgyfdf3eeg6hycq.indonesiacentral-01.azurewebsites.net'

with open(TOKEN_FILE, 'r', encoding='utf-8-sig') as f:
    token = f.read().strip()

headers = {
    'Authorization': f'Bearer {token}',
    'X-Company-Code': 'jemt'
}

print("Fetching JEMT CDVs...")
res = requests.get(f"{BASE_URL}/api/fs/cdv/master", headers=headers)
print("JEMT:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Count:", len(data))
    if len(data) > 0:
        print("Sample:", data[0])

headers['X-Company-Code'] = 'kote'
print("\nFetching KOTE CDVs...")
res = requests.get(f"{BASE_URL}/api/fs/cdv/master", headers=headers)
print("KOTE:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Count:", len(data))
