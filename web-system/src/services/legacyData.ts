import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface LegacyDatasetEntry {
  key: string
  module: 'fs' | 'pay'
  sourcePath: string
  outputFile: string
  rowCount: number
  columns: string[]
}

interface LegacyManifest {
  generatedAt: string
  datasetCount: number
  datasets: LegacyDatasetEntry[]
}

interface DatasetPayload {
  tableName: string
  sourcePath: string
  rowCount: number
  columns: string[]
  rows: Record<string, unknown>[]
}

export interface ReportPreviewData {
  title: string
  sourceTable: string
  columns: string[]
  rows: Record<string, unknown>[]
}

let cachedManifest: LegacyManifest | null = null
const cachedDatasets = new Map<string, DatasetPayload>()

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    return await response.json() as T
  } catch {
    return null
  }
}

export async function getLegacyManifest(): Promise<LegacyManifest | null> {
  if (cachedManifest) {
    return cachedManifest
  }

  const manifest = await fetchJson<LegacyManifest>('/migrated/manifest.json')
  if (manifest) {
    cachedManifest = manifest
  }

  return manifest
}

async function loadDataset(outputFile: string): Promise<DatasetPayload | null> {
  if (cachedDatasets.has(outputFile)) {
    return cachedDatasets.get(outputFile) as DatasetPayload
  }

  const payload = await fetchJson<DatasetPayload>(`/migrated/${outputFile}`)
  if (!payload) {
    return null
  }

  cachedDatasets.set(outputFile, payload)
  return payload
}

function pickFirstAvailableDataset(manifest: LegacyManifest, preferredKeys: string[]): LegacyDatasetEntry | null {
  for (const preferred of preferredKeys) {
    const dataset = manifest.datasets.find(item => item.key === preferred)
    if (dataset) {
      return dataset
    }
  }

  return null
}

function normalizeDateValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

function filterRowsByDate(rows: Record<string, unknown>[], from: string, to: string): Record<string, unknown>[] {
  const fromValue = new Date(from).getTime()
  const toValue = new Date(to).getTime()

  if (Number.isNaN(fromValue) || Number.isNaN(toValue)) {
    return rows
  }

  return rows.filter(row => {
    const dateKey = Object.keys(row).find(key => key.toLowerCase().includes('date'))
    if (!dateKey) {
      return true
    }

    const normalized = normalizeDateValue(row[dateKey])
    if (!normalized) {
      return true
    }

    const dateValue = new Date(normalized).getTime()
    return dateValue >= fromValue && dateValue <= toValue
  })
}

export async function buildLegacyReportPreview(args: {
  title: string
  preferredKeys: string[]
  dateFrom?: string
  dateTo?: string
}): Promise<ReportPreviewData | null> {
  const manifest = await getLegacyManifest()
  if (!manifest) {
    return null
  }

  const dataset = pickFirstAvailableDataset(manifest, args.preferredKeys)
  if (!dataset) {
    return null
  }

  const payload = await loadDataset(dataset.outputFile)
  if (!payload) {
    return null
  }

  const initialRows = payload.rows
  const filteredRows = args.dateFrom && args.dateTo
    ? filterRowsByDate(initialRows, args.dateFrom, args.dateTo)
    : initialRows

  const rows = filteredRows.slice(0, 120)
  const columns = payload.columns.slice(0, 12)

  return {
    title: args.title,
    sourceTable: payload.sourcePath,
    columns,
    rows
  }
}

