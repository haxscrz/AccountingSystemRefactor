import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'

/* ── Legal popup content ── */
const TOS_CONTENT = `
TERMS OF SERVICE

Last Updated: March 2026

1. ACCEPTANCE OF TERMS
By accessing or using the Accounting and Workforce Management platform ("Service") provided by iSupplyTech Co. Ltd. ("Company"), you agree to be bound by these Terms of Service.

2. AUTHORIZED USE
This Service is provided exclusively for authorized employees and representatives of organizations contracted with iSupplyTech Co. Ltd. Unauthorized access is strictly prohibited and may result in legal action.

3. USER ACCOUNTS
Users are responsible for maintaining the confidentiality of their login credentials. Any activities performed under your account are your responsibility. You must notify the System Administrator immediately upon discovering any unauthorized use.

4. DATA HANDLING
All financial data processed through this Service is stored securely using industry-standard encryption. iSupplyTech Co. Ltd. implements AES-256 encryption at rest and TLS 1.3 for data in transit.

5. SERVICE AVAILABILITY
iSupplyTech Co. Ltd. endeavors to maintain 99.9% uptime. Scheduled maintenance windows will be communicated in advance. The Company is not liable for downtime caused by force majeure events.

6. INTELLECTUAL PROPERTY
All software, designs, and documentation within this Service are the intellectual property of iSupplyTech Co. Ltd. Reverse engineering, decompilation, or unauthorized reproduction is prohibited.

7. LIMITATION OF LIABILITY
iSupplyTech Co. Ltd. shall not be liable for indirect, incidental, or consequential damages arising from the use of this Service. Total liability shall not exceed the fees paid in the preceding 12 months.

8. DATA RETENTION
Financial records are retained in accordance with Philippine regulatory requirements (BIR, SEC) for a minimum of 10 years. Users may request data export at any time through the System Administrator.

9. MODIFICATIONS
iSupplyTech Co. Ltd. reserves the right to modify these Terms at any time. Continued use after modification constitutes acceptance.

10. GOVERNING LAW
These Terms shall be governed by the laws of the Republic of the Philippines. Disputes shall be resolved in the courts of Makati City.

For inquiries: legal@isupplytech.com
iSupplyTech Co. Ltd. — Enterprise Financial Solutions
`.trim()

