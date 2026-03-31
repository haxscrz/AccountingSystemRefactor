/**
 * migrate_bing_fixed.mjs - Fixed version using curl.exe and correct header
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const bingsDataDir = "d:\\DOWNLOADS\\Accounting System\\Bing's Data"
const webSystemDir = "d:\\DOWNLOADS\\Accounting System\\web-system"

const companies = [
  { code: '3jcrt', folder: '3JCRT.ZIP', name: '3JCRT General Services, Inc.' },
  { code: 'gian',  folder: 'GIAN.ZIP',  name: 'Gian-Den General Services, Inc.' },
  { code: 'jimi',  folder: 'JIMI.ZIP',  name: 'Jimi Tubing Specialist, Inc.' },
  { code: 'lmjay', folder: 'LMJAY.ZIP', name: 'Lmjay General Services, Inc.' }
]

for (const comp of companies) {
  const dbfDir = path.join(bingsDataDir, comp.folder)

  if (!fs.existsSync(dbfDir)) {
    console.error(`ERROR: Folder not found: ${dbfDir}`)
    continue
  }

  console.log(`\n=== Processing ${comp.name} (${comp.code}) ===`)

  // Step 1: Convert DBFs to JSON in public/migrated/
  console.log(`  Step 1/2: Converting DBFs to JSON...`)
  const env = { ...process.env, LEGACY_FS_PATHS: dbfDir, LEGACY_PAY_PATHS: '' }
  try {
    execSync('npm run import:legacy', { cwd: webSystemDir, env, stdio: 'inherit' })
  } catch (e) {
    console.error(`  import:legacy failed:`, e.message)
    continue
  }

  // Step 2: Seed using correct header 'X-Company-Code'
  console.log(`  Step 2/2: Seeding into DB as '${comp.code}'...`)
  try {
    const res = execSync(
      `curl.exe -s -X POST http://localhost:5081/api/fs/seed-legacy -H "X-Company-Code: ${comp.code}"`,
      { encoding: 'utf8' }
    )
    const parsed = JSON.parse(res)
    if (parsed.seeded) {
      const total = Object.values(parsed.seeded).reduce((a, b) => a + b, 0)
      console.log(`  ✓ Seeded ${total} records: ${JSON.stringify(parsed.seeded)}`)
    } else {
      console.log(`  Response:`, res.trim())
    }
  } catch (e) {
    console.error(`  Seed failed:`, e.message)
  }
}

console.log('\n✓ All companies migrated!')
