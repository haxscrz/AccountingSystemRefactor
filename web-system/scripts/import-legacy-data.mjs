import { readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve, extname, basename, relative } from 'node:path'
import { DBFFile } from 'dbffile'

const workspaceRoot = resolve(process.cwd(), '..')
const outputDir = resolve(process.cwd(), 'public', 'migrated')

const roots = [
  { module: 'fs', dir: resolve(workspaceRoot, 'FS', 'CTSI', 'DATA') },
  { module: 'pay', dir: resolve(workspaceRoot, 'PAY', 'RANK') },
  { module: 'pay', dir: resolve(workspaceRoot, 'PAY', 'OTHR') }
]

async function findDbfFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const results = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await findDbfFiles(fullPath))
      continue
    }

    if (extname(entry.name).toLowerCase() === '.dbf') {
      results.push(fullPath)
    }
  }

  return results
}

function normalizeName(moduleName, filePath) {
  const base = basename(filePath, extname(filePath)).toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return `${moduleName}_${base}`
}

function toSerializableRecord(record) {
  const normalized = {}
  for (const [key, value] of Object.entries(record)) {
    if (value instanceof Date) {
      normalized[key] = value.toISOString().slice(0, 10)
      continue
    }
    if (typeof value === 'bigint') {
      normalized[key] = Number(value)
      continue
    }
    normalized[key] = value
  }
  return normalized
}

async function convertDbf(moduleName, dbfPath) {
  const tableName = normalizeName(moduleName, dbfPath)
  const outputFile = `${tableName}.json`
  const outputPath = join(outputDir, outputFile)

  const dbf = await DBFFile.open(dbfPath)
  const records = await dbf.readRecords()
  const rows = records.map(toSerializableRecord)

  const columns = rows.length > 0 ? Object.keys(rows[0]) : dbf.fields.map(field => field.name)

  await writeFile(outputPath, JSON.stringify({
    tableName,
    sourcePath: relative(workspaceRoot, dbfPath).replaceAll('\\', '/'),
    rowCount: rows.length,
    columns,
    rows
  }, null, 2), 'utf-8')

  return {
    key: tableName,
    module: moduleName,
    sourcePath: relative(workspaceRoot, dbfPath).replaceAll('\\', '/'),
    outputFile,
    rowCount: rows.length,
    columns
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  const datasets = []
  for (const root of roots) {
    const dbfFiles = await findDbfFiles(root.dir)
    for (const dbfPath of dbfFiles) {
      const result = await convertDbf(root.module, dbfPath)
      datasets.push(result)
      console.log(`Imported ${result.sourcePath} -> ${result.outputFile} (${result.rowCount} rows)`)
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    datasetCount: datasets.length,
    datasets
  }

  await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`\nMigration complete. Datasets: ${datasets.length}`)
  console.log(`Manifest: ${join(outputDir, 'manifest.json')}`)
}

main().catch(error => {
  console.error('Legacy import failed:', error)
  process.exit(1)
})
