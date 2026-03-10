import { useState } from 'react'

interface EmployeeInfo {
  emp_no: string
  emp_nm: string
}

interface ChangeResult {
  message: string
  employeeName: string
  timecardsUpdated: number
}

export default function EditEmployeeNumber() {
  const [oldEmpNo, setOldEmpNo]     = useState('')
  const [newEmpNo, setNewEmpNo]     = useState('')
  const [found, setFound]           = useState<EmployeeInfo | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [looking, setLooking]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]         = useState<ChangeResult | null>(null)
  const [submitError, setSubmitError] = useState('')

  const lookupEmployee = async () => {
    if (!oldEmpNo.trim()) return
    setLooking(true)
    setFound(null)
    setLookupError('')
    try {
      const res = await fetch(`/api/payroll/employees/${encodeURIComponent(oldEmpNo.trim())}`)
      if (!res.ok) {
        setLookupError(`No employee found with number "${oldEmpNo.trim()}".`)
        return
      }
      const data = await res.json() as EmployeeInfo
      setFound(data)
    } catch {
      setLookupError('Failed to connect to server.')
    } finally {
      setLooking(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/payroll/change-employee-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldEmpNo: oldEmpNo.trim(), newEmpNo: newEmpNo.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Request failed.')
        setShowConfirm(false)
        return
      }
      setResult(data as ChangeResult)
      setShowConfirm(false)
      // Reset form
      setOldEmpNo('')
      setNewEmpNo('')
      setFound(null)
    } catch {
      setSubmitError('Failed to connect to server.')
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = found && newEmpNo.trim() && newEmpNo.trim() !== oldEmpNo.trim()

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 14,
    background: 'var(--surface, #ffffff)',
    color: 'var(--text, #1a1a1a)',
    border: '1px solid var(--border, #d0d0d0)',
    borderRadius: 4,
    boxSizing: 'border-box'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary, #5a5a5a)',
    marginBottom: 6
  }

  return (
    <div style={{ padding: '32px', maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #1a1a1a)', marginBottom: 8 }}>
        Edit Employee Number
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary, #5a5a5a)', marginBottom: 32, lineHeight: 1.6 }}>
        Changes an employee's ID number and cascades the update to all related records
        (timecards). Use with caution — this action cannot be undone.
      </p>

      {/* Success banner */}
      {result && (
        <div style={{
          background: '#e6f4ea', border: '1px solid #a8d5b5',
          borderRadius: 6, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#1e6e3c'
        }}>
          <strong>Done!</strong> {result.message}
          <br />
          <span style={{ opacity: 0.85 }}>
            Employee: {result.employeeName} &nbsp;|&nbsp; Timecards updated: {result.timecardsUpdated}
          </span>
        </div>
      )}

      {/* Error banner */}
      {submitError && (
        <div style={{
          background: '#fdecea', border: '1px solid #f5c6c6',
          borderRadius: 6, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#b71c1c'
        }}>
          {submitError}
        </div>
      )}

      <div style={{
        background: 'var(--surface-raised, #f5f5f5)',
        border: '1px solid var(--border, #d0d0d0)',
        borderRadius: 8, padding: '24px'
      }}>

        {/* Step 1 — Current employee number */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Current Employee Number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={oldEmpNo}
              onChange={e => { setOldEmpNo(e.target.value); setFound(null); setLookupError('') }}
              onKeyDown={e => e.key === 'Enter' && lookupEmployee()}
              placeholder="e.g. 00001"
            />
            <button
              onClick={lookupEmployee}
              disabled={!oldEmpNo.trim() || looking}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 4, border: 'none',
                background: 'var(--accent, #0066cc)', color: '#fff',
                cursor: !oldEmpNo.trim() || looking ? 'not-allowed' : 'pointer',
                opacity: !oldEmpNo.trim() || looking ? 0.6 : 1, whiteSpace: 'nowrap'
              }}
            >
              {looking ? 'Looking...' : 'Find'}
            </button>
          </div>
          {lookupError && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#b71c1c' }}>{lookupError}</p>
          )}
        </div>

        {/* Found employee info */}
        {found && (
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #d0d0d0)',
            borderRadius: 6, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: 'var(--text, #1a1a1a)'
          }}>
            <span style={{ color: 'var(--text-secondary, #5a5a5a)' }}>Found: </span>
            <strong>{found.emp_no}</strong>
            {' — '}
            {found.emp_nm}
          </div>
        )}

        {/* Step 2 — New employee number */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>New Employee Number</label>
          <input
            style={inputStyle}
            value={newEmpNo}
            onChange={e => setNewEmpNo(e.target.value)}
            placeholder="Enter new number"
            disabled={!found}
          />
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '10px', fontSize: 14, fontWeight: 600,
            borderRadius: 6, border: 'none',
            background: canSubmit ? '#dc3545' : 'var(--border, #d0d0d0)',
            color: canSubmit ? '#ffffff' : 'var(--text-secondary, #5a5a5a)',
            cursor: canSubmit ? 'pointer' : 'not-allowed'
          }}
        >
          Change Employee Number
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #d0d0d0)',
            borderRadius: 10, padding: '28px 32px', maxWidth: 400, width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17, color: 'var(--text, #1a1a1a)' }}>Confirm Change</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary, #5a5a5a)', lineHeight: 1.6 }}>
              Change employee number from&nbsp;
              <strong style={{ color: 'var(--text, #1a1a1a)' }}>{oldEmpNo}</strong>
              &nbsp;to&nbsp;
              <strong style={{ color: 'var(--text, #1a1a1a)' }}>{newEmpNo}</strong>?
              <br />
              Employee: <strong style={{ color: 'var(--text, #1a1a1a)' }}>{found?.emp_nm}</strong>
              <br /><br />
              This will update all timecard records as well.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                style={{
                  padding: '8px 20px', borderRadius: 5, border: '1px solid var(--border, #d0d0d0)',
                  background: 'var(--surface, #ffffff)', color: 'var(--text, #1a1a1a)',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '8px 20px', borderRadius: 5, border: 'none',
                  background: '#dc3545', color: '#ffffff',
                  fontSize: 13, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Changing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
