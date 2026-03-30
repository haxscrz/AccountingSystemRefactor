import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COMPANIES } from '../config/companies'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { useSettingsStore } from '../stores/settingsStore'

function SpotlightCard({ 
  children, 
  onClick, 
  className = "" 
}: { 
  children: React.ReactNode, 
  onClick: () => void, 
  className?: string 
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [cardCenter, setCardCenter] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setCardCenter({ x: rect.width / 2, y: rect.height / 2 })
  }

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 })
    setCardCenter({ x: 0, y: 0 })
  }

  const shadowX = cardCenter.x ? (cardCenter.x - mousePos.x) / 8 : 0
  const shadowY = cardCenter.y ? (cardCenter.y - mousePos.y) / 8 : 12

  return (
    <div 
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-[16px] p-[1px] transition-all duration-300 hover:scale-[1.02] cursor-pointer ${className}`}
      style={{
         boxShadow: cardCenter.x ? `${shadowX}px ${shadowY}px ${Math.abs(shadowX)+Math.abs(shadowY)+30}px -10px rgba(10, 30, 60, 0.4)` : '0 10px 30px -10px rgba(0,0,0,0.1)'
      }}
    >
      <div 
        className="absolute inset-[-10%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-20 blur-2xl rounded-full"
        style={{
          background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, rgba(30, 64, 175, 0.25), transparent 70%)`
        }}
      />
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 overflow-hidden rounded-[16px]">
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.6), transparent 70%)`
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-gray-700/40 dark:to-gray-800/10 rounded-[16px] -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
      
      <div className="relative z-10 bg-white/20 dark:bg-gray-800/40 backdrop-blur-2xl rounded-[15px] p-6 flex flex-col h-full transition-all duration-300 group-hover:bg-white/30 dark:group-hover:bg-gray-700/50 border border-white/50 dark:border-gray-600/50 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
        {children}
      </div>
    </div>
  )
}

export default function CompanySelection() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { setSelectedCompany } = useCompanyStore()
  const darkMode = useSettingsStore((state) => state.darkMode)

  const handleSelectCompany = (companyCode: (typeof COMPANIES)[number]['code']) => {
    setSelectedCompany(companyCode)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`font-body min-h-screen flex flex-col ${darkMode ? 'bg-[#0a0f1e] text-gray-100' : 'bg-background text-on-surface'}`}>
      {/* TopAppBar */}
      <header className={`shadow-sm top-0 z-50 ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <div className={`flex justify-between items-center w-full px-6 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-8">
            <span className={`text-xl font-bold tracking-tighter font-headline ${darkMode ? 'text-blue-400' : 'text-slate-900'}`}>AWM</span>
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>by iSupplyTech Co. Ltd.</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-['Manrope'] font-semibold tracking-tight ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <span className="material-symbols-outlined" data-icon="logout">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-grow flex items-center justify-center p-6 sm:p-12 relative overflow-hidden ${darkMode ? 'bg-[#0a0f1e]' : 'bg-slate-50/50'}`}>
        {/* Abstract Background */}
        <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[70%] rounded-full blur-[120px] -z-10 animate-pulse ${darkMode ? 'bg-blue-900/20 mix-blend-screen' : 'bg-blue-500/20 mix-blend-multiply'}`} style={{ animationDuration: '8s' }}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full blur-[100px] -z-10 animate-pulse ${darkMode ? 'bg-emerald-900/15 mix-blend-screen' : 'bg-emerald-400/20 mix-blend-multiply'}`} style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className={`absolute top-[30%] left-[40%] w-[20%] h-[30%] rounded-full blur-[80px] -z-10 animate-pulse ${darkMode ? 'bg-indigo-900/15' : 'bg-indigo-400/15 mix-blend-screen'}`} style={{ animationDuration: '12s' }}></div>

        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center md:text-left">
            <h1 className="font-headline text-display-md text-primary tracking-tight mb-2">Select Organization</h1>
            <p className="font-body text-body-md text-on-surface-variant max-w-lg">
                Signed in as <strong>{user?.username}</strong>. Choose the organization you wish to access.
            </p>
          </div>

          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPANIES.map((company) => (
              <SpotlightCard 
                key={company.code} 
                onClick={() => handleSelectCompany(company.code)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 border border-outline-variant/20 rounded-lg bg-surface-container-low flex items-center justify-center p-2 text-primary font-bold text-xl">
                    {company.code.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-mono text-[10px] tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded text-on-surface-variant">{company.code}</span>
                </div>
                <div className="mt-auto relative z-20">
                  <h3 className="font-headline text-headline-sm text-primary mb-1">{company.name}</h3>
                  <p className="font-body text-label-sm text-on-surface-variant/70 mb-4">Master Ledger • Operations</p>
                  <div className="flex items-center gap-4 py-4 border-t border-outline-variant/10">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-tighter">Status</span>
                      <span className="font-mono text-xs font-semibold text-emerald-600">Active</span>
                    </div>
                    <div className="ml-auto">
                      <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            ))}

            {COMPANIES.length < 3 && (
              <div className="group border-2 border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-colors cursor-pointer bg-surface-container-low/30">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined" data-icon="add">add</span>
                </div>
                <h3 className="font-headline text-title-sm text-on-surface mb-1">Add New Organization</h3>
                <p className="text-label-sm text-on-surface-variant/60">Administrative permissions required</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t w-full h-8 z-50 text-[10px] font-mono uppercase tracking-widest mt-auto shrink-0 ${darkMode ? 'bg-[#020617] border-gray-800 text-gray-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
        <div className="flex items-center justify-between px-6 w-full h-full">
          <div>
            © 2026 iSupplyTech Co. Ltd. All rights reserved.
          </div>
          <div className="flex gap-6">
            <span className="text-slate-500">V 3.3.0-UI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
