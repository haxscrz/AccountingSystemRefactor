/**
 * seed-legacy.mjs
 * Calls POST /api/fs/seed-legacy after import:legacy has run.
 * The backend reads the migrated JSON files and seeds all SQLite tables.
 */

const API_BASE = process.env.API_URL ?? 'http://localhost:5081'

async function main() {
  console.log('[seed-legacy] Calling backend seeder...')

  let res
  try {
    res = await fetch(`${API_BASE}/api/fs/seed-legacy`, { method: 'POST' })
  } catch (err) {
    console.error(`[seed-legacy] ❌  Could not reach ${API_BASE}. Is the server running?`)
    console.error(`               ${err.message}`)
    process.exit(1)
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error(`[seed-legacy] ❌  Server returned ${res.status}: ${body.message ?? JSON.stringify(body)}`)
    process.exit(1)
  }

  console.log(`[seed-legacy] ✅  ${body.message}`)
  if (body.seeded) {
    const rows = Object.entries(body.seeded)
      .map(([t, n]) => `  ${t.padEnd(18)} ${n} rows`)
      .join('\n')
    console.log(rows)
  }
}

main()
