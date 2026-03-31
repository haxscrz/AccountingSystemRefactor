/**
 * migrate_ellen.mjs - Migrate Ellen's data into Thermalex company
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const dataDir = "d:\\DOWNLOADS\\Accounting System\\Ellen's Data\\Ellen\\data"
const webSystemDir = "d:\\DOWNLOADS\\Accounting System\\web-system"

const comp = { code: 'thermalex', name: 'THERMALEX GENERAL SERVICES INC' }

if (!fs.existsSync(dataDir)) {
  console.error(`ERROR: Folder not found: ${dataDir}`)
  process.exit(1)
}

console.log(`\n=== Processing ${comp.name} (${comp.code}) ===`)

// Step 1: Convert DBFs to JSON in public/migrated/
console.log(`  Step 1/2: Converting DBFs to JSON...`)
const env = { ...process.env, LEGACY_FS_PATHS: dataDir, LEGACY_PAY_PATHS: '' }
try {
  execSync('npm run import:legacy', { cwd: webSystemDir, env, stdio: 'inherit' })
} catch (e) {
  console.error(`  import:legacy failed:`, e.message)
  process.exit(1)
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

console.log('\n✓ Ellen data migrated!')
