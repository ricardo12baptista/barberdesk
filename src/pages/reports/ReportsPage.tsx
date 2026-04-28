import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, Users, Calendar, Scissors, Star, Building2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, isWithinInterval, parseISO, format } from 'date-fns'
import { pt as ptLocale, enUS } from 'date-fns/locale'
import { useAppointments, useEmployees, useClientsFlat, useAllClients, useServices, useLocations, useAllLocations } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Spinner, Input } from '@/components/ui'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/models'

type RangeKey = 'this_week' | 'this_month' | 'last_3_months' | 'this_year' | 'custom'

function getRangeInterval(key: RangeKey, customFrom: string, customTo: string) {
  const now = new Date()
  switch (key) {
    case 'this_week':     return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'this_month':    return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_3_months': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case 'this_year':     return { start: startOfYear(now), end: now }
    case 'custom':        return {
      start: customFrom ? parseISO(customFrom) : startOfMonth(now),
      end:   customTo   ? parseISO(customTo)   : endOfMonth(now),
    }
  }
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500', confirmed: 'bg-blue-500', in_progress: 'bg-sky-400',
  completed: 'bg-green-500', cancelled: 'bg-red-500', no_show: 'bg-slate-500',
}

export function ReportsPage() {
  const { t, i18n } = useTranslation()
  const { user }           = useAuthStore()
  const { activeLocation } = useUIStore()
  const isSuperAdmin       = user?.role === 'super_admin'
  const isPartner          = user?.role === 'partner'
  const isEmployee         = user?.role === 'employee'
  //const isManager          = user?.role === 'manager'
  const isOwnOnly          = isPartner || isEmployee
  const isSelfScoped       = isOwnOnly
  const locationId         = activeLocation?.id ?? user?.locationId ?? undefined
  const dateLocale         = i18n.language === 'pt' ? ptLocale : enUS

  const queryLocationId    = isSuperAdmin ? locationId : (user?.locationId ?? undefined)
  // Single employee lookup — used for scoping appointments, clients and employee filter
  const { data: employees = [] } = useEmployees(queryLocationId)
  const myEmployee    = isOwnOnly ? employees.find(e => e.userId === user?.id) : undefined
  const myEmpId       = myEmployee?.id
  const commissionPct = myEmployee?.commissionPercent ?? 100
  // Self-scoped roles see their commission earnings, not full price
  const applyCommission = useCallback((price: number) => isOwnOnly ? price * (commissionPct / 100) : price, [isOwnOnly, commissionPct])
  const { data: allApts   = [], isLoading } = useAppointments({
    locationId: queryLocationId,
    employeeId: myEmpId,
  })
  const { data: ownClients = [] } = useClientsFlat()
  const { data: allClients = [] } = useAllClients()
  const clients = isSuperAdmin ? allClients : ownClients
  const { data: services  = [] } = useServices()
  const { data: ownLocations = [] } = useLocations()
  const { data: allLocations = [] } = useAllLocations()
  const locations         = isSuperAdmin ? allLocations : ownLocations
  const showLocationChart = isSuperAdmin && locations.length > 1

  const [rangeKey,   setRangeKey]   = useState<RangeKey>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')
  const [tab,        setTab]        = useState<'overview' | 'employees' | 'clients' | 'services'>('overview')
  const [clientSort,  setClientSort]  = useState<{ col: 'name' | 'count' | 'revenue' | 'avgTicket'; dir: 'asc' | 'desc' }>({ col: 'revenue', dir: 'desc' })
  const [clientPage,  setClientPage]  = useState(1)
  const CLIENT_PAGE_SIZE = 15

  const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending:     t('appointments.status.pending'),
    confirmed:   t('appointments.status.confirmed'),
    in_progress: t('appointments.status.in_progress'),
    completed:   t('appointments.status.completed'),
    cancelled:   t('appointments.status.cancelled'),
    no_show:     t('appointments.status.no_show'),
  }

  const RANGES: { key: RangeKey; label: string }[] = [
    { key: 'this_week',     label: t('reports.thisWeek')    },
    { key: 'this_month',    label: t('reports.thisMonth')   },
    { key: 'last_3_months', label: t('reports.last3months') },
    { key: 'this_year',     label: t('reports.thisYear')    },
    { key: 'custom',        label: t('reports.custom')      },
  ]

  const ALL_TABS = [
    { key: 'overview'  as const, label: t('reports.tabOverview'), icon: BarChart3 },
    { key: 'employees' as const, label: t('reports.tabBarbers'),  icon: Users     },
    { key: 'clients'   as const, label: t('reports.tabClients'),  icon: Star      },
    { key: 'services'  as const, label: t('reports.tabServices'), icon: Scissors  },
  ]
  // Employee/partner only see overview + their clients + services (no barbers tab)
  const TABS = isSelfScoped
    ? ALL_TABS.filter(t => t.key !== 'employees')
    : ALL_TABS

  const interval = useMemo(() => getRangeInterval(rangeKey, customFrom, customTo), [rangeKey, customFrom, customTo])

  const apts = useMemo(() =>
    allApts.filter(a => { try { return isWithinInterval(parseISO(a.startsAt), interval) } catch { return false } }),
  [allApts, interval])

  const completedApts = useMemo(() => apts.filter(a => a.status === 'completed'), [apts])
  const totalRevenue  = useMemo(() => completedApts.reduce((s, a) => s + applyCommission(a.price), 0), [completedApts, applyCommission])

  const statusBreakdown = useMemo(() =>
    (['completed', 'confirmed', 'pending', 'cancelled', 'no_show', 'in_progress'] as AppointmentStatus[])
      .map(status => ({ status, count: apts.filter(a => a.status === status).length })),
  [apts])

  const empStats = useMemo(() =>
    employees.map(emp => {
      const empApts   = completedApts.filter(a => a.employeeId === emp.id)
      const revenue   = empApts.reduce((s, a) => s + applyCommission(a.price), 0)
      const ratings   = empApts.filter(a => a.rating)
      const avgRating = ratings.length ? ratings.reduce((s, a) => s + (a.rating ?? 0), 0) / ratings.length : 0
      return { emp, count: empApts.length, revenue, avgRating }
    }).sort((a, b) => b.revenue - a.revenue),
  [employees, completedApts, applyCommission])

  const clientStats = useMemo(() =>
    clients.map(c => {
      const ca = completedApts.filter(a => a.clientId === c.id)
      return { client: c, count: ca.length, revenue: ca.reduce((s, a) => s + applyCommission(a.price), 0) }
    }).filter(c => c.count > 0),
  [clients, completedApts, applyCommission])

  const serviceStats = useMemo(() =>
    services.map(svc => {
      const sa = completedApts.filter(a => a.serviceId === svc.id)
      return { svc, count: sa.length, revenue: sa.reduce((s, a) => s + applyCommission(a.price), 0) }
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count),
  [services, completedApts, applyCommission])

  const locationRevMap = useMemo(() =>
    completedApts.reduce((acc, a) => {
      acc[a.locationId] = (acc[a.locationId] ?? 0) + applyCommission(a.price); return acc
    }, {} as Record<string, number>),
  [completedApts, applyCommission])

  const rangeLabel = useMemo(() => {
    const { start, end } = interval
    return `${format(start, 'd MMM', { locale: dateLocale })} – ${format(end, 'd MMM yyyy', { locale: dateLocale })}`
  }, [interval, dateLocale])

  const noDataMsg = t('reports.noDataPeriod')

  return (
    <div>
      <PageHeader
        title={t('nav.reports')}
        subtitle={`${apts.length} ${t('reports.appointments').toLowerCase()} · ${formatCurrency(totalRevenue)} · ${rangeLabel}`}
      />

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => { setRangeKey(r.key); setClientPage(1) }}
              className={cn('h-7 px-3 rounded-md text-xs font-body font-medium transition-all',
                rangeKey === r.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >{r.label}</button>
          ))}
        </div>
        {rangeKey === 'custom' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 w-36 text-xs" />
            <span className="text-xs text-muted-foreground font-body">{t('reports.dateTo')}</span>
            <Input type="date" value={customTo}   onChange={e => setCustomTo(e.target.value)}   className="h-8 w-36 text-xs" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-muted rounded-lg p-1 w-fit">
        {TABS.map(tab_ => (
          <button key={tab_.key} onClick={() => setTab(tab_.key)}
            className={cn('flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-body font-medium transition-all',
              tab === tab_.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          ><tab_.icon className="w-3.5 h-3.5" />{tab_.label}</button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Personal performance banner for employee/partner */}
              {isSelfScoped && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-display font-bold text-primary">
                      {apts.length > 0 ? Math.round((completedApts.length / apts.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold text-foreground">O meu desempenho</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {completedApts.length} marcações concluídas · {formatCurrency(totalRevenue)} ganhos (comissão {commissionPct}%) · {new Set(completedApts.map(a => a.clientId)).size} clientes
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-foreground">{formatCurrency(completedApts.length ? totalRevenue / completedApts.length : 0)}</p>
                    <p className="text-[11px] text-muted-foreground font-body">ticket médio</p>
                  </div>
                </div>
              )}
              <div className={`grid gap-3 ${isSelfScoped ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {[
                  { label: t('reports.totalApts'),     value: String(apts.length),          icon: Calendar,   color: 'text-blue-400'  },
                  { label: t('reports.completed'),      value: String(completedApts.length), icon: TrendingUp, color: 'text-green-400' },
                  ...(!isSelfScoped ? [
                    { label: t('reports.totalRevenue'),  value: formatCurrency(totalRevenue), icon: BarChart3,  color: 'text-primary'   },
                    { label: t('reports.uniqueClients'), value: String(new Set(completedApts.map(a => a.clientId)).size), icon: Users, color: 'text-amber-400' },
                  ] : [
                    { label: 'Os meus ganhos',           value: formatCurrency(totalRevenue), icon: BarChart3,  color: 'text-primary'   },
                    { label: 'Clientes atendidos',        value: String(new Set(completedApts.map(a => a.clientId)).size), icon: Users, color: 'text-amber-400' },
                  ]),
                ].map(m => (
                  <Card key={m.label}>
                    <CardContent className="p-4">
                      <div className={cn('w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3', m.color)}>
                        <m.icon className="w-4 h-4" />
                      </div>
                      <p className="font-display font-bold text-xl text-foreground leading-none">{m.value}</p>
                      <p className="text-xs text-muted-foreground font-body mt-1">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className={cn('grid gap-4', showLocationChart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-lg')}>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{t('reports.statusBreakdown')}</CardTitle></CardHeader>
                  <CardContent>
                    {apts.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-body text-center py-6">{noDataMsg}</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {statusBreakdown.filter(d => d.count > 0).map(d => (
                          <div key={d.status}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-body text-muted-foreground">{STATUS_LABELS[d.status]}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-body text-muted-foreground">{formatPercent(d.count / apts.length)}</span>
                                <span className="text-xs font-display font-semibold text-foreground tabular-nums w-5 text-right">{d.count}</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={cn('h-full rounded-full', STATUS_COLORS[d.status])} style={{ width: `${(d.count / apts.length) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {showLocationChart && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />{t('reports.revenueByLoc')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(locationRevMap).length === 0 ? (
                        <p className="text-sm text-muted-foreground font-body text-center py-6">{t('reports.noRevenue')}</p>
                      ) : (
                        <div className="space-y-2.5">
                          {Object.entries(locationRevMap).sort(([, a], [, b]) => b - a).map(([locId, rev]) => {
                            const loc = locations.find(l => l.id === locId)
                            const pct = totalRevenue ? rev / totalRevenue : 0
                            return (
                              <div key={locId}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-body text-foreground">{loc?.name ?? locId}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">{formatPercent(pct)}</Badge>
                                    <span className="text-xs font-display font-semibold text-foreground tabular-nums">{formatCurrency(rev)}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct * 100}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {tab === 'employees' && (
            <Card><CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {[t('employees.title'), t('reports.appointments'), t('reports.revenue'), t('reports.avgTicket'), t('reports.rating')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {empStats.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground font-body">{noDataMsg}</td></tr>
                  ) : empStats.map(({ emp, count, revenue, avgRating }, i) => (
                    <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/40 w-4">#{i+1}</span>
                          <span className="font-body font-medium text-foreground">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-foreground tabular-nums">{count}</td>
                      <td className="px-4 py-3 font-display font-semibold text-foreground tabular-nums">{formatCurrency(revenue)}</td>
                      <td className="px-4 py-3 font-body text-muted-foreground tabular-nums">{count ? formatCurrency(revenue / count) : '—'}</td>
                      <td className="px-4 py-3">
                        {avgRating > 0
                          ? <span className="flex items-center gap-1 text-amber-400 font-body text-xs"><Star className="w-3 h-3 fill-amber-400" />{avgRating.toFixed(1)}</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}

          {tab === 'clients' && (() => {
            // Sort
            const sorted = [...clientStats].sort((a, b) => {
              const dir = clientSort.dir === 'asc' ? 1 : -1
              switch (clientSort.col) {
                case 'name':      return dir * a.client.name.localeCompare(b.client.name)
                case 'count':     return dir * (a.count - b.count)
                case 'revenue':   return dir * (a.revenue - b.revenue)
                case 'avgTicket': return dir * ((a.revenue / a.count) - (b.revenue / b.count))
                default:          return 0
              }
            })
            const totalClientPages = Math.ceil(sorted.length / CLIENT_PAGE_SIZE)
            const paginated = sorted.slice((clientPage - 1) * CLIENT_PAGE_SIZE, clientPage * CLIENT_PAGE_SIZE)

            const SortIcon = ({ col }: { col: typeof clientSort.col }) => {
              if (clientSort.col !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
              return clientSort.dir === 'asc'
                ? <ChevronUp   className="w-3 h-3 text-primary" />
                : <ChevronDown className="w-3 h-3 text-primary" />
            }
            const toggleSort = (col: typeof clientSort.col) => {
              setClientPage(1)
              setClientSort(s => s.col === col
                ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                : { col, dir: col === 'name' ? 'asc' : 'desc' }
              )
            }

            return (
              <Card><CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {([
                      { key: 'name'      as const, label: t('clients.title')         },
                      { key: 'count'     as const, label: t('reports.visits')         },
                      { key: 'revenue'   as const, label: t('reports.totalRevenue')   },
                      { key: 'avgTicket' as const, label: t('reports.avgTicket')      },
                    ]).map(col => (
                      <th key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="text-left px-4 py-3 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          {col.label}
                          <SortIcon col={col.key} />
                        </div>
                      </th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground font-body">{noDataMsg}</td></tr>
                    ) : paginated.map(({ client, count, revenue }, i) => {
                      const globalRank = (clientPage - 1) * CLIENT_PAGE_SIZE + i + 1
                      return (
                        <tr key={client.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-muted-foreground/40 w-5 text-right">#{globalRank}</span>
                              <div>
                                <p className="font-body font-medium text-foreground">{client.name}</p>
                                <p className="text-[10px] text-muted-foreground font-body">{client.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-body text-foreground tabular-nums">{count}</td>
                          <td className="px-4 py-3 font-display font-semibold text-foreground tabular-nums">{formatCurrency(revenue)}</td>
                          <td className="px-4 py-3 font-body text-muted-foreground tabular-nums">{formatCurrency(revenue / count)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination footer */}
                {totalClientPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <span className="text-xs text-muted-foreground font-body">
                      {((clientPage - 1) * CLIENT_PAGE_SIZE) + 1}–{Math.min(clientPage * CLIENT_PAGE_SIZE, sorted.length)} de {sorted.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setClientPage(p => Math.max(1, p - 1))}
                        disabled={clientPage <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalClientPages) }, (_, idx) => {
                        const start = Math.max(1, Math.min(clientPage - 2, totalClientPages - 4))
                        const p = start + idx
                        return (
                          <button key={p} onClick={() => setClientPage(p)}
                            className={cn('w-7 h-7 rounded-lg text-xs font-body font-medium transition-all',
                              p === clientPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                          >{p}</button>
                        )
                      })}
                      <button
                        onClick={() => setClientPage(p => Math.min(totalClientPages, p + 1))}
                        disabled={clientPage >= totalClientPages}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent></Card>
            )
          })()}

          {tab === 'services' && (
            <Card><CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {[t('nav.services'), t('reports.executions'), t('reports.totalRevenue'), t('reports.share')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {serviceStats.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground font-body">{noDataMsg}</td></tr>
                  ) : serviceStats.map(({ svc, count, revenue }) => (
                    <tr key={svc.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: svc.color }} />
                          <span className="font-body font-medium text-foreground">{svc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-foreground tabular-nums">{count}</td>
                      <td className="px-4 py-3 font-display font-semibold text-foreground tabular-nums">{formatCurrency(revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                            <div className="h-full rounded-full bg-primary/60"
                              style={{ width: `${completedApts.length ? (count / completedApts.length) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs font-body text-muted-foreground tabular-nums">
                            {completedApts.length ? formatPercent(count / completedApts.length) : '0%'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}
