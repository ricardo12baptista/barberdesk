import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, CalendarCheck2, UserCircle, Users,
  Scissors, TrendingUp, BarChart3, MapPin, Star, CalendarCheck,
  MoreHorizontal, LogOut, Settings, X, CalendarClock,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useAppStore } from '@/stores/app.store'
import { useLocations } from '@/hooks'
import { cn, getInitials } from '@/lib/utils'

type Tab = { to: string; icon: React.ElementType; label: string }

// ─── More drawer ──────────────────────────────────────────────────────────────
function MoreDrawer({ items, onClose }: { items: Tab[]; onClose: () => void }) {
  const { user, logout } = useAuthStore()
  const { setActiveLocation } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    setActiveLocation(null)
    logout()
    navigate('/login')
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border rounded-t-2xl pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-sidebar-foreground/20" />
        </div>

        {/* Extra nav items */}
        {items.length > 0 && (
          <div className="px-4 py-2 space-y-1">
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-body text-sm',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="mx-4 my-2 h-px bg-sidebar-border" />

        {/* User info + logout */}
        <div className="px-4 pb-4 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{getInitials(user?.name ?? '')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-body text-sm"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Terminar sessão
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main MobileNav ───────────────────────────────────────────────────────────
export function MobileNav() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { activeLocation } = useUIStore()
  const { totalBarbers } = useAppStore()
  const { data: locations = [] } = useLocations()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!user) return null

  const isSuperAdmin = user.role === 'super_admin'
  const isManager    = user.role === 'manager'
  const isPartner    = user.role === 'partner'
  const isEmployee   = user.role === 'employee'
  const isSoloOwner  = isSuperAdmin && locations.length > 0 && totalBarbers <= 1

  // ── Primary tabs (shown in bottom bar) ─────────────────────────────────────
  // ── Overflow items (shown in "Mais" drawer) ─────────────────────────────────
  let primaryTabs: Tab[]
  let overflowTabs: Tab[]

  if (isEmployee) {
    // Agenda e Marcações são praticamente iguais — mostrar só Agenda
    primaryTabs = [
      { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard')     },
      { to: '/calendar',  icon: CalendarDays,    label: t('nav.myCalendar')    },
      { to: '/clients',   icon: UserCircle,      label: t('nav.myClients')     },
      { to: '/reports',   icon: Star,            label: t('nav.myPerformance') },
    ]
    overflowTabs = [
      { to: '/services', icon: Scissors, label: t('nav.services') },
    ]
  } else if (isPartner) {
    primaryTabs = [
      { to: '/dashboard',    icon: LayoutDashboard, label: t('nav.dashboard')    },
      { to: '/calendar',     icon: CalendarDays,    label: t('nav.myCalendar')   },
      { to: '/appointments', icon: CalendarCheck2,  label: t('nav.appointments') },
      { to: '/clients',      icon: UserCircle,      label: t('nav.myClients')    },
    ]
    overflowTabs = [
      { to: '/financial', icon: TrendingUp, label: t('nav.financial')    },
      { to: '/reports',   icon: BarChart3,  label: t('nav.myPerformance') },
      { to: '/services',  icon: Scissors,   label: t('nav.services')     },
    ]
  } else if (isManager) {
    primaryTabs = [
      { to: '/dashboard',    icon: LayoutDashboard, label: t('nav.dashboard')    },
      { to: '/calendar',     icon: CalendarDays,    label: t('nav.calendar')     },
      { to: '/appointments', icon: CalendarCheck2,  label: t('nav.appointments') },
      { to: '/clients',      icon: UserCircle,      label: t('nav.clients')      },
    ]
    overflowTabs = [
      { to: '/employees', icon: Users,        label: t('nav.employees') },
      { to: '/services',  icon: Scissors,     label: t('nav.services')  },
      { to: '/schedule',  icon: CalendarClock,label: t('nav.schedule')  },
      { to: '/financial', icon: TrendingUp,   label: t('nav.financial') },
      { to: '/reports',   icon: BarChart3,    label: t('nav.reports')   },
    ]
  } else if (isSoloOwner) {
    primaryTabs = [
      { to: '/dashboard',    icon: LayoutDashboard, label: t('nav.dashboard')    },
      { to: '/calendar',     icon: CalendarDays,    label: t('nav.calendar')     },
      { to: '/appointments', icon: CalendarCheck2,  label: t('nav.appointments') },
      { to: '/clients',      icon: UserCircle,      label: t('nav.clients')      },
    ]
    overflowTabs = [
      { to: '/services',  icon: Scissors,     label: t('nav.services')  },
      { to: '/schedule',  icon: CalendarClock,label: t('nav.schedule')  },
      { to: '/financial', icon: TrendingUp,   label: t('nav.financial') },
      { to: '/reports',   icon: BarChart3,    label: t('nav.reports')   },
      { to: '/settings',  icon: Settings,     label: t('nav.settings')  },
    ]
  } else {
    // super_admin with team
    primaryTabs = [
      { to: '/dashboard',    icon: LayoutDashboard, label: t('nav.dashboard')    },
      { to: '/calendar',     icon: CalendarDays,    label: t('nav.calendar')     },
      { to: '/appointments', icon: CalendarCheck2,  label: t('nav.appointments') },
      { to: '/clients',      icon: UserCircle,      label: t('nav.clients')      },
    ]
    overflowTabs = [
      { to: '/employees', icon: Users,        label: t('nav.employees') },
      { to: '/services',  icon: Scissors,     label: t('nav.services')  },
      { to: '/schedule',  icon: CalendarClock,label: t('nav.schedule')  },
      { to: '/locations', icon: MapPin,        label: t('nav.locations') },
      { to: '/financial', icon: TrendingUp,   label: t('nav.financial') },
      { to: '/reports',   icon: BarChart3,    label: t('nav.reports')   },
      { to: '/settings',  icon: Settings,     label: t('nav.settings')  },
    ]
  }

  const allPrimary: Tab[] = [
    ...primaryTabs,
    { to: '#more', icon: MoreHorizontal, label: 'Mais' },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border md:hidden">
        <div className="flex items-center">
          {allPrimary.map(tab => {
            if (tab.to === '#more') {
              return (
                <button
                  key="more"
                  onClick={() => setDrawerOpen(true)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors',
                    drawerOpen ? 'text-primary' : 'text-sidebar-foreground/50'
                  )}
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-[10px] font-body font-medium leading-none">Mais</span>
                </button>
              )
            }
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors',
                    isActive ? 'text-primary' : 'text-sidebar-foreground/50'
                  )
                }
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-body font-medium leading-none truncate max-w-[56px] text-center">
                  {tab.label}
                </span>
              </NavLink>
            )
          })}
        </div>
        <div className="h-safe-area-inset-bottom bg-sidebar" />
      </nav>

      {drawerOpen && (
        <MoreDrawer
          items={overflowTabs}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}
