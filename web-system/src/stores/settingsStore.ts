import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  darkMode: boolean
  profilePhoto: string | null  // base64 data URL
  displayName: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'en-US' | 'en-PH'
  showStatusBar: boolean
  compactSidebar: boolean
  toggleDarkMode: () => void
  setDarkMode: (v: boolean) => void
  setProfilePhoto: (photo: string | null) => void
  setDisplayName: (name: string) => void
  setDateFormat: (fmt: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => void
  setNumberFormat: (fmt: 'en-US' | 'en-PH') => void
  setShowStatusBar: (v: boolean) => void
  setCompactSidebar: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      profilePhoto: null,
      displayName: '',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-PH',
      showStatusBar: true,
      compactSidebar: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode: (v) => set({ darkMode: v }),
      setProfilePhoto: (photo) => set({ profilePhoto: photo }),
      setDisplayName: (name) => set({ displayName: name }),
      setDateFormat: (fmt) => set({ dateFormat: fmt }),
      setNumberFormat: (fmt) => set({ numberFormat: fmt }),
      setShowStatusBar: (v) => set({ showStatusBar: v }),
      setCompactSidebar: (v) => set({ compactSidebar: v }),
    }),
    { name: 'settings-storage' }
  )
)
