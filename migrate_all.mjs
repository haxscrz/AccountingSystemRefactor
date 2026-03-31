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
  console.log(`\n=== Processing ${comp.name} (${comp.code}) ===`)
  const targetZip = path.join(zipDir, comp.file)
  const extractDir = path.join(tempDir, comp.code)

  if (!fs.existsSync(extractDir)) {
    console.log(`Extracting ${comp.file}...`)
    fs.mkdirSync(extractDir)
    execSync(`tar -xf "${targetZip}" -C "${extractDir}"`)
  }

  const env = { ...process.env, LEGACY_FS_PATHS: extractDir, LEGACY_PAY_PATHS: '' }

  console.log(`Running import:legacy for ${comp.code}...`)
  execSync('npm run import:legacy', { cwd: webSystemDir, env, stdio: 'inherit' })

  console.log(`Seeding legacy data to backend...`)
  try {
    const res = execSync(`curl -s -X POST http://localhost:5081/api/fs/seed-legacy -H "x-company: ${comp.code}"`)
    console.log(res.toString())
  } catch (e) {
    console.error("Seed failed:", e.message)
  }
}

console.log('All migrations complete!')
