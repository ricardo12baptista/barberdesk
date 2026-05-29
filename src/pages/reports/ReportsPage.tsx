import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, Users, Calendar as CalendarIcon, Scissors, Star, Building2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, format } from 'date-fns'
import { pt as ptLocale, enUS } from 'date-fns/locale'
import { useReportsData, useLocations, useAllLocations } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from '@/components/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
      start: customFrom ? new Date(customFrom + 'T00:00:00') : startOfMonth(now),
      end:   customTo   ? new Date(customTo   + 'T23:59:59')   : endOfMonth(now),
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
  const isSuperAdmin       = user?.role === 'super_admin'
  const isPartner          = user?.role === 'partner'
  const isEmployee         = user?.role === 'employee'
  const isOwnOnly          = isPartner || isEmployee
  const isSelfScoped       = isOwnOnly
  const dateLocale         = i18n.language === 'pt' ? ptLocale : enUS

  const [reportLocationId, setReportLocationId] = useState<string | undefined>(undefined)
  const queryLocationId = isSuperAdmin ? (reportLocationId ?? undefined) : (user?.locationId ?? undefined)

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
  const TABS = isSelfScoped
    ? ALL_TABS.filter(t => t.key !== 'employees')
    : ALL_TABS

  // ── State for the DateRangePicker ──────────────────────────────────────────
  const [rangeDate, setRangeDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: undefined,
  })

  const interval = useMemo(() => {
    if (rangeKey !== 'custom') return getRangeInterval(rangeKey, customFrom, customTo)
    return {
      start: rangeDate.from ?? startOfMonth(new Date()),
      end: rangeDate.to ?? endOfMonth(new Date()),
    }
  }, [rangeKey, customFrom, customTo, rangeDate])

  // Sync customFrom/customTo with rangeDate
  useMemo(() => {
    if (rangeKey === 'custom') {
      if (rangeDate.from) setCustomFrom(format(rangeDate.from, 'yyyy-MM-dd'))
      if (rangeDate.to) setCustomTo(format(rangeDate.to, 'yyyy-MM-dd'))
    }
  }, [rangeKey, rangeDate])

  // ✅ Use dedicated reports endpoint
  const dateKeyFrom = format(interval.start, 'yyyy-MM-dd')
  const dateKeyTo   = format(interval.end,   'yyyy-MM-dd')
  const { data: reports, isLoading } = useReportsData({
    startsAt: dateKeyFrom,
    endsAt:   dateKeyTo,
    locationId: queryLocationId,
  })

  const totalApts      = reports?.total ?? 0
  const totalRevenue   = reports?.totalRevenue ?? 0
  const completedCount = reports?.completedCount ?? 0
  const statusBreakdown = reports?.statusBreakdown ?? []
  const empStats       = reports?.employeeStats ?? []
  const clientStats    = reports?.clientStats ?? []
  const serviceStats   = reports?.serviceStats ?? []
  const locationRevMap = reports?.locationRevenue ?? {}

  const rangeLabel = useMemo(() => {
    const { start, end } = interval
    return `${format(start, 'd MMM', { locale: dateLocale })} – ${format(end, 'd MMM yyyy', { locale: dateLocale })}`
  }, [interval, dateLocale])

  const noDataMsg = t('reports.noDataPeriod')

  // Format date for display in the trigger button
  const dateDisplay = rangeDate.from
    ? rangeDate.to
      ? `${format(rangeDate.from, 'dd/MM/yyyy')} - ${format(rangeDate.to, 'dd/MM/yyyy')}`
      : format(rangeDate.from, 'dd/MM/yyyy')
    : ''

  const handleCustomRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setRangeDate(range)
    if (range.from) setCustomFrom(format(range.from, 'yyyy-MM-dd'))
    if (range.to) setCustomTo(format(range.to, 'yyyy-MM-dd'))
  }

  const handleCustomClick = () => {
    setRangeKey('custom')
    setClientPage(1)
    // Initialize with current month if empty
    if (!customFrom && !customTo) {
      const now = new Date()
      setRangeDate({ from: startOfMonth(now), to: undefined })
      setCustomFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('nav.reports')}
        subtitle={`${totalApts} ${t('reports.appointments').toLowerCase()} · ${formatCurrency(totalRevenue)} · ${rangeLabel}`}
      />

      {/* ── Location filter (super_admin only) defaults to "Todas as Lojas" ── */}
      {isSuperAdmin && locations.length > 1 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <select
              value={reportLocationId ?? 'all'}
              onChange={e => { setReportLocationId(e.target.value === 'all' ? undefined : e.target.value); setClientPage(1) }}
              className={cn(
                'h-8 rounded-lg pl-2.5 pr-7 text-xs font-body appearance-none cursor-pointer',
                'bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary',
              )}
            >
              <option value="all">Todas as Lojas</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {RANGES.map(r => (
            <button key={r.key} onClick={r.key === 'custom' ? handleCustomClick : () => { setRangeKey(r.key); setClientPage(1) }}
              className={cn('h-7 px-3 rounded-md text-xs font-body font-medium transition-all',
                rangeKey === r.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >{r.label}</button>
          ))}
        </div>
        {rangeKey === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'h-8 w-[260px] rounded-lg border border-input bg-transparent px-3 py-1 text-xs font-body text-left',
                  'text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                  'flex items-center gap-2',
                  !rangeDate.from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">
                  {dateDisplay || 'Selecionar datas'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={rangeDate}
                onSelect={handleCustomRangeSelect as any}
                numberOfMonths={2}
                locale={i18n.language === 'pt' ? ptLocale : enUS}
                startMonth={new Date(2020, 0, 1)}
                endMonth={new Date(2030, 11, 31)}
              />
            </PopoverContent>
          </Popover>
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
              <div className={`grid gap-3 ${isSelfScoped ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {[
                  { label: t('reports.totalApts'),     value: String(totalApts),          icon: CalendarIcon,   color: 'text-blue-400'  },
                  { label: t('reports.completed'),      value: String(completedCount),      icon: TrendingUp, color: 'text-green-400' },
                  ...(!isSelfScoped ? [
                    { label: t('reports.totalRevenue'),  value: formatCurrency(totalRevenue), icon: BarChart3,  color: 'text-primary'   },
                    { label: t('reports.uniqueClients'), value: String(new Set(clientStats.map(c => c.client.id)).size), icon: Users, color: 'text-amber-400' },
                  ] : [
                    { label: 'Os meus ganhos',           value: formatCurrency(totalRevenue), icon: BarChart3,  color: 'text-primary'   },
                    { label: 'Clientes atendidos',        value: String(new Set(clientStats.map(c => c.client.id)).size), icon: Users, color: 'text-amber-400' },
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
                    {totalApts === 0 ? (
                      <p className="text-sm text-muted-foreground font-body text-center py-6">{noDataMsg}</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {statusBreakdown.filter(d => d.count > 0).map(d => (
                          <div key={d.status}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-body text-muted-foreground">{STATUS_LABELS[d.status as AppointmentStatus] ?? d.status}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-body text-muted-foreground">{formatPercent(d.count / totalApts)}</span>
                                <span className="text-xs font-display font-semibold text-foreground tabular-nums w-5 text-right">{d.count}</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={cn('h-full rounded-full', STATUS_COLORS[d.status as AppointmentStatus] ?? 'bg-slate-500')} style={{ width: `${(d.count / totalApts) * 100}%` }} />
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
                          {Object.entries(locationRevMap).sort(([, a], [, b]) => b.revenue - a.revenue).map(([locId, loc]) => (
                            <div key={locId}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-body text-foreground">{loc.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">{formatPercent(loc.revenue / (totalRevenue || 1))}</Badge>
                                  <span className="text-xs font-display font-semibold text-foreground tabular-nums">{formatCurrency(loc.revenue)}</span>
                                </div>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary/60" style={{ width: `${(loc.revenue / (totalRevenue || 1)) * 100}%` }} />
                              </div>
                            </div>
                          ))}
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
                  ) : empStats.map((emp, i) => (
                    <tr key={emp.employee.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/40 w-4">#{i+1}</span>
                          <span className="font-body font-medium text-foreground">{emp.employee.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-foreground tabular-nums">{emp.count}</td>
                      <td className="px-4 py-3 font-display font-semibold text-foreground tabular-nums">{formatCurrency(emp.revenue)}</td>
                      <td className="px-4 py-3 font-body text-muted-foreground tabular-nums">{emp.count ? formatCurrency(emp.revenue / emp.count) : '—'}</td>
                      <td className="px-4 py-3">
                        {emp.avgRating > 0
                          ? <span className="flex items-center gap-1 text-amber-400 font-body text-xs"><Star className="w-3 h-3 fill-amber-400" />{emp.avgRating.toFixed(1)}</span>
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
            const sorted = [...clientStats].sort((a, b) => {
              const dir = clientSort.dir === 'asc' ? 1 : -1
              switch (clientSort.col) {
                case 'name':      return dir * (a.client.name || '').localeCompare(b.client.name || '')
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
                    ) : paginated.map((cli, i) => {
                      const globalRank = (clientPage - 1) * CLIENT_PAGE_SIZE + i + 1
                      return (
                        <tr key={cli.client.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-muted-foreground/40 w-5 text-right">#{globalRank}</span>
                              <div>
                                <p className="font-body font-medium text-foreground">{cli.client.name}</p>
                                <p className="text-[10px] text-muted-foreground font-body">{cli.client.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-body text-foreground tabular-nums">{cli.count}</td>
                          <td className="px-4 py-3 font-display font-semibold text-foreground tabular-nums">{formatCurrency(cli.revenue)}</td>
                          <td className="px-4 py-3 font-body text-muted-foreground tabular-nums">{formatCurrency(cli.revenue / cli.count)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

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
                  ) : serviceStats.map(svc => (
                    <tr key={svc.service.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: svc.service.color }} />
                          <span className="font-body font-medium text-foreground">{svc.service.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-foreground tabular-nums">{svc.count}</td>
                      <td className="px-4 py-3 font-display font-semibold text-foreground tabular-nums">{formatCurrency(svc.revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                            <div className="h-full rounded-full bg-primary/60"
                              style={{ width: `${completedCount ? (svc.count / completedCount) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs font-body text-muted-foreground tabular-nums">
                            {completedCount ? formatPercent(svc.count / completedCount) : '0%'}
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