export function downloadPreviewAsCsv(preview: ReportPreviewData, filename: string): void {
  const csvHeader = preview.columns.join(',')
  const csvRows = preview.rows.map(row => {
    return preview.columns.map(column => {
      const value = row[column]
      const text = value === null || value === undefined ? '' : String(value)
      return `"${text.replace(/"/g, '""')}"`
    }).join(',')
  })

  const csvContent = [csvHeader, ...csvRows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

function normalizeRowsForExport(preview: ReportPreviewData): Record<string, string | number | boolean | null>[] {
  return preview.rows.map(row => {
    const normalized: Record<string, string | number | boolean | null> = {}
    for (const column of preview.columns) {
      const value = row[column]
      if (value === null || value === undefined) {
        normalized[column] = null
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        normalized[column] = value
      } else {
        normalized[column] = String(value)
      }
    }
    return normalized
  })
}

export function downloadPreviewAsExcel(preview: ReportPreviewData, filename: string): void {
  const rows = normalizeRowsForExport(preview)
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, filename)
}

export function downloadPreviewAsPdf(preview: ReportPreviewData, filename: string): void {
  console.log('PDF generation started', {
    title: preview.title,
    columnsLength: preview.columns?.length,
    rowsLength: preview.rows?.length
  })

  // Use portrait mode for better text wrapping
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Add title and source
  doc.setFontSize(12)
  doc.text(preview.title, 10, 10)

  doc.setFontSize(8)
  doc.text(`Source: ${preview.sourceTable}`, 10, 16)

  // Prepare data
  const columns = preview.columns
  const rows = Array.isArray(preview.rows) ? preview.rows : []
  const displayRows = rows.slice(0, 100) // Limit to 100 rows

  // Calculate optimal column width
  const marginLeft = 8
  const marginRight = 8
  const availableWidth = pageWidth - marginLeft - marginRight
  
  // Determine font size based on number of columns
  let fontSize = 10
  let colWidth = availableWidth / columns.length
  
  if (columns.length > 6) {
    fontSize = 8
    colWidth = availableWidth / columns.length
  }
  if (columns.length > 10) {
    fontSize = 7
    colWidth = availableWidth / columns.length
  }

  const rowHeight = fontSize / 2 + 1 // Minimum row height
  
  // Draw headers
  let startY = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fontSize)
  doc.setDrawColor(180, 180, 180)
  doc.setFillColor(220, 220, 220)

  let maxHeaderHeight = rowHeight

  // First pass: calculate header height with potential line wrapping
  columns.forEach((col, _idx) => {
    const lines = doc.splitTextToSize(String(col), colWidth - 1)
    const cellHeight = lines.length * (fontSize / 2.8) + 1
    if (cellHeight > maxHeaderHeight) {
      maxHeaderHeight = cellHeight
    }
  })

  // Draw header row with calculated height
  columns.forEach((col, idx) => {
    const x = marginLeft + idx * colWidth
    doc.rect(x, startY, colWidth, maxHeaderHeight)
    doc.setFillColor(220, 220, 220)
    doc.rect(x, startY, colWidth, maxHeaderHeight, 'F')
    
    const lines = doc.splitTextToSize(String(col), colWidth - 1)
    doc.text(lines, x + 0.5, startY + 1.5, { maxWidth: colWidth - 1 })
  })

  // Draw data rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(255, 255, 255)

  let currentY = startY + maxHeaderHeight
  let pageNum = 1
  const minBottomMargin = 10

  displayRows.forEach((row, _rowIdx) => {
    // Calculate row height based on longest wrapped text in this row
    let rowHeight = fontSize / 2
    const textLines: string[][] = []

    columns.forEach((col) => {
      const value = row[col]
      const text = value === null || value === undefined ? '' : String(value)
      const lines = doc.splitTextToSize(text, colWidth - 1)
      textLines.push(lines)
      const cellHeight = lines.length * (fontSize / 2.8)
      if (cellHeight > rowHeight) {
        rowHeight = cellHeight
      }
    })

    rowHeight = Math.max(rowHeight + 1, fontSize / 2.5)

    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - minBottomMargin) {
      // Add page number at bottom
      doc.setFontSize(7)
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
      pageNum++

      // Add new page
      doc.addPage()
      currentY = 10

      // Redraw header on new page
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(fontSize)
      doc.setDrawColor(180, 180, 180)
      doc.setFillColor(220, 220, 220)

      columns.forEach((col, idx) => {
        const x = marginLeft + idx * colWidth
        doc.rect(x, currentY, colWidth, maxHeaderHeight)
        doc.setFillColor(220, 220, 220)
        doc.rect(x, currentY, colWidth, maxHeaderHeight, 'F')
        
        const lines = doc.splitTextToSize(String(col), colWidth - 1)
        doc.text(lines, x + 0.5, currentY + 1.5, { maxWidth: colWidth - 1 })
      })

      currentY += maxHeaderHeight
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontSize)
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(255, 255, 255)
    }

    // Draw row with proper borders and wrapped text
    columns.forEach((_col, colIdx) => {
      const x = marginLeft + colIdx * colWidth
      doc.rect(x, currentY, colWidth, rowHeight)
      doc.setFillColor(255, 255, 255)
      doc.rect(x, currentY, colWidth, rowHeight, 'F')
      
      const lines = textLines[colIdx]
      if (lines && lines.length > 0) {
        doc.text(lines, x + 0.5, currentY + 1, { maxWidth: colWidth - 1 })
      }
    })

    currentY += rowHeight
  })

  // Add page number to last page
  doc.setFontSize(7)
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' })

  doc.save(filename)
  console.log('PDF saved successfully with', displayRows.length, 'rows and', columns.length, 'columns')
}
