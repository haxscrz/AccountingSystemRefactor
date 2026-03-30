import { useState, useRef } from 'react'

interface ImportResult {
  message: string
  imported: number
  skipped: string[]
}

const SAMPLE_CSV = `emp_no,reg_hrs,abs_hrs,rot_hrs,sphp_hrs,spot_hrs,lghp_hrs,lgot_hrs,nsd_hrs,lv_hrs,ls_hrs,oth_pay1,oth_pay2,sln_ded,hdmf_ded
001001,80,0,4,0,0,0,0,0,0,0,0,0,0,0
001002,80,8,0,0,0,0,0,0,0,0,0,0,500,200`

export default function AppendFromDatafile() {
  const [file, setFile] = useState<File | null>(null)
  const [previewLines, setPreviewLines] = useState<string[]>([])
  const [overwrite, setOverwrite] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [showSample, setShowSample] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = (e.target?.result as string) ?? ''
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 6)
      setPreviewLines(lines)
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/payroll/import-timecards?overwrite=${overwrite}`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        setFile(null)
        setPreviewLines([])
        if (fileInput.current) fileInput.current.value = ''
      } else {
        setError(data.error || data.message || 'Import failed.')
      }
    } catch {
      setError('Network error — could not reach server.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="card">
      <h2>Append From Datafile</h2>
      <p className="subtitle">
        Adds new timecard records by importing from a CSV file. Equivalent to APPETIME.PRG — reads employee hours and deduction fields from an external data source.
      </p>

      {/* How to Use */}
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <strong>Required CSV Format</strong>
          <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '12px' }} onClick={() => setShowSample(!showSample)}>
            {showSample ? 'Hide' : 'Show'} Sample CSV
          </button>
        </div>
        <p>The CSV file must have a header row with <strong>emp_no</strong> as the first required column. All other columns are optional and default to 0 if missing.</p>
        {showSample && (
          <pre style={{ background: 'var(--panel-2)', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '11px', marginTop: '8px' }}>
            {SAMPLE_CSV}
          </pre>
        )}
      </div>

      {/* File Upload */}
      <div style={{ background: 'var(--panel-2)', border: '2px dashed var(--border)', borderRadius: '8px', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#128196;</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{file.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
            <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => fileInput.current?.click()}>
              Change File
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#128193;</div>
            <div style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Select a CSV file to import timecard records</div>
            <button className="btn btn-primary" onClick={() => fileInput.current?.click()}>
              Browse for CSV File
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {previewLines.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '8px' }}>File Preview (first {previewLines.length} rows)</h4>
          <pre style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', overflow: 'auto', fontSize: '12px' }}>
            {previewLines.join('\n')}
          </pre>
        </div>
      )}

      {/* Options */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />
          Overwrite existing timecard records for this period (same as APPETIME.PRG overwrite confirmation)
        </label>
        {overwrite && (
          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '4px', fontSize: '13px', color: '#dc3545' }}>
            &#9888; This will <strong>delete all existing timecard records</strong> before importing.
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: 'var(--success)' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>&#10003; {result.message}</div>
          {result.skipped.length > 0 && (
            <div style={{ marginTop: '8px', color: '#856404' }}>
              <strong>Skipped ({result.skipped.length}):</strong>
              <ul style={{ marginTop: '4px', paddingLeft: '18px', fontSize: '12px' }}>
                {result.skipped.slice(0, 10).map((s, i) => <li key={i}>{s}</li>)}
                {result.skipped.length > 10 && <li>...and {result.skipped.length - 10} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid #dc3545', borderRadius: '8px', padding: '14px', marginBottom: '20px', color: '#dc3545' }}>
          &#9888; {error}
        </div>
      )}

      {/* Import Button */}
      <button
        className="btn btn-primary"
        style={{ fontSize: '15px', padding: '10px 28px' }}
        onClick={handleImport}
        disabled={!file || importing}
      >
        {importing ? 'Importing...' : 'Import Timecard Records'}
      </button>
    </div>
  )
}
