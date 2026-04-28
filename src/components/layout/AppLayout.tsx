import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { AppInitializer } from './AppInitializer'
import { useUIStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()

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
