import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'

export default function LockScreen() {
  const isSessionLocked = useAuthStore(s => s.isSessionLocked)
  const user = useAuthStore(s => s.user)
  const unlockSession = useAuthStore(s => s.unlockSession)
  const darkMode = useSettingsStore(s => s.darkMode)
  const profilePhoto = useSettingsStore(s => s.profilePhoto)
  
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSessionLocked && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSessionLocked])

  if (!isSessionLocked || !user) return null

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setIsVerifying(true)
    setError('')
    
    // Simulate slight natural delay for UX
    await new Promise(r => setTimeout(r, 600))
    
    const result = await unlockSession(password)
    setIsVerifying(false)

    if (result.success) {
      setPassword('')
    } else {
      setError(result.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate overflow-hidden bg-black/40 backdrop-blur-[24px]">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] opacity-60 mix-blend-screen pointer-events-none" />
      
      <div className={`relative z-10 w-full max-w-sm p-8 rounded-3xl shadow-2xl border ${darkMode ? 'bg-[#1e293b]/90 border-gray-700/50 text-white' : 'bg-white/90 border-white text-slate-800'}`}>
        
        <div className="flex flex-col items-center text-center">
          {/* Avatar Profile */}
          <div className="relative mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 shadow-xl ${darkMode ? 'border-primary/30 bg-primary/20' : 'border-white bg-primary/10'}`}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[48px] text-primary">lock_person</span>
              )}
            </div>
            {/* Status dot */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-amber-500 rounded-full border-[3px] border-inherit flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black/50 rounded-full animate-ping" />
            </div>
          </div>

          <h2 className="font-headline font-bold text-2xl mb-1">{user.username}</h2>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Session Locked</p>

          {/* Form */}
          <form onSubmit={handleUnlock} className="w-full">
            <label className="sr-only">Password</label>
            <div className="relative w-full group">
              <input 
                ref={inputRef}
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password to resume..."
                className={`w-full pl-5 pr-12 py-3.5 rounded-xl font-body text-sm font-medium border-2 transition-all outline-none ${
                  error 
                    ? 'border-red-500 focus:border-red-500 pr-12' 
                    : darkMode
                      ? 'bg-black/40 border-gray-700 focus:border-primary text-white placeholder-gray-500'
                      : 'bg-slate-50 border-slate-200 focus:border-primary text-slate-900 placeholder-slate-400'
                }`}
                disabled={isVerifying}
              />
              <button 
                type="submit" 
                disabled={!password || isVerifying}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  password && !isVerifying
                    ? 'bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95'
                    : 'bg-transparent text-gray-400'
                }`}
              >
                {isVerifying ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                )}
              </button>
            </div>
            
            {/* Error Message Space */}
            <div className="h-6 mt-3">
              {error && (
                <div className="text-red-500 text-xs font-bold animate-[slideIn_0.2s_ease-out]">
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
