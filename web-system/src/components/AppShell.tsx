import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getCompanyNameByCode } from '../config/companies'
import Breadcrumbs, { BreadcrumbSegment } from './Breadcrumbs'
import AnnouncementModal from './AnnouncementModal'

interface ServerAnnouncement {
  id: number
  authorUsername: string
  title: string
  body: string
  imageData: string | null
  priority: string
  createdAtUtc: string
  reactionCount: number
  reactedByMe: boolean
  reactedBy: string[]
}

interface ShellTab {
  id: string
  label: string
}

interface ShellGroup {
  title: string
  items: {
    label: string
    onClick: () => void
    disabled?: boolean
    icon?: string
    route?: string
  }[]
}

interface AppShellProps {
  moduleName: string
  companyCode: string | null
  statusPeriod?: string
  tabs: ShellTab[]
  groups: Record<string, ShellGroup[]>
  activeTab: string
  onTabChange: (tabId: string) => void
  onNewEntry?: () => void
  newEntryLabel?: string
  children: ReactNode
  onOpenSettings?: () => void
  breadcrumbSegments?: BreadcrumbSegment[]
}

export default function AppShell({ 
  moduleName, 
  companyCode, 
  statusPeriod,
  tabs, 
  groups, 
  activeTab, 
  onTabChange,
  onNewEntry,
  newEntryLabel = 'New Entry',
  onOpenSettings,
  breadcrumbSegments,
  children 
}: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, accessToken } = useAuthStore()
  const { darkMode, profilePhoto, showStatusBar, displayName } = useSettingsStore()
  const companyName = getCompanyNameByCode(companyCode)
  const currentGroups = groups[activeTab] || []

  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [announcements, setAnnouncements] = useState<ServerAnnouncement[]>([])
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('read-announcements') || '[]')) } catch { return new Set() }
  })
  const [openAnnouncementId, setOpenAnnouncementId] = useState<number | null>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const fetchAnnouncements = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/command-center/my-announcements', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setAnnouncements(json.data || [])
      }
    } catch {}
  }, [accessToken])

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchAnnouncements()
    const interval = setInterval(fetchAnnouncements, 30000)
    return () => clearInterval(interval)
  }, [fetchAnnouncements])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false)
      }
    }
    if (showNotifPanel) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifPanel])

  const markAsRead = (id: number) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('read-announcements', JSON.stringify([...next]))
      return next
    })
  }

  const markAllAsRead = () => {
    const allIds = announcements.map(a => a.id)
    setReadIds(new Set(allIds))
    localStorage.setItem('read-announcements', JSON.stringify(allIds))
  }

  const isItemActive = (item: { route?: string; label: string }) => {
    const path = location.pathname
    if (!item.route) return false
    if (item.route === '/fs') return path === '/fs'
    return path === item.route || path.startsWith(item.route + '/')
  }

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length

  const formatTimeAgo = (iso: string) => {
    const s = iso.endsWith('Z') ? iso : `${iso}Z`
    const diff = Date.now() - new Date(s).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className={`flex h-screen w-full font-body text-on-surface overflow-hidden ${darkMode ? 'dark bg-[#1a1a2e] text-gray-100' : 'bg-surface-container-lowest'}`}>
      
      {/* ── Fixed Left Sidebar ── */}
      <aside className={`w-[260px] h-full flex flex-col border-r flex-shrink-0 z-20 ${darkMode ? 'bg-[#16213e] border-gray-700' : 'bg-surface border-outline-variant/20'}`}>
        
        {/* Sidebar Header */}
        <div className={`px-5 py-5 border-b ${darkMode ? 'border-gray-700' : 'border-outline-variant/10'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {companyCode ? companyCode.substring(0, 2).toUpperCase() : 'CO'}
            </div>
            <div>
              <h2 className={`font-headline font-bold text-[14px] leading-tight tracking-tight ${darkMode ? 'text-gray-100' : 'text-on-surface'}`}>{companyName}</h2>
              <p className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/60'}`}>{moduleName}</p>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        {onNewEntry && (
          <div className="px-5 py-4">
            <button onClick={onNewEntry} className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all rounded-md py-2 font-semibold text-[13px] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span> {newEntryLabel}
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        <div className="flex-grow overflow-y-auto px-3 custom-scrollbar">
          {currentGroups.map((group, idx) => (
            <div key={idx} className="mb-5">
              <div className="px-2 mb-1.5">
                <span className={`text-[9px] font-bold tracking-widest uppercase ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>{group.title}</span>
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item, itemIdx) => {
                  const active = isItemActive(item)
                  return (
                    <li key={itemIdx}>
                      <button
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2.5 text-[13px] font-medium
                          ${item.disabled 
                              ? `${darkMode ? 'text-gray-600' : 'text-outline-variant/50'} cursor-not-allowed`
                              : active
                                ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary pl-2.5'
                                : `${darkMode ? 'text-gray-300 hover:bg-gray-700/50 hover:text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`
                          }
                        `}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${active ? 'text-primary' : 'opacity-60'}`}>
                          {item.icon || 'arrow_right_alt'}
                        </span>
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className={`px-5 py-3 border-t flex flex-col gap-2 ${darkMode ? 'border-gray-700' : 'border-outline-variant/10'}`}>
          <button onClick={onOpenSettings} className={`flex items-center gap-2.5 transition-colors text-[13px] font-medium py-1 ${darkMode ? 'text-gray-300 hover:text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined text-[18px]">settings</span> Settings
          </button>
          <button className={`flex items-center gap-2.5 transition-colors text-[13px] font-medium py-1 ${darkMode ? 'text-gray-300 hover:text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined text-[18px]">help</span> Support
          </button>
        </div>
      </aside>

      {/* ── Main Canvas Area ── */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className={`h-[64px] border-b flex items-center justify-between px-8 flex-shrink-0 ${darkMode ? 'bg-[#16213e] border-gray-700' : 'bg-surface border-outline-variant/20'}`}>
          
          <div className="flex items-center gap-6 h-full">
            {/* Breadcrumbs */}
            {breadcrumbSegments && (
              <Breadcrumbs segments={breadcrumbSegments} />
            )}
            <div className="h-5 w-px bg-outline-variant/20" />
            <div className="font-headline text-[1.15rem] font-extrabold text-primary tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
              AWM
            </div>

            <div className="flex h-full gap-1">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative h-full px-5 text-sm font-semibold tracking-wide transition-all flex items-center rounded-t-md
                      ${isActive 
                        ? 'text-primary bg-primary/5' 
                        : `${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30' : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low/50'}`
                      }
                    `}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Topbar Right */}
          <div className="flex items-center gap-5">
            {/* Notification Bell — animated when unread */}
            <div className="relative" ref={notifRef}>
              <style>{`
                @keyframes bell-ring {
                  0% { transform: rotate(0deg); }
                  10% { transform: rotate(14deg); }
                  20% { transform: rotate(-12deg); }
                  30% { transform: rotate(10deg); }
                  40% { transform: rotate(-8deg); }
                  50% { transform: rotate(6deg); }
                  60% { transform: rotate(-4deg); }
                  70% { transform: rotate(2deg); }
                  80% { transform: rotate(-1deg); }
                  90% { transform: rotate(0deg); }
                  100% { transform: rotate(0deg); }
                }
                .bell-animate {
                  animation: bell-ring 1.2s ease-in-out infinite;
                  animation-delay: 2s;
                }
              `}</style>
              <button 
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className={`relative transition-colors ${darkMode ? 'text-gray-300 hover:text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              >
                <span className={`material-symbols-outlined text-[22px] ${unreadCount > 0 ? 'bell-animate' : ''}`}>notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-error rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifPanel && (
                <div className={`absolute right-0 top-[calc(100%+8px)] w-[400px] rounded-xl shadow-2xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1e2a4a] border-gray-600' : 'bg-white border-outline-variant/20'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? 'border-gray-600' : 'border-outline-variant/10'}`}>
                    <h4 className={`font-headline font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-on-surface'}`}>Announcements</h4>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[11px] text-primary font-semibold hover:underline">Mark all read</button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {announcements.length === 0 ? (
                      <div className={`px-4 py-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>
                        <span className="material-symbols-outlined text-[32px] mb-2 block opacity-40">notifications_off</span>
                        No announcements yet
                      </div>
                    ) : (
                      announcements.map((a) => {
                        const isRead = readIds.has(a.id)
                        return (
                          <div 
                            key={a.id} 
                            className={`px-4 py-3 border-b last:border-0 flex gap-3 group transition-colors cursor-pointer
                              ${isRead 
                                ? (darkMode ? 'border-gray-700 opacity-60' : 'border-outline-variant/5 opacity-60') 
                                : (darkMode ? 'border-gray-700 bg-blue-900/20' : 'border-outline-variant/5 bg-primary/[0.03]')}`}
                            onClick={() => { markAsRead(a.id); setOpenAnnouncementId(a.id); setShowNotifPanel(false) }}
                          >
                            <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${a.priority === 'urgent' ? 'text-red-500' : 'text-primary'}`}>
                              {a.priority === 'urgent' ? 'priority_high' : 'campaign'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-[13px] font-semibold leading-tight ${darkMode ? 'text-gray-100' : 'text-on-surface'}`}>{a.title}</p>
                                <span className={`text-[10px] shrink-0 ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/50'}`}>{formatTimeAgo(a.createdAtUtc)}</span>
                              </div>
                              <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-on-surface-variant/70'}`}>{a.body}</p>
                              <div className={`flex items-center gap-3 mt-1.5 text-[10px] ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/40'}`}>
                                <span>By {a.authorUsername}</span>
                                {a.reactionCount > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-red-400 text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                    {a.reactionCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Announcement Detail Modal */}
            {openAnnouncementId !== null && (
              <AnnouncementModal
                announcementId={openAnnouncementId}
                onClose={() => { setOpenAnnouncementId(null); fetchAnnouncements() }}
              />
            )}

            <button onClick={onOpenSettings} className={`transition-colors ${darkMode ? 'text-gray-300 hover:text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>
            
            <div className={`h-5 w-px ${darkMode ? 'bg-gray-600' : 'bg-outline-variant/20'}`}></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-[13px] font-bold leading-snug ${darkMode ? 'text-gray-100' : 'text-on-surface'}`}>{displayName || (user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'tester' ? 'Tester' : 'Accountant')}</div>
                <div className={`text-[9px] uppercase tracking-widest font-semibold mt-0.5 ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/60'}`}>{companyCode}</div>
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-surface-container-high border-outline-variant/30'}`}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className={`material-symbols-outlined text-[20px] ${darkMode ? 'text-gray-400' : 'text-on-surface-variant'}`}>person</span>
                )}
              </div>
              <button onClick={logout} className="ml-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-md shadow-sm hover:bg-primary/90 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-grow overflow-auto p-8 custom-scrollbar relative ${darkMode ? 'bg-[#1a1a2e]' : ''}`}>
          {children}
        </main>

        {/* Status Bar */}
        {showStatusBar && (
          <footer className="h-7 bg-primary text-surface-container flex items-center justify-between px-6 text-[10px] font-mono font-medium tracking-wide flex-shrink-0 z-10">
            <div className="flex items-center gap-6">
              <span>MODULE: {moduleName}</span>
              <span className="opacity-50">|</span>
              <span>COMPANY: {companyName?.toUpperCase()}</span>
              <span className="opacity-50">|</span>
              <span>PERIOD: {(statusPeriod || 'N/A').toUpperCase()}</span>
              <span className="opacity-50">|</span>
              <span>ROLE: {user?.role === 'superadmin' ? 'SUPER ADMIN' : 'SENIOR ACCOUNTANT'}</span>
            </div>
            <div className="flex items-center gap-6">
              <span>V 3.8.0-Feature Fixes</span>
              <span className="opacity-50">|</span>
              <span>© 2026 iSUPPLYTECH CO. LTD.</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
