const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const zipDir = "d:\\\\DOWNLOADS\\\\Accounting System\\\\Bing's Data"
const tempDir = "d:\\\\DOWNLOADS\\\\Accounting System\\\\temp"
const webSystemDir = "d:\\\\DOWNLOADS\\\\Accounting System\\\\web-system"

const companies = [
  { code: '3jcrt', file: '3JCRT.ZIP', name: '3JCRT General Services, Inc.' },
  { code: 'gian', file: 'GIAN.ZIP', name: 'Gian-Den General Services, Inc.' },
  { code: 'jimi', file: 'JIMI.ZIP', name: 'Jimi Tubing Specialist, Inc.' },
  { code: 'lmjay', file: 'LMJAY.ZIP', name: 'Lmjay General Services, Inc.' }
]

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

for (const comp of companies) {
  console.log("\\n=== Processing " + comp.name + " (" + comp.code + ") ===")
  const targetZip = path.join(zipDir, comp.file)
  const extractDir = path.join(tempDir, comp.code)

  if (!fs.existsSync(extractDir)) {
  if (!fs.existsSync(extractDir)) {
    console.log("Extracting " + comp.file + "...")
    const psCmd = 'Expand-Archive -Path "' + targetZip + '" -DestinationPath "' + extractDir + '" -Force'
    execSync(psCmd, { shell: 'powershell.exe' })
  }

  const env = Object.assign({}, process.env, { LEGACY_FS_PATHS: extractDir, LEGACY_PAY_PATHS: '' })

  console.log("Running import:legacy for " + comp.code + "...")
  try {
      execSync('npm run import:legacy', { cwd: webSystemDir, env: env, stdio: 'inherit' })
  } catch(e) { console.error("import Error") }

  console.log("Creating company via API...")
  try {
    const curlCmd = 'curl -X POST http://localhost:5081/api/companies -H "Content-Type: application/json" -d "{\\"code\\":\\"' + comp.code + '\\",\\"name\\":\\"' + comp.name + '\\"}"'
    execSync(curlCmd, { stdio: 'pipe' })
  } catch (e) {
    console.log("Company might already exist, continuing.")
  }

  console.log("Seeding legacy data to backend...")
  try {
    const res = execSync('curl -s -X POST http://localhost:5081/api/fs/seed-legacy -H "x-company: ' + comp.code + '"')
    console.log(res.toString())
  } catch (e) {
    console.error("Seed failed:", e.message)
  }
}

console.log('All migrations complete!')
