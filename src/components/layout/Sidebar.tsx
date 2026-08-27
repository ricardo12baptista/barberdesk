import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, CalendarCheck2, Users, UserCircle,
  Scissors, MapPin, BarChart3, Settings, TrendingUp,
  ChevronLeft, ChevronRight, ChevronsUpDown, Star, Crown,
  LogOut, ChevronDown, ChevronUp, Shield, Briefcase, User, CalendarCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useAppStore } from '@/stores/app.store'
import { useLocations } from '@/hooks'
import { can, Ability } from '@/permissions/abilities'
import { PLANS } from '@/lib/plans'
import { cn, getInitials } from '@/lib/utils'
import type { Plan } from '@/lib/plans'

interface NavItem {
  label:   string
  to:      string
  icon:    React.ElementType
  ability?: Ability
}

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Proprietário',    icon: Shield,   color: 'text-amber-400'  },
  owner:       { label: 'Dono da Barbearia', icon: Crown,  color: 'text-purple-400' },
  manager:     { label: 'Gestor de Loja',  icon: Briefcase,color: 'text-blue-400'   },
  partner:     { label: 'Parceiro',        icon: Star,     color: 'text-violet-400' },
  employee:    { label: 'Barbeiro',        icon: User,     color: 'text-green-400'  },
}

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, organization, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, activeLocation, setActiveLocation } = useUIStore()
  const { totalBarbers } = useAppStore()
  const { data: locations = [] } = useLocations()

  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    if (activeLocation && !locations.some(location => location.id === activeLocation.id)) {
      setActiveLocation(null)
    }
  }, [activeLocation, locations, setActiveLocation])

  if (!user) return null

  const isSuperAdmin = user.role === 'super_admin'
  const isOwner      = user.role === 'owner'
  const isManager    = user.role === 'manager'
  const isPartner    = user.role === 'partner'
  const isEmployee   = user.role === 'employee'
  const plan         = (organization?.plan ?? 'basic') as Plan
  const planConfig   = PLANS[plan]
  const roleMeta     = ROLE_META[user.role] ?? ROLE_META.employee

  // isSoloOwner: guard against loading race — only true once locations have loaded
  const isSoloOwner = (isSuperAdmin || isOwner) && locations.length === 1 && totalBarbers <= 1
  // Owner e super_admin têm acesso a todas as lojas da organização
  const isMultiLocation = (isSuperAdmin || isOwner) && locations.length > 1

  // ─── Nav items per role ─────────────────────────────────────────────────────
  const employeeItems: NavItem[] = [
    { label: t('nav.myCalendar'),    to: '/calendar',     icon: CalendarDays   },
    { label: t('nav.appointments'),  to: '/appointments', icon: CalendarCheck2 },
    { label: t('nav.myClients'),     to: '/clients',      icon: UserCircle     },
    { label: t('nav.services'),      to: '/services',     icon: Scissors       },
    { label: t('nav.myPerformance'), to: '/reports',      icon: Star           },
  ]

  const partnerItems: NavItem[] = [
    { label: t('nav.myCalendar'),    to: '/calendar',     icon: CalendarDays   },
    { label: t('nav.appointments'),  to: '/appointments', icon: CalendarCheck2 },
    { label: t('nav.myClients'),     to: '/clients',      icon: UserCircle     },
    { label: t('nav.services'),      to: '/services',     icon: Scissors       },
    { label: t('nav.financial'),     to: '/financial',    icon: TrendingUp     },
    { label: t('nav.myPerformance'), to: '/reports',      icon: BarChart3      },
  ]

  const managerItems: NavItem[] = [
    { label: t('nav.calendar'),     to: '/calendar',     icon: CalendarDays   },
    { label: t('nav.appointments'), to: '/appointments', icon: CalendarCheck2 },
    { label: t('nav.clients'),      to: '/clients',      icon: UserCircle     },
    { label: t('nav.services'),     to: '/services',     icon: Scissors       },
    { label: t('nav.employees'),    to: '/employees',    icon: Users          },
    { label: t('nav.financial'),    to: '/financial',    icon: TrendingUp     },
    { label: t('nav.reports'),      to: '/reports',      icon: BarChart3      },
  ]

  const superAdminItems: NavItem[] = [
    { label: t('nav.calendar'),     to: '/calendar',     icon: CalendarDays   },
    { label: t('nav.appointments'), to: '/appointments', icon: CalendarCheck2 },
    { label: t('nav.clients'),      to: '/clients',      icon: UserCircle     },
    { label: t('nav.services'),     to: '/services',     icon: Scissors       },
    { label: t('nav.employees'),    to: '/employees',    icon: Users          },
    { label: t('nav.schedule'),      to: '/schedule',     icon: CalendarCheck    },
    { label: t('nav.locations'),    to: '/locations',    icon: MapPin         },
    { label: t('nav.financial'),    to: '/financial',    icon: TrendingUp     },
    { label: t('nav.reports'),      to: '/reports',      icon: BarChart3      },
  ]

  const soloOwnerItems: NavItem[] = [
    { label: t('nav.calendar'),     to: '/calendar',     icon: CalendarDays   },
    { label: t('nav.appointments'), to: '/appointments', icon: CalendarCheck2 },
    { label: t('nav.clients'),      to: '/clients',      icon: UserCircle     },
    { label: t('nav.services'),     to: '/services',     icon: Scissors       },
    { label: t('nav.employees'),    to: '/employees',    icon: Users          },
    { label: t('nav.schedule'),      to: '/schedule',     icon: CalendarCheck    },
    { label: t('nav.financial'),    to: '/financial',    icon: TrendingUp     },
    { label: t('nav.reports'),      to: '/reports',      icon: BarChart3      },
  ]

  let mainItems: NavItem[]
  if (isEmployee)       mainItems = employeeItems
  else if (isPartner)   mainItems = partnerItems
  else if (isManager)   mainItems = managerItems
  else if (isSoloOwner) mainItems = soloOwnerItems
  else                  mainItems = superAdminItems

  const navItems: NavItem[] = [
    { label: t('nav.dashboard'), to: '/dashboard', icon: LayoutDashboard },
    ...mainItems,
  ]

  const locationLabel = activeLocation?.name ?? (locations.find(l => l.id === user.locationId)?.name ?? (locations.length === 1 ? locations[0].name : ''))

  const handleLogout = () => {
    setActiveLocation(null)
    logout()
    navigate('/login')
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen flex flex-col z-40 transition-all duration-300',
      'bg-sidebar border-r border-sidebar-border',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* ─── Header: org name ────────────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center h-14 px-3 border-b border-sidebar-border flex-shrink-0 gap-2.5 min-w-0',
        sidebarCollapsed && 'justify-center px-2'
      )}>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Scissors className="w-3.5 h-3.5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sidebar-foreground text-sm leading-tight truncate">
              {organization?.name ?? 'BarberDesk'}
            </p>
            <p className="text-[11px] text-sidebar-foreground/40 font-body truncate leading-tight mt-0.5">
              {locationLabel}
            </p>
          </div>
        )}
      </div>

      {/* ── Location switcher — super_admin / owner ─────────────────────────── */}
      {isMultiLocation && !sidebarCollapsed && (
        <div className="px-3 py-2.5 border-b border-sidebar-border flex-shrink-0">
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest mb-1.5 font-display">
            {t('locations.title')}
          </p>
          <div className="relative">
            <select
              value={activeLocation?.id ?? locations[0]?.id ?? ''}
              onChange={e => {
                const loc = locations.find(l => l.id === e.target.value) ?? null
                if (loc) setActiveLocation(loc)
              }}
              className={cn(
                'w-full h-8 rounded-lg pl-2.5 pr-7 text-xs font-body appearance-none cursor-pointer',
                'bg-sidebar-foreground/5 border border-sidebar-border',
                'text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-primary',
              )}
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-sidebar-foreground/40 pointer-events-none" />
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        <ul className="space-y-0.5">
          {navItems
            .filter(item => !item.ability || can(user.role, item.ability))
            .map(item => (
              <li key={item.to + item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body transition-all',
                    'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5',
                    isActive && 'bg-primary/15 text-primary font-medium',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>

      {/* ── Plan badge ──────────────────────────────────────────────────────── */}
      {!sidebarCollapsed && (
        <div className="mx-2 mb-1 px-3 py-1.5 rounded-lg bg-primary/10 flex items-center gap-2 flex-shrink-0">
          <Crown className="w-3 h-3 text-primary flex-shrink-0" />
          <span className="text-xs font-display font-semibold text-primary">{planConfig?.name ?? 'Básico'}</span>
          {isSuperAdmin && (
            <span className="text-[10px] text-primary/50 font-body ml-auto">
              {locations.length} {locations.length === 1 ? 'loja' : 'lojas'}
            </span>
          )}
        </div>
      )}

      {/* ── Settings link ───────────────────────────────────────────────────── */}
      {!isEmployee && !isPartner && (
        <div className="px-2 pb-1 flex-shrink-0">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body transition-all',
              'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5',
              isActive && 'bg-primary/15 text-primary font-medium',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>{t('nav.settings')}</span>}
          </NavLink>
        </div>
      )}

      {/* ── User panel ──────────────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border flex-shrink-0">
        <button
          onClick={() => !sidebarCollapsed && setUserMenuOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-3 transition-colors',
            'hover:bg-white/5',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/30">
            <span className="text-xs font-display font-bold text-primary leading-none">
              {getInitials(user.name)}
            </span>
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-sidebar-foreground truncate font-body leading-tight">
                  {user.name}
                </p>
                <div className={cn('flex items-center gap-1 mt-0.5', roleMeta.color)}>
                  <roleMeta.icon className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="text-[10px] font-body truncate">{roleMeta.label}</span>
                </div>
              </div>
              {userMenuOpen
                ? <ChevronUp   className="w-3.5 h-3.5 text-sidebar-foreground/40 flex-shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 flex-shrink-0" />
              }
            </>
          )}
        </button>

        {userMenuOpen && !sidebarCollapsed && (
          <div className="px-3 pb-3 space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border">
              <p className="text-[10px] text-sidebar-foreground/40 font-body truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-body',
                'text-red-400 hover:bg-red-500/10 transition-colors'
              )}
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Terminar sessão</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ─────────────────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary/20 transition-colors z-50"
      >
        {sidebarCollapsed
          ? <ChevronRight className="w-3 h-3 text-sidebar-foreground/60" />
          : <ChevronLeft  className="w-3 h-3 text-sidebar-foreground/60" />}
      </button>
    </aside>
  )
}