const PRIVACY_CONTENT = `
PRIVACY POLICY

Last Updated: March 2026

iSupplyTech Co. Ltd. ("we", "us", "our") is committed to protecting the privacy of our users.

1. INFORMATION WE COLLECT
• Account Information: Username, role, and organizational affiliation.
• Activity Data: Login timestamps, module access logs, and transaction audit trails for compliance purposes.
• Financial Data: All transactional data entered through the platform (vouchers, journals, payroll records).

2. HOW WE USE YOUR INFORMATION
• To authenticate and authorize access to organizational financial systems.
• To maintain audit trails required by Philippine regulatory bodies (BIR, SEC, DOLE).
• To generate reports and analytics for authorized personnel.
• To detect and prevent unauthorized access or fraudulent activity.

3. DATA SHARING
We do not sell, trade, or share personal data with third parties except:
• When required by Philippine law, court order, or regulatory mandate.
• With authorized auditors during scheduled compliance reviews.
• With cloud infrastructure providers (Azure) under strict data processing agreements.

4. DATA SECURITY
• All data is encrypted at rest (AES-256) and in transit (TLS 1.3).
• Database backups are encrypted and access-controlled.
• Sessions automatically terminate after 5 minutes of inactivity.
• All access is logged and auditable.

5. DATA RETENTION
• Financial records: 10 years (per BIR requirements).
• Audit logs: 5 years.
• Session data: 90 days.

6. YOUR RIGHTS
Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the right to:
• Access your personal data held by us.
• Correct inaccurate data.
• Object to processing in certain circumstances.
• Lodge a complaint with the National Privacy Commission.

7. COOKIES & LOCAL STORAGE
This application uses browser local storage to maintain session state and user preferences. No third-party tracking cookies are used.

8. CONTACT
Data Protection Officer: privacy@isupplytech.com
iSupplyTech Co. Ltd.
Enterprise Financial Solutions Division

General inquiries: support@isupplytech.com
`.trim()

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTos, setShowTos] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactUsername, setContactUsername] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const login = useAuthStore(state => state.login)
  const darkMode = useSettingsStore(state => state.darkMode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)
      if (result.success) {
        await useSettingsStore.getState().syncStorageForUser(username)
        navigate('/system-options')
      } else {
        setError(result.message || 'Invalid username or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContactSubmit = async () => {
    if (!contactUsername.trim()) return
    
    try {
      await fetch('/api/command-center/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: contactUsername.trim(),
          message: (isUrgent ? '[URGENT] ' : '') + (contactMessage.trim() || 'No additional details provided.')
        })
      })
    } catch {
      // Ignore errors, show success to user regardless
    }

    setContactSent(true)
    setTimeout(() => {
      setShowContact(false)
      setContactSent(false)
      setContactMessage('')
      setContactUsername('')
      setIsUrgent(false)
    }, 3000)
  }

  /* Reusable legal popup */
  const LegalPopup = ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[80vh] flex flex-col overflow-hidden ${darkMode ? 'bg-[#1e293b] text-gray-100' : 'bg-white text-on-surface'}`} onClick={e => e.stopPropagation()}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-outline-variant/15'}`}>
          <h3 className={`font-headline font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-on-surface'}`}>{title}</h3>
          <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-surface-container'}`}>
            <span className={`material-symbols-outlined text-[20px] ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <pre className={`whitespace-pre-wrap text-sm leading-relaxed font-body ${darkMode ? 'text-gray-300' : 'text-on-surface-variant'}`}>{content}</pre>
        </div>
        <div className={`px-6 py-4 border-t flex justify-end ${darkMode ? 'border-gray-700' : 'border-outline-variant/10'}`}>
          <button onClick={onClose} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`font-body antialiased min-h-screen flex flex-col ${darkMode ? 'bg-[#0a0f1e] text-gray-100' : 'bg-surface text-on-surface'}`}>
      {/* Auth Layout Wrapper */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle Architectural Background Element */}
        <div className={`absolute top-0 left-0 w-full h-full pointer-events-none ${darkMode ? 'opacity-20' : 'opacity-40'}`}>
          <div className={`absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full blur-[120px] ${darkMode ? 'bg-blue-900' : 'bg-primary-fixed'}`}></div>
          <div className={`absolute bottom-[-10%] left-[-5%] w-[35rem] h-[35rem] rounded-full blur-[100px] ${darkMode ? 'bg-slate-800' : 'bg-secondary-fixed'}`}></div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[440px] z-10">
          {/* Branding Area */}
          <div className="mb-10 text-center">
            <h1 className={`font-headline font-extrabold text-2xl tracking-tighter mb-1 leading-tight ${darkMode ? 'text-blue-400' : 'text-primary'}`}>Accounting and Workforce<br/>Management</h1>
            <p className={`font-medium tracking-tight text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>By: <strong className={darkMode ? 'text-blue-400' : 'text-primary'}>iSupplyTech Co. Ltd.</strong></p>
          </div>

          {/* Main Auth Container */}
          <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-[#1e293b] shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-700' : 'surface-container-lowest glass-panel shadow-[0_8px_32px_rgba(5,17,30,0.06)]'}`}>
            
            {/* Error Feedback */}
            {error && (
              <div className="bg-error-container/30 px-6 py-3 flex items-center gap-3 border-b border-error/10">
                <span className="material-symbols-outlined text-error text-[20px]">report</span>
                <p className="text-on-error-container text-xs font-semibold leading-tight">
                    {error}
                </p>
              </div>
            )}

            <div className="p-8">
              <div className="mb-8">
                <h2 className={`font-headline font-semibold text-xl mb-1 ${darkMode ? 'text-blue-400' : 'text-primary'}`}>Sign In</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>Enter your credentials to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Group: Username */}
                <div className="space-y-2">
                  <label className="block font-label text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="username">Username</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-on-tertiary-container transition-colors">badge</span>
                    </div>
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-on-tertiary-container/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant" 
                      id="username" 
                      name="username" 
                      placeholder="Enter your username" 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Input Group: Password */}
                <div className="space-y-2">
                  <label className="block font-label text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="password">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-on-tertiary-container transition-colors">lock</span>
                    </div>
                    <input 
                      className="w-full pl-10 pr-12 py-3 bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-on-tertiary-container/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••••••" 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-tertiary-container transition-colors"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg font-headline font-bold text-sm tracking-wide shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group" 
                  type="submit"
                >
                  <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  {!loading && <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                </button>
              </form>
            </div>

            {/* Footer — Contact System Admin */}
            <div className={`px-8 py-5 border-t flex justify-center items-center ${darkMode ? 'bg-[#0f172a]/50 border-gray-700' : 'bg-surface-container/50 border-surface-container-highest'}`}>
              <p className="text-[11px] text-on-surface-variant font-medium">
                  Having trouble? <button type="button" onClick={() => setShowContact(true)} className="text-primary font-bold hover:underline">Contact System Admin</button>
              </p>
            </div>
          </div>

          {/* Version Footnote */}
          <div className="mt-8 flex justify-center items-center px-2">
            <span className={`text-[10px] font-bold font-mono uppercase tracking-tighter ${darkMode ? 'text-gray-500' : 'text-on-surface-variant'}`}>V 3.8.0-Feature Fixes</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-2 bg-slate-900 dark:bg-black flex items-center justify-between px-6 z-50 text-[10px] font-mono border-t border-slate-800 shrink-0">
        <div className="text-slate-400 font-['Inter'] uppercase tracking-widest">
            © 2026 iSupplyTech Co. Ltd. All rights reserved.
        </div>
        <div className="flex gap-6">
          <button onClick={() => setShowTos(true)} className="text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Terms of Service</button>
          <button onClick={() => setShowPrivacy(true)} className="text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</button>
        </div>
      </footer>

      {/* Legal Popups */}
      {showTos && <LegalPopup title="Terms of Service" content={TOS_CONTENT} onClose={() => setShowTos(false)} />}
      {showPrivacy && <LegalPopup title="Privacy Policy" content={PRIVACY_CONTENT} onClose={() => setShowPrivacy(false)} />}

      {/* Contact System Admin Modal */}
      {showContact && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => { if (!contactSent) { setShowContact(false) } }}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden ${darkMode ? 'bg-[#1e293b] text-gray-100 border border-gray-700' : 'bg-white text-on-surface'}`} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">Contact System Admin</h3>
              {!contactSent && (
                <button onClick={() => setShowContact(false)} className="p-1 rounded-lg hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
                </button>
              )}
            </div>
            <div className="p-6">
              {contactSent ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <span className="material-symbols-outlined text-emerald-500 text-[48px]">check_circle</span>
                  <p className="font-headline font-bold text-on-surface">Request Sent!</p>
                  <p className="text-sm text-on-surface-variant text-center">The System Administrator has been notified. They will contact you shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">Having trouble signing in? Send a request to the System Administrator for assistance.</p>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Your Username</label>
                    <input 
                      type="text" value={contactUsername} onChange={e => setContactUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-3 py-2.5 bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Describe Your Issue <span className="font-normal text-on-surface-variant/50">(optional)</span></label>
                    <textarea 
                      value={contactMessage} onChange={e => setContactMessage(e.target.value)}
                      placeholder="e.g., I forgot my password, my account is locked..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input 
                      type="checkbox" 
                      id="isUrgent" 
                      checked={isUrgent} 
                      onChange={e => setIsUrgent(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-error focus:ring-error transition-all"
                    />
                    <label htmlFor="isUrgent" className="text-sm font-bold text-error cursor-pointer">
                      Flag as Urgent Support (e.g. Account Locked)
                    </label>
                  </div>
                  <button 
                    onClick={handleContactSubmit}
                    disabled={!contactUsername.trim()}
                    className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
