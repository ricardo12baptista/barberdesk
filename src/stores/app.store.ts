import { create } from 'zustand'
import { canAddBarber, canAddLocation } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

// ─── Derived context about the current org/user situation ─────────────────────
// This store is populated after login + employee list is fetched

interface AppState {
  // Set after fetching employees for the org
  totalBarbers: number
  totalLocations: number
  setTotals: (barbers: number, locations: number) => void

  // Derived helpers
  isSoloOwner: (role: string) => boolean
  canAddBarber: (plan: Plan) => boolean
  canAddLocation: (plan: Plan) => boolean
}

export const useAppStore = create<AppState>()((set, get) => ({
  totalBarbers: 0,
  totalLocations: 1,

  setTotals: (barbers, locations) => set({ totalBarbers: barbers, totalLocations: locations }),

  // Solo owner = super_admin with 0 or 1 barbers (just themselves)
  isSoloOwner: (role: string) => role === 'super_admin' && get().totalBarbers <= 1,

  canAddBarber:   (plan) => canAddBarber(plan, get().totalBarbers),
  canAddLocation: (plan) => canAddLocation(plan, get().totalLocations),
}))
