import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api'
import type { User, Organization } from '@/models'

interface AuthState {
  user:            User | null
  organization:    Organization | null
  token:           string | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null

  // login(email, password) → calls API, stores result, returns true/false
  login:      (email: string, password: string) => Promise<boolean>
  logout:     () => void
  updateUser: (partial: Partial<User>) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      organization:    null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.login(email, password)
          const { user, organization, token } = res.data
          // Normalise role to lowercase so it matches frontend permission system
          // Backend may return 'SUPER_ADMIN', frontend expects 'super_admin'
          const normalisedUser = {
            ...user,
            role: (user.role as string).toLowerCase() as User['role'],
          }
          set({ user: normalisedUser, organization, token, isAuthenticated: true, isLoading: false })
          return true
        } catch {
          set({ isLoading: false, error: 'Credenciais inválidas. Tenta novamente.' })
          return false
        }
      },

      logout: () =>
        set({ user: null, organization: null, token: null, isAuthenticated: false, error: null }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'barberdesk-auth',
      // Only persist auth data, not loading/error state
      partialize: (s) => ({
        user:            s.user,
        organization:    s.organization,
        token:           s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)