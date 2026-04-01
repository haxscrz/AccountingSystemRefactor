import { useSettingsStore } from '../stores/settingsStore'
import { useInactivityLogout } from '../hooks/useInactivityLogout'

export default function InactivityToast() {
  const darkMode = useSettingsStore(s => s.darkMode)
  const {
    showWarningToast,
    secondsRemaining,
    showWelcomeBack,
    dismissWarning
  } = useInactivityLogout()

  // Welcome back toast
  if (showWelcomeBack) {
    return (
      <div className="fixed bottom-6 right-6 z-[600] animate-slide-in-right">
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
          darkMode
            ? 'bg-emerald-950/90 border-emerald-800/50 text-emerald-100'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
        style={{ boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)' }}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
          }`}>
            <span className="material-symbols-outlined text-emerald-500 text-[22px]">
              sentiment_very_satisfied
            </span>
          </div>
          <div>
            <p className="font-bold text-sm">Phew! Welcome back!</p>
            <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>
              Your session has been restored.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Warning countdown toast
  if (!showWarningToast) return null

  const urgency = secondsRemaining <= 15
  const critical = secondsRemaining <= 5

  return (
    <div className="fixed bottom-6 right-6 z-[600] animate-slide-in-right">
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-xl ${
        darkMode
          ? `${critical ? 'bg-red-950/95 border-red-700/60' : urgency ? 'bg-amber-950/95 border-amber-700/50' : 'bg-[#1e293b]/95 border-gray-600/50'}`
          : `${critical ? 'bg-red-50 border-red-200' : urgency ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`
      }`}
      style={{ 
        boxShadow: critical 
          ? '0 20px 60px rgba(239, 68, 68, 0.4)' 
          : urgency 
            ? '0 20px 60px rgba(245, 158, 11, 0.3)' 
            : '0 20px 60px rgba(0, 0, 0, 0.15)',
        minWidth: 320
      }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px]">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${
              critical ? 'bg-red-500' : urgency ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${(secondsRemaining / 60) * 100}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Pulsing timer icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              critical
                ? 'bg-red-500/20 animate-pulse'
                : urgency
                  ? 'bg-amber-500/15'
                  : darkMode ? 'bg-blue-500/15' : 'bg-blue-50'
            }`}>
              <span className={`material-symbols-outlined text-[26px] ${
                critical ? 'text-red-500' : urgency ? 'text-amber-500' : 'text-blue-500'
              }`}>
                {critical ? 'warning' : 'timer'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${
                darkMode ? 'text-gray-100' : 'text-slate-900'
              }`}>
                {critical ? 'Session ending!' : 'Are you still there?'}
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${
                darkMode ? 'text-gray-400' : 'text-slate-500'
              }`}>
                Logging out in <strong className={
                  critical ? 'text-red-500' : urgency ? 'text-amber-500' : 'text-blue-500'
                }>{secondsRemaining}s</strong> due to inactivity.
              </p>
            </div>

            {/* Big countdown */}
            <div className={`text-3xl font-black font-mono tabular-nums shrink-0 ${
              critical 
                ? 'text-red-500 animate-pulse' 
                : urgency 
                  ? 'text-amber-500' 
                  : darkMode ? 'text-blue-400' : 'text-blue-500'
            }`}>
              {secondsRemaining}
            </div>
          </div>

          <button
            onClick={dismissWarning}
            className={`w-full mt-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
              critical
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                : urgency
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
            }`}
          >
            I'm still here!
          </button>
        </div>
      </div>
    </div>
  )
}
