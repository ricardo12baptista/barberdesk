import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { AppInitializer } from './AppInitializer'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()
  const organization = useAuthStore(s => s.organization)
  const orgInactive = organization ? organization.isActive === false : false

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Populates AppStore with employee/location counts after login */}
      <AppInitializer />

      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className={cn(
        'flex flex-col flex-1 min-w-0 transition-all duration-300',
        'md:ml-64',
        sidebarCollapsed && 'md:ml-16'
      )}>
        <Topbar />

        {/* Inactive organization banner */}
        {orgInactive && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-sm font-body">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              A sua organização encontra-se <strong>inativa</strong>. Não é possível realizar novos agendamentos.
            </span>
          </div>
        )}

        <main className={cn(
          'flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 animate-fade-in',
          'pb-20 md:pb-6'
        )}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileNav />
    </div>
  )
}
