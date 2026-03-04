import { useState } from 'react'

export default function PayrollCompute() {
  const [computing, setComputing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [complete, setComplete] = useState(false)

  const handleCompute = () => {
    setComputing(true)
    setProgress(0)
    setComplete(false)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setComputing(false)
          setComplete(true)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  return (
    <div className="card">
      <h2>Compute Payroll</h2>
      <p className="subtitle">Calculate gross pay, deductions, taxes, and net pay for all employees</p>

      <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Computation Summary</h4>
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span>Total Employees (Timecards):</span>
            <strong>24 employees</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span>Period:</span>
            <strong>February 1-15, 2026</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span>Computed Entries:</span>
            <strong className={complete ? 'badge badge-success' : 'badge badge-primary'}>
              {complete ? '24 of 24' : '0 of 24'}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 600 }}>
            <span>Status:</span>
            <strong style={{ color: complete ? 'var(--success)' : 'var(--text-secondary)' }}>
              {computing ? 'Computing...' : complete ? 'Complete' : 'Pending'}
            </strong>
          </div>
        </div>
      </div>

      {computing && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Computing payroll...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '32px', background: 'var(--background)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.2s' }}></div>
          </div>
        </div>
      )}

      {complete && (
        <div style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', padding: '16px', marginBottom: '24px', color: 'var(--success)' }}>
          &#10003; Payroll computation complete! Gross pay, tax, SSS, PHIC, Pag-ibig, and net pay calculated for all employees.
        </div>
      )}

      <div style={{ background: 'var(--panel-2)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Computation Process</h4>
        <ul style={{ marginTop: '12px', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <li>Calculate gross pay (regular + overtime + holiday pay + other pay)</li>
          <li>Compute withholding tax based on tax table</li>
          <li>Calculate SSS, PhilHealth, and Pag-ibig contributions</li>
          <li>Apply loan deductions and other deductions</li>
          <li>Calculate net pay (gross - total deductions)</li>
          <li>Update timecard records with computed values</li>
        </ul>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={handleCompute}
        disabled={computing || complete}
      >
        {computing ? 'Computing...' : complete ? 'Already Computed' : 'Compute Payroll'}
      </button>
    </div>
  )
}
