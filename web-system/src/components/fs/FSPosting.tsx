import { useState, useEffect } from 'react'
import axios from 'axios'

interface SystemInfo {
  currentMonth: number
  currentYear: number
  begDate: string | null
  endDate: string | null
  unpostedChecks: number
  unpostedCashReceipts: number
  unpostedSalesBook: number
  unpostedJournals: number
  unpostedPurchaseBook: number
  unpostedAdjustments: number
  totalUnposted: number
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function FSPosting() {
  const API_BASE = 'http://localhost:5081/api/fs'
  const [posting, setPosting] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const [resultSuccess, setResultSuccess] = useState(false)
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [recordsPosted, setRecordsPosted] = useState(0)

  const loadSystemInfo = async () => {
    setLoadingInfo(true)
    try {
      const resp = await axios.get(`${API_BASE}/system-info`)
      setSysInfo(resp.data)
    } catch {
      setSysInfo(null)
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => {
    void loadSystemInfo()
  }, [])

  const handlePost = async () => {
    if (!window.confirm(
      'POST ALL TRANSACTIONS?\n\n' +
      'This will:\n' +
      '1. Clear the posted journals table (pournals)\n' +
      '2. Reset all account current period balances to zero\n' +
      '3. Re-post ALL transactions from all 6 journals to accounts\n' +
      '4. Recalculate ending balances\n\n' +
      'Continue?'
    )) return

    setPosting(true)
    setResultMessage('')

    try {
      const resp = await axios.post(`${API_BASE}/posting`)
      setRecordsPosted(resp.data.recordsPosted ?? 0)
      setResultSuccess(true)
      setResultMessage(resp.data.message || 'Posting completed successfully.')
      await loadSystemInfo()  // Refresh counts after posting
    } catch (err: any) {
      setResultSuccess(false)
      setResultMessage(err.response?.data?.error || err.response?.data?.Error || err.message || 'Posting failed.')
    } finally {
      setPosting(false)
    }
  }

  const periodLabel = sysInfo
    ? `${MONTH_NAMES[sysInfo.currentMonth]} ${sysInfo.currentYear}`
    : '—'

  return (
    <div className="card">
      <h2>Post All Transactions</h2>
      <p className="subtitle">Post all unposted entries to the general ledger accounts (f_a_postng)</p>

      <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4>Pre-Posting Summary — {loadingInfo ? 'Loading...' : periodLabel}</h4>
        {!loadingInfo && sysInfo && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Cash Disbursement Vouchers:</span>
              <strong>{sysInfo.unpostedChecks} entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Cash Receipts:</span>
              <strong>{sysInfo.unpostedCashReceipts} entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Sales Book Journals:</span>
              <strong>{sysInfo.unpostedSalesBook} entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Journal Vouchers:</span>
              <strong>{sysInfo.unpostedJournals} entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Purchase Book Journals:</span>
              <strong>{sysInfo.unpostedPurchaseBook} entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Adjustments:</span>
              <strong>{sysInfo.unpostedAdjustments} entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 600, borderTop: '2px solid var(--border)', marginTop: '4px' }}>
              <span>Total Entries to Post:</span>
              <strong className={sysInfo.totalUnposted > 0 ? 'badge badge-primary' : ''}>
                {sysInfo.totalUnposted} entries
              </strong>
            </div>
          </div>
        )}
        {!loadingInfo && !sysInfo && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
            Could not load system info. Backend may be offline.
          </p>
        )}
      </div>

      {resultMessage && (
        <div style={{
          background: resultSuccess ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${resultSuccess ? 'var(--success)' : 'var(--error, #dc2626)'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          color: resultSuccess ? 'var(--success)' : 'var(--error, #dc2626)'
        }}>
          {resultSuccess
            ? `✓ ${resultMessage}  (${recordsPosted} records posted to pournals)`
            : `✗ ${resultMessage}`}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn btn-primary"
          onClick={handlePost}
          disabled={posting || loadingInfo}
        >
          {posting ? 'Posting...' : 'Post All Transactions'}
        </button>
        <button className="btn btn-secondary" onClick={loadSystemInfo} disabled={posting || loadingInfo}>
          Refresh Counts
        </button>
      </div>
    </div>
  )
}
