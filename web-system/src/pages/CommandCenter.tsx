import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import AnnouncementModal from '../components/AnnouncementModal'

interface Ticket {
  id: number
  fromUsername: string
  message: string
  status: string
  resolvedBy: string | null
  adminNotes: string | null
  createdAtUtc: string
  resolvedAtUtc: string | null
}

interface Announcement {
  id: number
  authorUsername: string
  title: string
  body: string
  hasImage: boolean
  priority: string
  targetType: string
  targetUsers: string[] | null
  createdAtUtc: string
  expiresAtUtc: string | null
  reactionCount: number
}

export default function CommandCenter() {
  const darkMode = useSettingsStore(s => s.darkMode)
  const { accessToken } = useAuthStore()
  const [subTab, setSubTab] = useState<'inbox' | 'announcements'>('inbox')

  // ... (rest remains same but replacing token references below)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  // Resolve modal
  const [resolveId, setResolveId] = useState<number | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')

  // Create announcement form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newPriority, setNewPriority] = useState('normal')
  const [newTargetType, setNewTargetType] = useState('all')
  const [newTargetUsers, setNewTargetUsers] = useState('')
  const [newImageData, setNewImageData] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [openAnnouncementId, setOpenAnnouncementId] = useState<number | null>(null)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  }), [accessToken])

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/command-center/tickets', { headers: headers() })
      if (res.ok) {
        const json = await res.json()
        setTickets(json.data)
      }
    } catch {}
  }, [headers])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/command-center/announcements', { headers: headers() })
      if (res.ok) {
        const json = await res.json()
        setAnnouncements(json.data)
      }
    } catch {}
  }, [headers])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: headers() })
      if (res.ok) {
        const json = await res.json()
        setAllUsers(Array.isArray(json) ? json.map((u: any) => u.username) : [])
      }
    } catch {}
  }, [headers])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTickets(), fetchAnnouncements(), fetchUsers()]).finally(() => setLoading(false))
  }, [fetchTickets, fetchAnnouncements, fetchUsers])

  const handleResolve = async () => {
    if (resolveId == null) return
    await fetch(`/api/command-center/tickets/${resolveId}/resolve`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ notes: resolveNotes })
    })
    setResolveId(null)
    setResolveNotes('')
    fetchTickets()
  }

  const handleDismiss = async (id: number) => {
    await fetch(`/api/command-center/tickets/${id}`, { method: 'DELETE', headers: headers() })
    fetchTickets()
  }

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const payload: any = {
        title: newTitle.trim(),
        body: newBody.trim(),
        priority: newPriority,
        targetType: newTargetType,
        imageData: newImageData,
      }
      if (newTargetType === 'select' && newTargetUsers.trim()) {
        payload.targetUsers = newTargetUsers.split(',').map(u => u.trim()).filter(Boolean)
      }
      await fetch('/api/command-center/announcements', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      })
      setNewTitle('')
      setNewBody('')
      setNewPriority('normal')
      setNewTargetType('all')
      setNewTargetUsers('')
      setNewImageData(null)
      setShowCreateForm(false)
      fetchAnnouncements()
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/command-center/announcements/${id}`, { method: 'DELETE', headers: headers() })
    fetchAnnouncements()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setNewImageData(reader.result as string)
    reader.readAsDataURL(file)
  }

  const fmt = (utc: string) => {
    const s = utc.endsWith('Z') ? utc : `${utc}Z`
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(new Date(s))
  }

  const card = `rounded-2xl border p-6 transition-all ${darkMode ? 'bg-[#1e293b]/80 border-gray-700/50' : 'bg-white border-slate-200 shadow-sm'}`
  const labelCls = `text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`
  const openCount = tickets.filter(t => t.status === 'open').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Loading Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-headline text-2xl font-bold mb-1">Command Center</h2>
        <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Manage support requests and broadcast announcements to your team.</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('inbox')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${subTab === 'inbox' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/10 text-primary') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-slate-500 hover:bg-slate-100')}`}
        >
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          Support Inbox
          {openCount > 0 && (
            <span className="ml-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">{openCount}</span>
          )}
        </button>
        <button
          onClick={() => setSubTab('announcements')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${subTab === 'announcements' ? (darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-600') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-slate-500 hover:bg-slate-100')}`}
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          Announcements
        </button>
      </div>

      {/* SUPPORT INBOX */}
      {subTab === 'inbox' && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className={`${card} text-center py-12`}>
              <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">inbox</span>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>No support tickets yet.</p>
            </div>
          ) : (
            tickets.map(t => (
              <div key={t.id} className={`${card} flex items-start gap-4`}>
                <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${t.status === 'open' ? 'bg-red-500 animate-pulse' : t.status === 'resolved' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}>{t.fromUsername}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      t.status === 'open' ? 'bg-red-500/15 text-red-500' :
                      t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-500' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>{t.status}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    {t.message || <em className="opacity-50">No message provided</em>}
                  </p>
                  <div className={`text-[10px] mt-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                    {fmt(t.createdAtUtc)}
                    {t.resolvedBy && <span> · Handled by <strong>{t.resolvedBy}</strong></span>}
                    {t.adminNotes && <span> · Note: "{t.adminNotes}"</span>}
                  </div>
                </div>
                {t.status === 'open' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setResolveId(t.id); setResolveNotes('') }} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">Resolve</button>
                    <button onClick={() => handleDismiss(t.id)} className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-xs font-bold rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors">Dismiss</button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Resolve modal */}
          {resolveId !== null && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setResolveId(null)}>
              <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 ${darkMode ? 'bg-[#1e293b] border border-gray-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <h3 className={`font-headline font-bold text-lg mb-4 ${darkMode ? 'text-gray-100' : ''}`}>Resolve Ticket</h3>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Admin notes (optional)..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4 ${darkMode ? 'bg-gray-800 text-gray-100 placeholder:text-gray-600' : 'bg-slate-50 border border-slate-200 placeholder:text-slate-400'}`}
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setResolveId(null)} className={`px-4 py-2 text-sm font-semibold rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
                  <button onClick={handleResolve} className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors">Confirm Resolve</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {subTab === 'announcements' && (
        <div className="space-y-4">
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Announcement
            </button>
          ) : (
            <div className={card}>
              <h3 className={`font-bold text-sm mb-4 ${darkMode ? 'text-gray-100' : ''}`}>New Announcement</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Title</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Announcement title..."
                    className={`w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none ${darkMode ? 'bg-gray-800 text-gray-100 placeholder:text-gray-600' : 'bg-slate-50 border border-slate-200 placeholder:text-slate-400'}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Message</label>
                  <textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Write your announcement..."
                    rows={4}
                    className={`w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none ${darkMode ? 'bg-gray-800 text-gray-100 placeholder:text-gray-600' : 'bg-slate-50 border border-slate-200 placeholder:text-slate-400'}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                      className={`w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-slate-50 border border-slate-200'}`}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Recipients</label>
                    <select value={newTargetType} onChange={e => setNewTargetType(e.target.value)}
                      className={`w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-slate-50 border border-slate-200'}`}
                    >
                      <option value="all">All Users</option>
                      <option value="select">Select Users</option>
                    </select>
                  </div>
                </div>
                {newTargetType === 'select' && (
                  <div>
                    <label className={labelCls}>Select Users</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {allUsers.map(u => {
                        const selected = newTargetUsers.split(',').map(s => s.trim()).includes(u)
                        return (
                          <button key={u} type="button"
                            onClick={() => {
                              const current = newTargetUsers.split(',').map(s => s.trim()).filter(Boolean)
                              if (selected) setNewTargetUsers(current.filter(c => c !== u).join(','))
                              else setNewTargetUsers([...current, u].join(','))
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selected
                              ? 'bg-primary text-white'
                              : (darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                            }`}
                          >{u}</button>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Attach Image (optional)</label>
                  <div className="relative group overflow-hidden mt-1 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed transition-all ${darkMode ? 'border-gray-700 bg-gray-800/30 group-hover:bg-gray-800/60 group-hover:border-primary text-gray-400 group-hover:text-primary' : 'border-slate-300 bg-slate-50 group-hover:bg-slate-100 group-hover:border-primary text-slate-500 group-hover:text-primary'}`}>
                      <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                      <span className="text-sm font-semibold">Click to browse or drag an image here</span>
                    </div>
                  </div>
                  {newImageData && (
                    <div className="mt-2 relative inline-block">
                      <img src={newImageData} alt="Preview" className="max-h-32 rounded-xl border border-outline-variant/20" />
                      <button onClick={() => setNewImageData(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">×</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowCreateForm(false)} className={`px-4 py-2 text-sm font-semibold rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
                  <button onClick={handleCreateAnnouncement} disabled={creating || !newTitle.trim()} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    {creating ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Announcement list */}
          {announcements.length === 0 && !showCreateForm ? (
            <div className={`${card} text-center py-12`}>
              <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">campaign</span>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>No announcements yet.</p>
            </div>
          ) : (
            announcements.map(a => (
              <div key={a.id} className={`${card} relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors`} onClick={() => setOpenAnnouncementId(a.id)}>
                {a.priority === 'urgent' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.priority === 'urgent' && <span className="text-red-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/15">URGENT</span>}
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}>{a.title}</h4>
                    </div>
                    <p className={`text-sm leading-relaxed mt-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{a.body.substring(0, 200)}{a.body.length > 200 ? '...' : ''}</p>
                    <div className={`flex items-center gap-4 mt-3 text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                      <span>{fmt(a.createdAtUtc)}</span>
                      <span>By {a.authorUsername}</span>
                      <span>→ {a.targetType === 'all' ? 'All Users' : (a.targetUsers?.join(', ') || 'Selected')}</span>
                      {a.hasImage && <span className="material-symbols-outlined text-[12px]">image</span>}
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">favorite</span>{a.reactionCount}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(a.id); }} className={`p-2 rounded-lg transition-colors z-10 relative ${darkMode ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {openAnnouncementId !== null && (
        <AnnouncementModal
          announcementId={openAnnouncementId}
          onClose={() => { setOpenAnnouncementId(null); fetchAnnouncements() }}
        />
      )}
    </div>
  )
}
