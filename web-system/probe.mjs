import fetch from 'node-fetch';

async function testApi() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sysId: 'admin', password: 'admin' }) // Trying typical admin passwords
    });
    
    // If admin/admin fails, try admin/admin123
    let cookie = loginRes.headers.get('set-cookie');
    if (!loginRes.ok) {
        console.log("admin/admin failed, trying admin/admin123...");
        const loginRes2 = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sysId: 'admin', password: 'admin123' })
        });
        cookie = loginRes2.headers.get('set-cookie');
        if(!cookie) {
            console.log("Login failed");
            console.log(await loginRes2.text());
            return;
        }
    }
    
    console.log("Logged in!");
    
    // 2. GET API
    const res = await fetch('http://localhost:5000/api/fs/vouchers/masters', {
      headers: {
        'Cookie': cookie
      }
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response Body (first 2000 chars):");
    console.log(text.substring(0, 2000));
    
  } catch (err) {
    console.error(err);
  }
}

testApi();
