import { useState, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useAuthStore()
  const { 
    darkMode, toggleDarkMode, 
    profilePhoto, setProfilePhoto, 
    displayName, setDisplayName, 
    showStatusBar, setShowStatusBar, 
    dateFormat, setDateFormat, 
    numberFormat, setNumberFormat 
  } = useSettingsStore()

  const [settingsTab, setSettingsTab] = useState<'appearance' | 'profile' | 'preferences'>('appearance')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6" onClick={onClose}>
      <div 
        className={`w-full max-w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${darkMode ? 'bg-[#1e2a4a] text-gray-100' : 'bg-white text-on-surface'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Settings Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-600' : 'border-outline-variant/15'}`}>
          <h3 className="font-headline font-bold text-lg">Settings</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200/20 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Settings Tabs */}
        <div className={`flex border-b ${darkMode ? 'border-gray-600' : 'border-outline-variant/10'}`}>
          {[
            { id: 'appearance' as const, label: 'Appearance', icon: 'palette' },
            { id: 'profile' as const, label: 'Profile', icon: 'person' },
            { id: 'preferences' as const, label: 'Preferences', icon: 'tune' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setSettingsTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                settingsTab === t.id 
                  ? 'text-primary border-primary' 
                  : `${darkMode ? 'text-gray-400 border-transparent hover:text-gray-200' : 'text-on-surface-variant/60 border-transparent hover:text-on-surface'}`
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar space-y-6">
          
          {settingsTab === 'appearance' && (
            <>
              {/* Dark Mode Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">{darkMode ? 'dark_mode' : 'light_mode'}</span>
                  <div>
                    <p className="font-semibold text-sm">Dark Mode</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>Switch between light and dark themes</p>
                  </div>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`w-12 h-7 rounded-full transition-all relative ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Show Status Bar */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">bottom_navigation</span>
                  <div>
                    <p className="font-semibold text-sm">Status Bar</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>Show the bottom status bar</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowStatusBar(!showStatusBar)}
                  className={`w-12 h-7 rounded-full transition-all relative ${showStatusBar ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${showStatusBar ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </>
          )}

          {settingsTab === 'profile' && (
            <>
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-outline-variant/30 bg-surface-container-high'}`}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className={`material-symbols-outlined text-[40px] ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>person</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Upload Photo
                  </button>
                  {profilePhoto && (
                    <button 
                      onClick={() => handleRemovePhoto()}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>Max 2MB. JPG, PNG, or WebP.</p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Display Name</label>
                <input 
                  type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder={user?.username || 'Your name'}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all border-none ${darkMode ? 'bg-gray-700 text-gray-100 placeholder:text-gray-500' : 'bg-surface-container-low placeholder:text-outline-variant'}`}
                />
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>Shown in reports and printouts</p>
              </div>

              {/* Account Info (read-only) */}
              <div className={`p-4 rounded-xl border space-y-2 ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-outline-variant/15 bg-surface-container-lowest'}`}>
                <p className={`text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>Account Information</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>Username</span>
                    <span className="font-semibold">{user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>Role</span>
                    <span className="font-semibold">{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'tester' ? 'Tester' : 'Accountant'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>FS Access</span>
                    <span className={`font-semibold ${user?.canAccessFs ? 'text-emerald-500' : 'text-red-500'}`}>{user?.canAccessFs ? 'Granted' : 'Denied'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-on-surface-variant'}>Payroll Access</span>
                    <span className={`font-semibold ${user?.canAccessPayroll ? 'text-emerald-500' : 'text-red-500'}`}>{user?.canAccessPayroll ? 'Granted' : 'Denied'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {settingsTab === 'preferences' && (
            <>
              {/* Date Format */}
              <div className="space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Date Format</label>
                <select 
                  value={dateFormat} onChange={e => setDateFormat(e.target.value as any)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all border-none ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-surface-container-low'}`}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              {/* Number Format */}
              <div className="space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Number Format</label>
                <select 
                  value={numberFormat} onChange={e => setNumberFormat(e.target.value as any)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 transition-all border-none ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-surface-container-low'}`}
                >
                  <option value="en-PH">1,234,567.89 (Philippine)</option>
                  <option value="en-US">1,234,567.89 (US)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
