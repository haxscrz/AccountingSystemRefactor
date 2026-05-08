import sqlite3, hashlib, base64, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

db_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v9.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Generate new password hash for "superadmin" using PBKDF2
password = "superadmin"
salt = os.urandom(16)
iterations = 120000
dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations, dklen=32)

salt_b64 = base64.b64encode(salt).decode()
hash_b64 = base64.b64encode(dk).decode()

print(f"Salt: {salt_b64}")
print(f"Hash: {hash_b64}")

# Update hanscruz user password
cur.execute("""UPDATE app_users SET password_hash=?, password_salt=?, hash_iterations=? WHERE username='hanscruz'""",
            (hash_b64, salt_b64, iterations))
print(f"Updated {cur.rowcount} rows for hanscruz")

conn.commit()
conn.close()
print("Done! Password for hanscruz is now: superadmin")
