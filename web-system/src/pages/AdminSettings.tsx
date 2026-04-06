import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import Breadcrumbs from '../components/Breadcrumbs'
import UserManagement from './UserManagement'
import OrganizationManagement from './OrganizationManagement'
import SystemHealth from './SystemHealth'

export default function AdminSettings() {
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { 
    darkMode, toggleDarkMode, 
    profilePhoto, setProfilePhoto, 
    displayName, setDisplayName, 
    showStatusBar, setShowStatusBar, 
    dateFormat, setDateFormat, 
    numberFormat, setNumberFormat 
  } = useSettingsStore()

  const initialTab = searchParams.get('tab') as any || 'preferences'
  const [activeTab, setActiveTab] = useState<'preferences' | 'organization' | 'users' | 'health'>(
    initialTab === 'health' && user?.role === 'superadmin' ? 'health' : 
    ['preferences', 'organization', 'users'].includes(initialTab) ? initialTab : 'preferences'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync tab to URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'health' && user?.role === 'superadmin') setActiveTab('health')
  }, [searchParams, user])

  const syncProfileToApi = async (photoDataUrl: string | null) => {
    try {
      await fetch('/api/admin/my-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: photoDataUrl, preferencesJson: null })
      })
    } catch { /* best-effort sync */ }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result as string
      setProfilePhoto(b64)
      syncProfileToApi(b64)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    syncProfileToApi(null)
  }


  return (
    <div className={`min-h-screen flex font-body ${darkMode ? 'bg-[#0a0f1e] text-gray-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar Navigation */}
      <aside className={`w-72 border-r flex flex-col ${darkMode ? 'bg-[#0f172a] border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="p-6 border-b border-inherit">
          <Breadcrumbs segments={[{ label: 'Settings' }]} />
          <h1 className="font-headline font-bold text-lg leading-tight text-primary mt-3">Settings</h1>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>System Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'preferences' ? (darkMode ? 'bg-primary/20 text-blue-400' : 'bg-primary/10 text-primary') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-slate-600 hover:bg-slate-100')}`}
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            Preferences & Profile
          </button>

          {user?.role === 'superadmin' && (
            <>
              <button 
                onClick={() => setActiveTab('organization')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'organization' ? (darkMode ? 'bg-primary/20 text-blue-400' : 'bg-primary/10 text-primary') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-slate-600 hover:bg-slate-100')}`}
              >
                <span className="material-symbols-outlined text-[20px]">domain</span>
                Organization Data
              </button>

              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'users' ? (darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-600') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-slate-600 hover:bg-slate-100')}`}
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                User Management
              </button>

              <button 
                onClick={() => setActiveTab('health')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'health' ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-slate-600 hover:bg-slate-100')}`}
              >
                <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
                System Health
              </button>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-inherit text-xs uppercase tracking-widest font-mono text-center">
          <span className={darkMode ? 'text-gray-600' : 'text-slate-400'}>AWM V 3.8.0-Feature Fixes</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto w-full">
        <div className={activeTab === 'preferences' ? "max-w-3xl mx-auto" : "max-w-6xl mx-auto w-full"}>
          
          {/* 1. PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="font-headline text-2xl font-bold mb-1">Preferences & Personalization</h2>
                <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Customize your interface, region settings, and account profile.</p>
              </div>

              {/* Profile Card */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-primary">Profile Info</h3>
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 ${darkMode ? 'border-gray-800 bg-gray-700' : 'border-slate-50 bg-slate-100 shadow-inner'}`}>
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined text-[40px] ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>person</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors">
                        Change Picture
                      </button>
                      {profilePhoto && (
                        <button onClick={handleRemovePhoto} className="text-xs font-bold text-red-500 uppercase tracking-wide hover:underline">Remove</button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Display Name</label>
                      <input 
                        type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                        placeholder={user?.username || 'Your name'}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all ${darkMode ? 'bg-gray-800 text-gray-100 placeholder:text-gray-600' : 'bg-slate-50 border border-slate-200 placeholder:text-slate-400'}`}
                      />
                    </div>
                    <div className={`p-4 rounded-xl text-sm ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-slate-50 text-slate-600'}`}>
                      <p className="flex justify-between mb-2"><span className="opacity-70">Username</span> <strong>{user?.username}</strong></p>
                      <p className="flex justify-between"><span className="opacity-70">Role</span> <strong className="text-primary uppercase text-xs mt-0.5">{user?.role}</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interface Card */}
              <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Interface Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <span className="material-symbols-outlined">dark_mode</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Dark Mode</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Comfortable viewing for low-light environments</p>
                    </div>
                  </div>
                  <button onClick={toggleDarkMode} className={`w-12 h-7 rounded-full transition-all relative ${darkMode ? 'bg-blue-500' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      <span className="material-symbols-outlined">bottom_navigation</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Status Bar Layout</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Show active user and version pinned at bottom</p>
                    </div>
                  </div>
                  <button onClick={() => setShowStatusBar(!showStatusBar)} className={`w-12 h-7 rounded-full transition-all relative ${showStatusBar ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${showStatusBar ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Regional Card */}
              <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Regional Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Date Format</label>
                    <select value={dateFormat} onChange={e => setDateFormat(e.target.value as any)} className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-slate-50 border border-slate-200'}`}>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Currency Format</label>
                    <select value={numberFormat} onChange={e => setNumberFormat(e.target.value as any)} className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-slate-50 border border-slate-200'}`}>
                      <option value="en-PH">1,234,567.89 (PHP/Asian)</option>
                      <option value="en-US">1,234,567.89 (USD/Western)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ORGANIZATION MANAGEMENT */}
          {activeTab === 'organization' && user?.role === 'superadmin' && (
             <OrganizationManagement />
          )}

          {/* 3. USER MANAGEMENT */}
          {activeTab === 'users' && user?.role === 'superadmin' && (
             <UserManagement />
          )}

          {/* 4. SYSTEM HEALTH */}
          {activeTab === 'health' && user?.role === 'superadmin' && (
             <SystemHealth />
          )}

        </div>
      </main>
    </div>
  )
}
