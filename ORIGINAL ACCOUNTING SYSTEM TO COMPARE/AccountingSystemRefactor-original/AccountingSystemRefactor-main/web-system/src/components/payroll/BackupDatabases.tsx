import { useState } from 'react'

export default function BackupDatabases() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleBackup = async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/payroll/backup-db')
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Download failed.' }))
        throw new Error(body.error ?? 'Download failed.')
      }

      // Extract filename from Content-Disposition header
      const cd = res.headers.get('content-disposition') ?? ''
      const nameMatch = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const fileName = nameMatch ? nameMatch[1].replace(/['"]/g, '') : 'payroll-backup.db'

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('success')
      setMessage(`Backup downloaded: ${fileName}`)
    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text, #1a1a1a)',
        marginBottom: 8
      }}>
        Backup Databases
      </h2>
      <p style={{
        fontSize: 14,
        color: 'var(--text-secondary, #5a5a5a)',
        marginBottom: 32,
        lineHeight: 1.6
      }}>
        Creates a timestamped copy of the payroll database (<code>accounting.db</code>) and
        downloads it to your computer. Store the backup file in a safe location.
      </p>

      <div style={{
        background: 'var(--surface-raised, #f5f5f5)',
        border: '1px solid var(--border, #d0d0d0)',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 28
      }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text, #1a1a1a)', lineHeight: 1.7 }}>
          <strong>What gets backed up:</strong>
          <br />
          The complete payroll database including employee master records, payroll history,
          timecards, department data, system settings, and premium pay records.
        </p>
      </div>

      {status === 'success' && (
        <div style={{
          background: '#e6f4ea',
          border: '1px solid #a8d5b5',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          color: '#1e6e3c'
        }}>
          {message}
        </div>
      )}

      {status === 'error' && (
        <div style={{
          background: '#fdecea',
          border: '1px solid #f5c6c6',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          color: '#b71c1c'
        }}>
          {message}
        </div>
      )}

      <button
        onClick={handleBackup}
        disabled={status === 'loading'}
        style={{
          background: status === 'loading' ? 'var(--border, #d0d0d0)' : 'var(--accent, #0066cc)',
          color: status === 'loading' ? 'var(--text-secondary, #5a5a5a)' : '#ffffff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s'
        }}
      >
        {status === 'loading' ? 'Preparing download...' : 'Download Backup'}
      </button>
    </div>
  )
}
