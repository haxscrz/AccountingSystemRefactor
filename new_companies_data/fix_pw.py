import sqlite3, hashlib, base64, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

db_path = r'd:\DOWNLOADS\Accounting System\web-system\server\AccountingApi\accounting_v8.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check existing superadmin
cur.execute("SELECT username, password_hash, password_salt, hash_iterations, role FROM app_users WHERE role='superadmin'")
row = cur.fetchone()
if row:
    username, stored_hash, stored_salt, iterations, role = row
    print(f"Current superadmin: {username}")
    
    # Try common passwords
    for pwd in ["superadmin", "admin", "password", "123456", "Admin@123"]:
        salt_bytes = base64.b64decode(stored_salt)
        computed = hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt_bytes, iterations, dklen=32)
        if base64.b64encode(computed).decode() == stored_hash:
            print(f"PASSWORD FOUND: {pwd}")
            break
    else:
        print("No common password matched. Resetting...")
        # Reset password to "superadmin"
        password = "superadmin"
        salt = os.urandom(16)
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 120000, dklen=32)
        cur.execute("UPDATE app_users SET password_hash=?, password_salt=?, hash_iterations=? WHERE role='superadmin'",
                    (base64.b64encode(dk).decode(), base64.b64encode(salt).decode(), 120000))
        conn.commit()
        print(f"Password reset to 'superadmin' for user '{username}'")

conn.close()
