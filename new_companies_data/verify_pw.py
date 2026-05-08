import sqlite3, hashlib, base64, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Check v8 (the one the server uses)
db_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT username, password_hash, password_salt, hash_iterations, role FROM app_users WHERE username='hanscruz'")
row = cur.fetchone()
if row:
    username, stored_hash, stored_salt, iterations, role = row
    print(f"User: {username}, Role: {role}, Iterations: {iterations}")
    print(f"Stored hash: {stored_hash}")
    print(f"Stored salt: {stored_salt}")
    
    # Verify "superadmin" password
    password = "superadmin"
    salt_bytes = base64.b64decode(stored_salt)
    computed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt_bytes, iterations, dklen=32)
    computed_b64 = base64.b64encode(computed).decode()
    print(f"Computed hash for 'superadmin': {computed_b64}")
    print(f"Match: {computed_b64 == stored_hash}")
else:
    print("User hanscruz not found!")
    cur.execute("SELECT username, role FROM app_users")
    for r in cur.fetchall():
        print(f"  Found user: {r[0]} ({r[1]})")

conn.close()
