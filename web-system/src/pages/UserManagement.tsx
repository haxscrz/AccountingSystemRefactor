import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import axios from 'axios'

const API = '/api/admin'

interface UserItem {
  id: number
  username: string
  role: string
  canAccessFs: boolean
  canAccessPayroll: boolean
  isActive: boolean
  profileImageUrl: string | null
  lastLoginUtc: string | null
  createdAtUtc: string
}

type ModalMode = 'add' | 'edit' | 'password' | null

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  // SQLite loses DateTimeKind, so we must force "Z" suffix for UTC parsing in JS
  const safeIso = iso.endsWith('Z') ? iso : iso + 'Z'
  const d = new Date(safeIso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  accountant: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tester: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default function UserManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const darkMode = useSettingsStore(s => s.darkMode)

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editUser, setEditUser] = useState<UserItem | null>(null)

  // Form fields
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('accountant')
  const [formFs, setFormFs] = useState(true)
  const [formPayroll, setFormPayroll] = useState(false)
  const [formActive, setFormActive] = useState(true)
  const [formSaving, setFormSaving] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/users`)
      setUsers(res.data)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t) }
  }, [success])

  const openAdd = () => {
    setFormUsername(''); setFormPassword(''); setFormRole('accountant')
    setFormFs(true); setFormPayroll(false); setFormActive(true)
    setEditUser(null); setModalMode('add')
    setError('')
  }

  const openEdit = (u: UserItem) => {
    setEditUser(u)
    setFormRole(u.role); setFormFs(u.canAccessFs); setFormPayroll(u.canAccessPayroll); setFormActive(u.isActive)
    setModalMode('edit')
    setError('')
  }

  const openPassword = (u: UserItem) => {
    setEditUser(u); setFormPassword('')
    setModalMode('password')
    setError('')
  }

  const handleSaveAdd = async () => {
    if (!formUsername.trim() || !formPassword.trim()) { setError('Username and password are required.'); return }
    if (formPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setFormSaving(true); setError('')
    try {
      await axios.post(`${API}/users`, {
        username: formUsername.trim(), password: formPassword,
        role: formRole, canAccessFs: formFs, canAccessPayroll: formPayroll
      })
      setModalMode(null)
      setSuccess(`User "${formUsername.trim()}" created successfully.`)
      fetchUsers()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create user.')
    } finally { setFormSaving(false) }
  }

  const handleSaveEdit = async () => {
    if (!editUser) return
    setFormSaving(true); setError('')
    try {
      await axios.put(`${API}/users/${editUser.id}`, {
        role: formRole, canAccessFs: formFs, canAccessPayroll: formPayroll, isActive: formActive
      })
      setModalMode(null)
      setSuccess(`User "${editUser.username}" updated.`)
      fetchUsers()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update user.')
    } finally { setFormSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!editUser || formPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setFormSaving(true); setError('')
    try {
      await axios.post(`${API}/users/${editUser.id}/reset-password`, { newPassword: formPassword })
      setModalMode(null)
      setSuccess(`Password for "${editUser.username}" has been reset.`)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to reset password.')
    } finally { setFormSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API}/users/${id}`)
      setSuccess('User deleted.')
      setDeleteConfirm(null)
      fetchUsers()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete user.')
      setDeleteConfirm(null)
    }
  }

  const cn = (base: string) => base // helper

  return (
    <div className={`font-body min-h-screen flex flex-col ${darkMode ? 'bg-[#0a0f1e] text-gray-100' : 'bg-slate-50 text-on-surface'}`}>
      {/* Header */}
      <header className={`px-8 py-4 flex justify-between items-center border-b backdrop-blur-md z-10 ${darkMode ? 'bg-[#0f172a]/90 border-gray-700' : 'bg-white/80 border-outline-variant/10'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Dashboard
          </button>
          <div className="h-5 w-px bg-outline-variant/20"></div>
          <h1 className={`font-headline font-bold text-xl tracking-tight ${darkMode ? 'text-blue-400' : 'text-primary'}`}>
            <span className="material-symbols-outlined text-[22px] align-text-bottom mr-2">group</span>
            User Management
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`px-3 py-1 rounded-lg border font-mono text-xs ${darkMode ? 'bg-amber-900/20 text-amber-400 border-amber-700/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            Super Admin
          </span>
          <span className="text-on-surface-variant font-medium">{user?.username}</span>
        </div>
      </header>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.3s_ease] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {success}
        </div>
      )}

      <main className="flex-grow p-6 sm:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Title area */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-1">System Users</h2>
              <p className="text-on-surface-variant text-sm">Manage user accounts, roles, and module access permissions.</p>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Add User
            </button>
          </div>

          {/* Users Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-700 text-gray-500' : 'border-outline-variant/30 text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[48px] mb-4 block opacity-40">group_off</span>
              <p className="text-lg font-semibold mb-1">No users found</p>
              <p className="text-sm">Add your first user to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {users.map(u => (
                <div key={u.id} className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  darkMode
                    ? `bg-[#1e293b] border-gray-700 ${!u.isActive ? 'opacity-60' : ''} hover:border-blue-500/30 hover:shadow-blue-500/5`
                    : `bg-white border-outline-variant/15 ${!u.isActive ? 'opacity-60' : ''} hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]`
                }`}>
                  {/* Top gradient strip */}
                  <div className={`h-1 w-full ${u.role === 'superadmin' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : u.role === 'accountant' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>

                  <div className="p-5">
                    {/* Avatar + Name row */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-lg ${
                        u.profileImageUrl
                          ? ''
                          : u.role === 'superadmin' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white'
                      }`}>
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(u.username)
                        )}
                        {/* Online dot */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${u.isActive ? 'bg-emerald-400' : 'bg-gray-400'}`}></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-bold text-base text-on-surface truncate">{u.username}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ROLE_COLORS[u.role] || ROLE_COLORS.tester}`}>
                            {u.role}
                          </span>
                          {!u.isActive && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Access Badges */}
                    <div className="flex gap-2 mb-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        u.canAccessFs
                          ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                          : darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">{u.canAccessFs ? 'check_circle' : 'cancel'}</span>
                        Financial Statements
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        u.canAccessPayroll
                          ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                          : darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">{u.canAccessPayroll ? 'check_circle' : 'cancel'}</span>
                        Payroll
                      </div>
                    </div>

                    {/* Last Login */}
                    <div className={`text-[11px] font-mono mb-4 ${darkMode ? 'text-gray-500' : 'text-on-surface-variant/60'}`}>
                      <span className="material-symbols-outlined text-[13px] align-text-bottom mr-1">schedule</span>
                      Last login: {fmtDate(u.lastLoginUtc)}
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-2 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-outline-variant/10'}`}>
                      <button onClick={() => openEdit(u)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${darkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit
                      </button>
                      <button onClick={() => openPassword(u)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${darkMode ? 'bg-amber-900/20 text-amber-400 hover:bg-amber-900/40' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                        <span className="material-symbols-outlined text-[16px]">key</span>
                        Password
                      </button>
                      {deleteConfirm === u.id ? (
                        <button onClick={() => handleDelete(u.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all animate-pulse">
                          Confirm?
                        </button>
                      ) : (
                        <button onClick={() => setDeleteConfirm(u.id)} className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${darkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Status Bar */}
      <div className={`px-6 py-1.5 flex justify-between text-[11px] font-mono font-medium border-t ${darkMode ? 'bg-[#0f172a] border-gray-700 text-gray-500' : 'bg-surface-container-highest border-outline-variant/10 text-on-surface-variant/60'}`}>
        <span>AWM V 3.3.0-UI — User Management</span>
        <span>{users.length} registered user(s)</span>
      </div>

      {/* ═══ Modal ═══ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={() => { setModalMode(null); setError('') }}>
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700 bg-[#0f172a]' : 'border-outline-variant/10 bg-slate-50'}`}>
              <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {modalMode === 'add' ? 'person_add' : modalMode === 'edit' ? 'edit' : 'key'}
                </span>
                {modalMode === 'add' ? 'Add New User' : modalMode === 'edit' ? `Edit: ${editUser?.username}` : `Reset Password: ${editUser?.username}`}
              </h3>
              <button onClick={() => { setModalMode(null); setError('') }} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {error && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              {/* ADD mode */}
              {modalMode === 'add' && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-on-surface-variant'}`}>Username *</label>
                    <input className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${darkMode ? 'bg-[#0f172a] border-gray-600 text-white' : 'bg-white border-outline-variant/30 text-on-surface'}`}
                      value={formUsername} onChange={e => setFormUsername(e.target.value)} placeholder="e.g. accountant1" />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-on-surface-variant'}`}>Password *</label>
                    <input type="password" className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${darkMode ? 'bg-[#0f172a] border-gray-600 text-white' : 'bg-white border-outline-variant/30 text-on-surface'}`}
                      value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Min 6 characters" />
                  </div>
                </>
              )}

              {/* PASSWORD mode */}
              {modalMode === 'password' && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-on-surface-variant'}`}>New Password *</label>
                  <input type="password" className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${darkMode ? 'bg-[#0f172a] border-gray-600 text-white' : 'bg-white border-outline-variant/30 text-on-surface'}`}
                    value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
              )}

              {/* ADD + EDIT shared fields */}
              {(modalMode === 'add' || modalMode === 'edit') && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-on-surface-variant'}`}>Role</label>
                    <select className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${darkMode ? 'bg-[#0f172a] border-gray-600 text-white' : 'bg-white border-outline-variant/30 text-on-surface'}`}
                      value={formRole} onChange={e => setFormRole(e.target.value)}>
                      <option value="accountant">Accountant</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="tester">Tester</option>
                    </select>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formFs} onChange={e => setFormFs(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-semibold text-on-surface">Financial Statements</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formPayroll} onChange={e => setFormPayroll(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-semibold text-on-surface">Payroll</span>
                    </label>
                  </div>

                  {modalMode === 'edit' && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-semibold text-on-surface">Account Active</span>
                    </label>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-700 bg-[#0f172a]/50' : 'border-outline-variant/10 bg-slate-50/50'}`}>
              <button onClick={() => { setModalMode(null); setError('') }}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-on-surface-variant hover:bg-slate-100'}`}>
                Cancel
              </button>
              <button
                disabled={formSaving}
                onClick={() => {
                  if (modalMode === 'add') handleSaveAdd()
                  else if (modalMode === 'edit') handleSaveEdit()
                  else if (modalMode === 'password') handleResetPassword()
                }}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {modalMode === 'add' ? 'Create User' : modalMode === 'edit' ? 'Save Changes' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
