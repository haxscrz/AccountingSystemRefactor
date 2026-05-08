import sqlite3
import requests
import json
import os

TOKEN_FILE = r'd:\DOWNLOADS\Accounting System\new_companies_data\live_token_clean.txt'
DB_FILE = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db'
BASE_URL = 'https://acctng-api-demo-2026-hxgyfdf3eeg6hycq.indonesiacentral-01.azurewebsites.net'

with open(TOKEN_FILE, 'r', encoding='utf-8-sig') as f:
    token = f.read().strip()

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

tables = [
    'fs_accounts','fs_adjstmnt','fs_banks','fs_cashrcpt','fs_checkmas',
    'fs_checkvou','fs_effects','fs_journals','fs_pournals','fs_purcbook',
    'fs_salebook','fs_schedule','fs_supplier'
]

company_code = 'kote'

conn = sqlite3.connect(DB_FILE)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

payload = {
    "companyCode": company_code,
    "tables": {}
}

total_records = 0
for t in tables:
    cur.execute(f"SELECT * FROM {t} WHERE company_code = ?", (company_code,))
    rows = cur.fetchall()
    if rows:
        table_rows = []
        for r in rows:
            row_dict = dict(r)
            # Remove system columns that might interfere or aren't needed from DBF original
            row_dict.pop('id', None)
            row_dict.pop('company_code', None)
            row_dict.pop('created_at', None)
            row_dict.pop('updated_at', None)
            row_dict.pop('created_by_user_id', None)
            table_rows.append(row_dict)
        
        payload["tables"][t] = table_rows
        total_records += len(table_rows)

conn.close()

if total_records == 0:
    print(f"No records found for {company_code} in local DB.")
    exit(0)

print(f"Uploading {total_records} records across {len(payload['tables'])} tables for {company_code}...")

url = f"{BASE_URL}/api/admin/import/json"
try:
    res = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {res.status_code}")
    print(res.text)
except Exception as e:
    print(f"Error: {e}")
