import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import axios from 'axios'

const PUBLIC_API = '/api'
const ADMIN_API = '/api/admin'

export default function OrganizationManagement() {
  const navigate = useNavigate()
  const darkMode = useSettingsStore(s => s.darkMode)
  const { accessToken } = useAuthStore()

  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add Company State
  const [newCompanyCode, setNewCompanyCode] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)

  // Wipe Modal State
  const [wipeModal, setWipeModal] = useState<any>(null) // contains company object
  const [wipeType, setWipeType] = useState<'FactoryReset'|'TimeFrame'>('TimeFrame')
  const [wipeStart, setWipeStart] = useState('')
  const [wipeEnd, setWipeEnd] = useState('')
  const [wipeWiping, setWipeWiping] = useState(false)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${PUBLIC_API}/companies`)
      setCompanies(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to fetch companies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 5000); return () => clearTimeout(t) }
  }, [success])

  const handleAddCompany = async () => {
    if (!newCompanyCode.trim() || !newCompanyName.trim()) return setError('Code and Name are required.')
    const cleanCode = newCompanyCode.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanCode.length < 3) return setError('Code must be at least 3 alphanumeric characters.')
    
    setCompanyLoading(true); setError(''); setSuccess('')
    try {
      await axios.post(`${ADMIN_API}/companies`, { code: cleanCode, name: newCompanyName.trim() }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      setSuccess(`Organization "${newCompanyName.trim()}" created.`)
      setNewCompanyCode(''); setNewCompanyName('')
      fetchCompanies()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create organization')
    } finally {
      setCompanyLoading(false)
    }
  }

  const handleDeleteCompany = async (code: string) => {
    const confirm = window.prompt(`Type "${code}" to confirm dropping the organization and ALL its structure:`)
    if (confirm !== code) return

    setError(''); setSuccess('')
    try {
      await axios.delete(`${ADMIN_API}/companies/${code}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      setSuccess(`Organization "${code}" deleted cleanly.`)
      fetchCompanies()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete organization')
    }
  }

  const executeWipe = async () => {
    if (!wipeModal) return
    setError(''); setSuccess('')

    // Safety checks
    if (wipeType === 'TimeFrame') {
      if (!wipeStart || !wipeEnd) return setError('Please specify valid start and end dates.')
    } else {
      const confirm = window.prompt(`FACTORY RESET: Type "${wipeModal.code}" to confirm total wipe of this organization:`)
      if (confirm !== wipeModal.code) return setError('Reset aborted.')
    }

    setWipeWiping(true)
    try {
      const res = await axios.post(`${ADMIN_API}/import/wipe`, {
        CompanyCode: wipeModal.code,
        WipeType: wipeType,
        StartDate: wipeType === 'TimeFrame' ? wipeStart : null,
        EndDate: wipeType === 'TimeFrame' ? wipeEnd : null
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      
      setSuccess(res.data.message || 'Wipe completed.')
      setWipeModal(null)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to wipe data.')
    } finally {
      setWipeWiping(false)
    }
  }

  return (
    <div className={`w-full relative animate-fade-in ${darkMode ? 'text-gray-100' : 'text-slate-900'}`}>
      
      {success && (
        <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.3s_ease] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {success}
        </div>
      )}

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight mb-1">Organization Management</h2>
          <p className="text-on-surface-variant text-sm">Create tenants, manage legacy data importing, and run granular data wiping tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Organizations List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
             <span className="material-symbols-outlined text-purple-500">domain</span> active Organizations ({companies.length})
          </h3>

          {loading ? (
             <div className="py-12 flex justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div></div>
          ) : companies.map(c => (
            <div key={c.code} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border transition-all ${darkMode ? 'border-gray-800 bg-[#0f172a]/50 hover:bg-[#1e293b]' : 'border-slate-200 bg-white hover:shadow-md'}`}>
               <div className="flex items-center gap-4 mb-4 sm:mb-0">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                   {c.code.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h4 className="font-bold text-on-surface">{c.name}</h4>
                   <p className="font-mono text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">{c.code}</p>
                 </div>
               </div>

               <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                 <button onClick={() => navigate('/admin/import', { state: { companyCode: c.code }})} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-purple-900/40 text-purple-400 hover:bg-purple-900/60 hover:text-purple-300' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                   <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                   Import
                 </button>
                 <button onClick={() => setWipeModal(c)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-red-900/30 text-red-500 hover:bg-red-900/50 hover:text-red-400' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                   <span className="material-symbols-outlined text-[16px]">mop</span>
                   Wipe Data
                 </button>
                 <button onClick={() => handleDeleteCompany(c.code)} className={`flex-none flex items-center justify-center p-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-red-500' : 'hover:bg-slate-100 text-slate-400 hover:text-red-600'}`} title="Delete Tenant Core">
                   <span className="material-symbols-outlined text-[18px]">delete</span>
                 </button>
               </div>
            </div>
          ))}
        </div>

        {/* Right Col: Add New */}
        <div className="lg:col-span-1">
           <div className={`p-6 rounded-2xl border sticky top-6 ${darkMode ? 'border-gray-800 bg-[#0f172a]/50' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-widest text-primary">
                 <span className="material-symbols-outlined text-[18px]">add_business</span> Create New
              </h3>
              
              {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">{error}</div>}

              <div className="space-y-4">
                 <div>
                   <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Machine Code</label>
                   <input className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-primary/30 ${darkMode ? 'bg-[#1e293b] border-gray-700 focus:border-blue-500 text-white' : 'bg-white border-slate-300 focus:border-blue-500 text-slate-900'}`}
                     value={newCompanyCode} onChange={e => setNewCompanyCode(e.target.value)} placeholder="e.g. thermalex" />
                 </div>
                 <div>
                   <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Display Name</label>
                   <input className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-primary/30 ${darkMode ? 'bg-[#1e293b] border-gray-700 focus:border-blue-500 text-white' : 'bg-white border-slate-300 focus:border-blue-500 text-slate-900'}`}
                     value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="e.g. Thermalex Ind." />
                 </div>
                 <button onClick={handleAddCompany} disabled={companyLoading} className="w-full mt-2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                   {companyLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                   Create Workspace
                 </button>
              </div>
           </div>
        </div>

      </div>

      {/* ═══ MOP WIPER MODAL ═══ */}
      {wipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6" onClick={() => !wipeWiping && setWipeModal(null)}>
           <div className={`relative w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden ${darkMode ? 'bg-[#0f172a] border border-gray-800' : 'bg-white border border-slate-200'}`} onClick={e => e.stopPropagation()}>
              
              <div className="p-8 border-b border-inherit">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center">
                       <span className="material-symbols-outlined text-[24px]">warning</span>
                    </div>
                    <div>
                       <h2 className="font-headline font-bold text-2xl tracking-tight text-red-500">Data Sweeper Utility</h2>
                       <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Target Database: <span className="font-bold text-on-surface ml-1">{wipeModal.name} ({wipeModal.code})</span></p>
                    </div>
                 </div>
              </div>

              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => setWipeType('TimeFrame')} className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${wipeType === 'TimeFrame' ? 'border-blue-500 bg-blue-500/5' : (darkMode ? 'border-gray-800 hover:border-gray-600' : 'border-slate-200 hover:border-slate-300')}`}>
                       <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${wipeType === 'TimeFrame' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                       </div>
                       <h4 className="font-bold text-sm mb-1">Time-Frame Wipe</h4>
                       <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Deletes only transactional data (Journals, Cash Receipts, Checks) within a specified date range. Keeps setup data.</p>
                    </div>

                    <div onClick={() => setWipeType('FactoryReset')} className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${wipeType === 'FactoryReset' ? 'border-red-500 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : (darkMode ? 'border-gray-800 hover:border-gray-600' : 'border-slate-200 hover:border-slate-300')}`}>
                       <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${wipeType === 'FactoryReset' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                          <span className="material-symbols-outlined text-[16px]">skull</span>
                       </div>
                       <h4 className="font-bold text-sm text-red-500 mb-1">Factory Reset</h4>
                       <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>WARNING: Irreversibly purges ALL tenant data, including Setup data, Chart of Accounts, and Transactions.</p>
                    </div>
                 </div>

                 {wipeType === 'TimeFrame' && (
                   <div className="animate-fade-in-up">
                      <h4 className="font-bold text-sm mb-4">Date Range Filter</h4>
                      <div className="flex items-center gap-4">
                         <div className="flex-1">
                           <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Start Date</label>
                           <input type="date" className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:border-blue-500 ${darkMode ? 'bg-[#1e293b] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={wipeStart} onChange={e => setWipeStart(e.target.value)} />
                         </div>
                         <div className="mt-6 text-gray-400 font-bold">—</div>
                         <div className="flex-1">
                           <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>End Date</label>
                           <input type="date" className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:border-blue-500 ${darkMode ? 'bg-[#1e293b] border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={wipeEnd} onChange={e => setWipeEnd(e.target.value)} />
                         </div>
                      </div>
                   </div>
                 )}
              </div>

              <div className={`p-6 border-t border-inherit flex justify-end gap-3 ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
                 {error && <div className="mr-auto self-center text-red-500 text-xs font-bold">{error}</div>}
                 <button onClick={() => setWipeModal(null)} disabled={wipeWiping} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-200 text-slate-600'}`}>Cancel</button>
                 <button onClick={executeWipe} disabled={wipeWiping} className={`px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${wipeType === 'FactoryReset' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 text-white' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white'}`}>
                    {wipeWiping ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-[18px]">{wipeType === 'FactoryReset' ? 'delete_forever' : 'sweep'}</span>}
                    {wipeWiping ? 'Processing...' : wipeType === 'FactoryReset' ? 'Initiate Factory Reset' : 'Wipe Transactions'}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  )
}
