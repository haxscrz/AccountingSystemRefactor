/**
 * migrate_bing.mjs
 * 
 * Migrates Bing's 4 company DBF datasets into the accounting system.
 * The ".ZIP" names are actually pre-extracted folders containing DBF files.
 * 
 * Run: node migrate_bing.mjs
 * (Backend must be running on http://localhost:5081)
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
  console.log(`  DBF source: ${dbfDir}`)

  // Step 1: Convert DBFs to JSON in public/migrated/
  console.log(`  Running import:legacy...`)
  const env = { ...process.env, LEGACY_FS_PATHS: dbfDir, LEGACY_PAY_PATHS: '' }
  try {
    execSync('npm run import:legacy', { cwd: webSystemDir, env, stdio: 'inherit' })
  } catch (e) {
    console.error(`  import:legacy failed for ${comp.code}:`, e.message)
    continue
  }

  // Step 2: Seed the JSON files into the SQLite DB under the correct company code
  console.log(`  Seeding data into backend for company: ${comp.code}...`)
  try {
    const res = execSync(
      `curl -s -X POST http://localhost:5081/api/fs/seed-legacy -H "x-company: ${comp.code}"`,
      { encoding: 'utf8' }
    )
    console.log(`  Seed result: ${res}`)
  } catch (e) {
    console.error(`  Seed failed for ${comp.code}:`, e.message)
  }
}

console.log('\nAll done!')
