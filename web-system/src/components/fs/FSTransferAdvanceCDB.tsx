import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PageHeader from '../PageHeader'

export default function FSTransferAdvanceCDB() {
  const [isTransferring, setIsTransferring] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleTransfer = async () => {
    setIsTransferring(true)
    setResult(null)
    try {
      const resp = await axios.post('/api/fs/transfer-advance-cdb')
      setResult(resp.data?.message || 'Transfer complete.')
    } catch (err: any) {
      setResult(err.response?.data?.error || err.message || 'Transfer failed.')
    } finally {
      setIsTransferring(false)
    }
  }

  const isFail = result?.toLowerCase().includes('fail')

  return (
    <div className="flex flex-col gap-0 max-w-[640px] mx-auto w-full">
      <PageHeader
        title="Transfer Advance CDB"
        subtitle="Move all advance CDB vouchers into the current period."
        breadcrumb="PROCESSING / TRANSFER ADVANCE CDB"
      />
      <div className="bg-surface border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col gap-5">
          <div className="text-sm text-on-surface-variant leading-relaxed">
            <p>
              This will transfer all <strong className="text-on-surface">Advance CDB</strong> vouchers (entered in the previous period) into the current period's main voucher set. Use this at the start of a new period after all advance checks have been entered.
            </p>
            <p className="mt-2 font-bold text-red-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              This action cannot be undone.
            </p>
          </div>
          {result && (
            <div className={`px-4 py-3 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
              isFail
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {isFail ? 'error' : 'check_circle'}
              </span>
              {result}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              onClick={handleTransfer}
              disabled={isTransferring}
            >
              {isTransferring ? 'Transferring...' : 'Transfer Now'}
            </button>
            <button
              className="px-6 py-2.5 text-on-surface-variant border border-outline-variant/30 rounded-lg font-bold text-sm hover:bg-surface-container transition-colors"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
