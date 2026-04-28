import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Location } from '@/models'

interface UIState {
  // Location context
  activeLocation: Location | null   // null = global view (super_admin only)
  setActiveLocation: (location: Location | null) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Language
  language: 'pt' | 'en'
  setLanguage: (lang: 'pt' | 'en') => void

  // Notifications panel
  notificationsPanelOpen: boolean
  setNotificationsPanelOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeLocation: null,
      setActiveLocation: (location) => set({ activeLocation: location }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      language: 'pt',
      setLanguage: (language) => set({ language }),

      notificationsPanelOpen: false,
      setNotificationsPanelOpen: (v) => set({ notificationsPanelOpen: v }),
    }),
    { name: 'businessdesk-ui' }
  )
)
