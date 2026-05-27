import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, isToday, isTomorrow, isYesterday, addDays, subDays } from 'date-fns'
import { pt as ptLocale, enUS } from 'date-fns/locale'
import { Search, Filter, CalendarDays, Clock, User, Scissors, CheckCircle2, Ban, Phone, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAppointments, useEmployees, useClientsFlat, useAllClients, useServices, useUpdateAppointmentStatus, useDailySummary } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader, Card, CardContent, Badge, Avatar, Button, Spinner, EmptyState } from '@/components/ui'
import { formatCurrency, formatTime, cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/models'

const VISIBLE_STATUSES = ['confirmed', 'completed', 'no_show'] as const
type VisibleStatus = typeof VISIBLE_STATUSES[number]

function toVisibleStatus(status: AppointmentStatus): VisibleStatus {
  const s = status?.toLowerCase?.() ?? ''
  if (s === 'completed')                       return 'completed'
  if (s === 'no_show' || s === 'cancelled') return 'no_show'
  return 'confirmed'
}

export function AppointmentsPage() {
  const { t, i18n } = useTranslation()
  const { user }           = useAuthStore()
  const { activeLocation } = useUIStore()
  const isSuperAdmin = user?.role === 'super_admin'
  const isPartner    = user?.role === 'partner'
  const isEmployee   = user?.role === 'employee'
  const isOwnOnly    = isPartner || isEmployee
  const locationId   = activeLocation?.id ?? user?.locationId ?? undefined
  const dateLocale   = i18n.language === 'pt' ? ptLocale : enUS

  // ── Date ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const dateKey = format(selectedDate, 'yyyy-MM-dd')

  // ── Confirm prompt ────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState<{
    aptId: string; status: AppointmentStatus; label: string
  } | null>(null)

  // ── Daily Summary (dedicated endpoint for card stats) ─
  const { data: summary, isLoading: summaryLoading } = useDailySummary(dateKey, locationId)

  // ── Full appointments list ───────────────────────────
  const { data: employees  = [] } = useEmployees(locationId)
  const myEmployeeId = isOwnOnly
    ? employees.find(e => e.userId === user?.id)?.id
    : undefined

  const { data: appointments = [], isLoading: aptsLoading } = useAppointments({ locationId, startsAt: dateKey, endsAt: dateKey, employeeId: myEmployeeId })
  const isLoading = aptsLoading || summaryLoading
  const { data: ownClients   = [] } = useClientsFlat()
  const { data: allClients   = [] } = useAllClients()
  const clients = isSuperAdmin ? allClients : ownClients
  const { data: services     = [] } = useServices()
  const updateApt = useUpdateAppointmentStatus()

  // ── Action buttons config ─────────────────────────────
  const STATUS_CONFIG: Record<VisibleStatus, { label: string; icon: React.ElementType; style: string }> = {
    confirmed: { label: t('appointments.status.confirmed'), icon: CheckCircle2, style: 'bg-blue-500/15  text-blue-400  border-blue-500/30'  },
    completed: { label: t('appointments.status.completed'), icon: CheckCircle2, style: 'bg-green-500/15 text-green-500 border-green-500/30' },
    no_show:   { label: t('appointments.status.no_show'),   icon: Ban,          style: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  }

  const ACTIONABLE_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress']

  // ── Filters ───────────────────────────────────────────
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<VisibleStatus | 'all'>('all')
  const [empFilter,    setEmpFilter]    = useState('all')
  const [showFilters,  setShowFilters]  = useState(false)

  const empMap     = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees])
  const clientMap  = useMemo(() => Object.fromEntries(clients.map(c  => [c.id, c])), [clients])
  const serviceMap = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])), [services])

  const filtered = useMemo(() => {
    let list = [...appointments].sort((a, b) =>
      new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    )
    if (isOwnOnly && myEmployeeId) list = list.filter(a => a.employeeId === myEmployeeId)
    if (statusFilter !== 'all') list = list.filter(a => toVisibleStatus(a.status) === statusFilter)
    if (empFilter    !== 'all') list = list.filter(a => a.employeeId === empFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        clientMap[a.clientId]?.name.toLowerCase().includes(q)   ||
        clientMap[a.clientId]?.phone.includes(q)                ||
        serviceMap[a.serviceId]?.name.toLowerCase().includes(q) ||
        empMap[a.employeeId]?.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [appointments, statusFilter, empFilter, search, clientMap, serviceMap, empMap, isOwnOnly, myEmployeeId])

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const apt of filtered) {
      const day = apt.startsAt.slice(0, 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(apt)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  // ✅ Summary from dedicated endpoint (handles backend status casing correctly)
  const effectiveTotal = summary?.total ?? appointments.length
  const confirmedCount = summary?.confirmed ?? appointments.filter(a => toVisibleStatus(a.status) === 'confirmed').length
  const dayRevenue     = summary?.revenue ?? 0
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (empFilter !== 'all' ? 1 : 0)

  const isSelectedToday = isToday(selectedDate)
  const dateLabel = isSelectedToday
    ? t('common.today')
    : isTomorrow(selectedDate)
      ? (i18n.language === 'pt' ? 'Amanhã' : 'Tomorrow')
      : isYesterday(selectedDate)
        ? (i18n.language === 'pt' ? 'Ontem' : 'Yesterday')
        : format(selectedDate, "EEE, d MMM", { locale: dateLocale })

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    await updateApt.mutateAsync({ id: confirmAction.aptId, status: confirmAction.status.toUpperCase() as AppointmentStatus })
    setConfirmAction(null)
  }

  return (
    <div>
      <PageHeader title={t('nav.appointments')} subtitle={`${appointments.length} ${i18n.language === 'pt' ? 'marcações' : 'appointments'}`} />

      {/* ── Date navigator ─────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSelectedDate(d => subDays(d, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          {[-1, 0, 1].map(offset => {
            const d = offset === 0 ? new Date() : offset === -1 ? subDays(new Date(), 1) : addDays(new Date(), 1)
            d.setHours(0, 0, 0, 0)
            const key   = format(d, 'yyyy-MM-dd')
            const label = offset === -1
              ? (i18n.language === 'pt' ? 'Ontem' : 'Yesterday')
              : offset === 0
                ? t('common.today')
                : (i18n.language === 'pt' ? 'Amanhã' : 'Tomorrow')
            const isActive = dateKey === key
            return (
              <button key={key} onClick={() => setSelectedDate(d)}
                className={cn('h-8 px-3 rounded-lg text-xs font-body font-medium border transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            )
          })}

          <div className="flex items-center gap-2 ml-auto">
            <span className={cn('text-sm font-display font-semibold capitalize',
              isSelectedToday ? 'text-primary' : 'text-foreground'
            )}>
              {dateLabel}
            </span>
            <input
              type="date"
              value={dateKey}
              onChange={e => {
                const d = new Date(e.target.value + 'T00:00:00')
                setSelectedDate(d)
              }}
              className="h-8 w-8 opacity-0 absolute cursor-pointer"
            />
            <CalendarDays className="w-4 h-4 text-muted-foreground cursor-pointer" />
          </div>
        </div>

        <button
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Summary strip ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: i18n.language === 'pt' ? 'Marcações' : 'Appointments', value: String(effectiveTotal), sub: dateLabel,                        color: 'text-foreground'  },
          { label: t('appointments.confirmed'),                             value: String(confirmedCount),      sub: t('appointments.toDo'),           color: confirmedCount > 0 ? 'text-blue-400' : 'text-foreground' },
          { label: t('appointments.revenueToday'),                         value: formatCurrency(dayRevenue),  sub: t('appointments.concluded'),      color: 'text-green-400'   },
        ].map(s => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn('font-display font-bold text-xl leading-none', s.color)}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-body mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter toggle ─────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('appointments.searchPlaceholder')}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-muted/30 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}>
          <Filter className="w-3.5 h-3.5" />
          {t('appointments.filters')}
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-display font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 px-4 py-3 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-body mr-1">{t('appointments.statusLabel')}:</span>
            {(['all', ...VISIBLE_STATUSES] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('h-7 px-2.5 rounded-lg text-xs font-body font-medium border transition-all',
                  statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {s === 'all' ? t('appointments.all') : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          {employees.length > 1 && !isOwnOnly && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-body mr-1">{t('appointments.barber')}:</span>
              <button onClick={() => setEmpFilter('all')}
                className={cn('h-7 px-2.5 rounded-lg text-xs font-body font-medium border transition-all',
                  empFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >{t('appointments.all')}</button>
              {employees.map(e => (
                <button key={e.id} onClick={() => setEmpFilter(e.id)}
                  className={cn('h-7 px-2.5 rounded-lg text-xs font-body font-medium border transition-all',
                    empFilter === e.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >{e.name}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── List ────────────────────────────────────────── */}
      {isLoading ? <Spinner /> : filtered.length === 0 ? (
        <Card><CardContent className="py-10">
          <EmptyState icon={CalendarDays} title={t('appointments.noResults')}
            description={search || statusFilter !== 'all' ? t('appointments.noFilter') : t('appointments.noData')} />
        </CardContent></Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(([day, apts]) => (
            <div key={day}>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {apts.map(apt => {
                    const client  = clientMap[apt.clientId]
                    const service = serviceMap[apt.serviceId]
                    const emp     = empMap[apt.employeeId]
                    const vstatus = toVisibleStatus(apt.status)
                    const cfg     = STATUS_CONFIG[vstatus]
                    const SIcon   = cfg.icon
                    const isActionable = ACTIONABLE_STATUSES.includes(apt.status.toLowerCase() as AppointmentStatus)

                    return (
                      <div key={apt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div className="w-11 flex-shrink-0 text-right">
                          <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{formatTime(apt.startsAt)}</span>
                          <p className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">{formatTime(apt.endsAt)}</p>
                        </div>
                        <Avatar name={client?.name ?? '?'} size="sm" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium font-body text-foreground">{client?.name ?? apt.clientId}</span>
                            <Badge className={cn(cfg.style, 'text-[10px] flex items-center gap-1 py-0 px-1.5')}>
                              <SIcon className="w-2.5 h-2.5" />{cfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {service && (
                              <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                                <Scissors className="w-3 h-3" />{service.name}
                              </span>
                            )}
                            {emp && employees.length > 1 && (
                              <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                                <User className="w-3 h-3" />{emp.name}
                              </span>
                            )}
                            {client?.phone && (
                              <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                                <Phone className="w-3 h-3" />{client.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right hidden sm:block">
                          <span className="text-sm font-display font-semibold text-foreground">{formatCurrency(apt.price ?? 0)}</span>
                          {service && (
                            <p className="text-[10px] text-muted-foreground font-body flex items-center justify-end gap-0.5">
                              <Clock className="w-2.5 h-2.5" />{service.durationMinutes}min
                            </p>
                          )}
                        </div>

                        {/* ── Action buttons ────────────────── */}
                        {isActionable && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => setConfirmAction({ aptId: apt.id, status: 'completed', label: t('appointments.markDone') })}
                              className="h-7 px-2 rounded-lg text-[11px] font-body font-medium flex items-center gap-1 transition-colors text-green-400 bg-green-500/15 hover:bg-green-500/25"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('appointments.markDone')}</span>
                            </button>
                            <button
                              onClick={() => setConfirmAction({ aptId: apt.id, status: 'no_show', label: t('appointments.markNoShow') })}
                              className="h-7 px-2 rounded-lg text-[11px] font-body font-medium flex items-center gap-1 transition-colors text-slate-400 bg-slate-500/15 hover:bg-slate-500/25"
                            >
                              <Ban className="w-3 h-3" />
                              <span>{t('appointments.markNoShow')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirm modal ──────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">
                  {confirmAction.status === 'completed'
                    ? (i18n.language === 'pt' ? 'Concluir marcação?' : 'Complete appointment?')
                    : (i18n.language === 'pt' ? 'Marcar como falta?' : 'Mark as no-show?')
                  }
                </h3>
                <p className="text-sm font-body text-muted-foreground">
                  {confirmAction.status === 'completed'
                    ? (i18n.language === 'pt' ? 'O cliente apareceu e pagou?' : 'Did the client show up and pay?')
                    : (i18n.language === 'pt' ? 'O cliente não apareceu?' : "Didn't the client show up?")
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAction}
                disabled={updateApt.isPending}
                className={
                  confirmAction.status === 'completed'
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30'
                    : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border-slate-500/30'
                }
              >
                {updateApt.isPending
                  ? (i18n.language === 'pt' ? 'A guardar...' : 'Saving...')
                  : confirmAction.label
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}