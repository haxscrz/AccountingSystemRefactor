import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const zipDir = "d:\\DOWNLOADS\\Accounting System\\Bing's Data"
const tempDir = "d:\\DOWNLOADS\\Accounting System\\temp"
const webSystemDir = "d:\\DOWNLOADS\\Accounting System\\web-system"

const companies = [
  { code: '3jcrt', file: '3JCRT.ZIP', name: '3JCRT General Services, Inc.' },
  { code: 'gian', file: 'GIAN.ZIP', name: 'Gian-Den General Services, Inc.' },
  { code: 'jimi', file: 'JIMI.ZIP', name: 'Jimi Tubing Specialist, Inc.' },
  { code: 'lmjay', file: 'LMJAY.ZIP', name: 'Lmjay General Services, Inc.' }
]

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

for (const comp of companies) {
  console.log(\`\\n=== Processing \${comp.name} (\${comp.code}) ===\`)
  const targetZip = path.join(zipDir, comp.file)
  const extractDir = path.join(tempDir, comp.code)

  if (!fs.existsSync(extractDir)) {
    console.log(\`Extracting \${comp.file}...\`)
    execSync(\`powershell Expand-Archive -Path "\${targetZip}" -DestinationPath "\${extractDir}" -Force\`)
  }

  console.log(\`Checking paths inside \${extractDir}...\`);
  // Example for FS: LMJAY/FS/CTSI/DATA or LMJAY/LMJAY/FS/CTSI/DATA
  // Since we don't know the exact structure inside the zip, we look for folders named DATA
  const isDir = p => fs.existsSync(p) && fs.statSync(p).isDirectory()
  
  // We'll use powershell to recursively find paths containing dbf
  // but a simpler way is to just pass the extracted dir itself as the root and let the migrator find dbfs!
  const env = { ...process.env, LEGACY_FS_PATHS: extractDir, LEGACY_PAY_PATHS: '' }

  console.log(\`Running import:legacy for \${comp.code}...\`)
  execSync('npm run import:legacy', { cwd: webSystemDir, env, stdio: 'inherit' })

  console.log(\`Creating company via API...\`)
  try {
    execSync(\`curl -X POST http://localhost:5081/api/companies -H "Content-Type: application/json" -d "{\\"code\\":\\"\${comp.code}\\",\\"name\\":\\"\${comp.name}\\"}"\`, { stdio: 'pipe' })
  } catch (e) {
    console.log("Company might already exist, continuing.")
  }

  console.log(\`Seeding legacy data to backend...\`)
  try {
    const res = execSync(\`curl -s -X POST http://localhost:5081/api/fs/seed-legacy -H "x-company: \${comp.code}"\`)
    console.log(res.toString())
  } catch (e) {
    console.error("Seed failed:", e.message)
  }
}

console.log('All migrations complete!')
