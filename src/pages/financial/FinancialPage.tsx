import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp, TrendingDown, Euro, CalendarDays,
  Users, BarChart3, ArrowUpRight, Building2, ChevronsUpDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  useAnalyticsSummary, useRevenueTrend, useLocations, useAllLocations,
  useAppointments, useServices, useAllServices, useEmployees,
} from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from '@/components/ui'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import { format, startOfWeek, endOfWeek, subMonths, addMonths, subYears, addYears } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { RevenueDataPoint } from '@/models'

const DAY_NAMES_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function getDayLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const dayNum = d.getDate()
    const dayName = DAY_NAMES_PT[d.getDay()]
    return `${dayNum} - ${dayName}`
  } catch {
    return dateStr
  }
}

function getBarColor(dayIndex: number, total: number) {
  // Solid orange shades from bright to muted
  const colors = [
    'bg-orange-500',
    'bg-orange-500',
    'bg-orange-500',
    'bg-orange-500/90',
    'bg-orange-500/85',
    'bg-orange-500/80',
    'bg-orange-500/75',
    'bg-orange-500/75',
    'bg-orange-500/70',
    'bg-orange-500/70',
    'bg-orange-500/65',
    'bg-orange-500/65',
    'bg-orange-500/60',
    'bg-orange-500/60',
    'bg-orange-500/55',
  ]
  return colors[dayIndex % colors.length] || 'bg-orange-500/50'
}

const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function BarChart({ data, mode, period, onHover, onTouch }: {
  data: RevenueDataPoint[]
  mode: 'daily' | 'weekly' | 'monthly'
  period: string
  onHover?: (d: RevenueDataPoint | null) => void
  onTouch?: (d: RevenueDataPoint, e: React.TouchEvent) => void
}) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  const hasData = data.length > 0 && data.some(d => d.revenue > 0)

  return (
    <div className="relative">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ paddingBottom: mode === 'monthly' ? 0 : 42 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="border-t border-border/15 w-full" />
        ))}
      </div>

      <div className={cn(
        'flex items-end w-full overflow-x-hidden relative z-10 pt-2',
        mode === 'monthly' ? 'gap-1 h-48' : 'gap-1.5 h-44'
      )}>
        {!hasData ? (
          <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground font-body">
            Sem dados para o período
          </div>
        ) : data.map((d, i) => {
          const pct = (d.revenue / max) * 100

          let displayLabel: string
          let valueLabel = ''

          if (mode === 'monthly') {
            displayLabel = d.label || MONTH_NAMES_PT[parseInt(d.date.split('-')[1]) - 1] || d.date
          } else if (mode === 'weekly') {
            displayLabel = d.label || `Sem ${i + 1}`
          } else if (period === 'day') {
            try {
              const parsed = new Date(d.date + 'T00:00:00')
              const dayName = DAY_NAMES_PT[parsed.getDay()]
              const dayNum = String(parsed.getDate()).padStart(2, '0')
              const monthNum = String(parsed.getMonth() + 1).padStart(2, '0')
              displayLabel = `${dayName}, ${dayNum}/${monthNum}`
            } catch {
              displayLabel = d.date
            }
          } else {
            displayLabel = getDayLabel(d.date)
          }

          if (d.revenue > 0 && mode !== 'daily') {
            valueLabel = formatCurrency(d.revenue).replace('€', '').trim()
          }

          return (
            <div
              key={i}
              className={cn(
                'flex flex-col items-center group min-w-0',
                mode === 'monthly' ? 'flex-1 gap-2' : 'flex-1 gap-1'
              )}
              onMouseEnter={() => onHover?.(d)}
              onMouseLeave={() => onHover?.(null)}
              onTouchStart={(e) => { onTouch?.(d, e); onHover?.(d); }}
            >
              {/* Bar area */}
              <div className="relative w-full flex items-end justify-center"
                style={{ height: mode === 'monthly' ? '160px' : '120px' }}>
                {/* Bar wrapper — ensures rounded corners and overflow clip */}
                <div className="w-full mx-0.5 rounded-t-sm relative overflow-hidden"
                  style={{
                    height: d.revenue > 0 ? `${Math.max(pct, mode === 'monthly' ? 5 : 4)}%` : '6px',
                    transition: 'height 0.4s ease-out',
                  }}
                >
                  {/* Bar fill */}
                  <div
                    className={cn(
                      'w-full h-full transition-all duration-200 rounded-t-sm',
                      d.revenue > 0
                        ? 'group-hover:brightness-125 group-hover:shadow-lg group-hover:shadow-orange-500/20'
                        : 'opacity-10',
                      d.revenue > 0 ? getBarColor(i, data.length) : 'bg-orange-500'
                    )}
                  />
                  {/* Shine overlay - only when has revenue */}
                  {d.revenue > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </div>
              </div>

              {/* Label — two lines for daily views (Hoje + Mês) */}
              {mode === 'daily' ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-display font-semibold text-muted-foreground/80 leading-none">
                    {(d.date.split('-')[2] || '').replace(/^0/, '') || d.date}
                  </span>
                  <span className={cn(
                    'font-body text-muted-foreground/40 text-center leading-none truncate max-w-full text-[9px]',
                  )}>
                    {(() => {
                      try {
                        const parsed = new Date(d.date + 'T00:00:00')
                        return DAY_NAMES_PT[parsed.getDay()]
                      } catch { return '' }
                    })()}
                  </span>
                </div>
              ) : mode === 'weekly' ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-display font-semibold text-muted-foreground/80 leading-none">
                    {displayLabel.split(' ')[0] || displayLabel}
                  </span>
                  <span className="font-body text-muted-foreground/40 text-center leading-none truncate max-w-full text-[9px]">
                    {displayLabel.split(' ').slice(1).join(' ') || ''}
                  </span>
                </div>
              ) : (
                <span className={cn(
                  'font-body text-muted-foreground/60 text-center leading-none truncate max-w-full',
                  mode === 'monthly' ? 'text-xs font-medium' : 'text-[10px]'
                )}>
                  {displayLabel}
                </span>
              )}

              {valueLabel && mode !== 'monthly' && mode !== 'weekly' && (
                <span className="text-[9px] font-mono font-medium text-muted-foreground/40 tabular-nums leading-none truncate max-w-full">
                  {valueLabel}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ label, value, sub, icon: Icon, trend, color = 'text-primary' }: {
  label: string; value: string; sub?: string; icon: React.ElementType; trend?: number; color?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10', color)}>
            <Icon className="w-4 h-4" />
          </div>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-0.5 text-xs font-body font-medium',
              trend >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="font-display font-bold text-2xl text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground font-body mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60 font-body mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function FinancialPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { activeLocation } = useUIStore()

  const isSuperAdmin = user?.role === 'super_admin'
  const isPartner    = user?.role === 'partner'

  const [finLocationId, setFinLocationId] = useState<string | undefined>(undefined)
  const effectiveLocationId = finLocationId ?? activeLocation?.id ?? user?.locationId ?? undefined

  const { data: ownLocations = [] } = useLocations()
  const { data: allLocations = [] } = useAllLocations()
  const locations = isSuperAdmin ? allLocations : ownLocations

  const { data: ownServices = [] } = useServices()
  const { data: allServices = [] } = useAllServices()
  const services = isSuperAdmin ? allServices : ownServices

  const { data: employees = [] } = useEmployees(effectiveLocationId)
  const myEmployee   = isPartner ? employees.find(e => e.userId === user?.id) : undefined
  const myEmpId      = myEmployee?.id
  const commissionPct = myEmployee?.commissionPercent ?? 100

  const showLocationChart = isSuperAdmin && locations.length > 1

  // ── Period & Navigation ────────────────────────────────────────────────────
  const [period, setPeriod_] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [navDate, setNavDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const setPeriod = (p: 'day' | 'week' | 'month' | 'year') => {
    setPeriod_(p)
    setNavDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const canNavRight = (() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (period === 'month') {
      return navDate.substring(0, 7) < today.substring(0, 7)
    }
    if (period === 'year') {
      return navDate.substring(0, 4) < today.substring(0, 4)
    }
    return false
  })()

  const navigateLeft = () => {
    const d = new Date(navDate + 'T12:00:00')
    if (period === 'month') {
      setNavDate(format(subMonths(d, 1), 'yyyy-MM-dd'))
    } else if (period === 'year') {
      setNavDate(format(subYears(d, 1), 'yyyy-MM-dd'))
    }
  }

  const navigateRight = () => {
    const d = new Date(navDate + 'T12:00:00')
    if (period === 'month') {
      setNavDate(format(addMonths(d, 1), 'yyyy-MM-dd'))
    } else if (period === 'year') {
      setNavDate(format(addYears(d, 1), 'yyyy-MM-dd'))
    }
  }

  const navLabel = (() => {
    const d = new Date(navDate + 'T12:00:00')
    if (period === 'month') {
      return format(d, "MMMM 'de' yyyy", { locale: pt }).replace(/^./, c => c.toUpperCase())
    }
    if (period === 'year') {
      return d.getFullYear().toString()
    }
    return ''
  })()

  const apiRefDate = (period === 'month' || period === 'year') ? navDate : undefined

  // ── Period-based header label ──────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    switch (period) {
      case 'day': {
        const dayName = DAY_NAMES_PT[today.getDay()]
        const dayNum = String(today.getDate()).padStart(2, '0')
        const monthNum = String(today.getMonth() + 1).padStart(2, '0')
        return `${dayName}, ${dayNum}/${monthNum}`
      }
      case 'week': {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
        return `${format(weekStart, 'd MMM yyyy', { locale: pt })} — ${format(weekEnd, 'd MMM yyyy', { locale: pt })}`
      }
      case 'month':
        return format(today, "MMMM 'de' yyyy", { locale: pt }).replace(/^./, c => c.toUpperCase())
      case 'year':
        return today.getFullYear().toString()
      default:
        return ''
    }
  }, [period])

  const { isLoading: loadingSummary } = useAnalyticsSummary(effectiveLocationId)
  const trendResponse = useRevenueTrend(effectiveLocationId, period, apiRefDate)
  const trendData = (trendResponse.data as any)?.data ?? []
  const trendMode = (trendResponse.data as any)?.mode ?? 'daily'
  const { isLoading: loadingTrend } = trendResponse
  const [hoveredData, setHoveredData] = useState<RevenueDataPoint | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const { data: apts  = [] } = useAppointments({ locationId: effectiveLocationId, employeeId: myEmpId })
  const applyCommission = (price: number) => isPartner ? price * (commissionPct / 100) : price

  const serviceNameMap   = Object.fromEntries(services.map(s => [s.id, s.name]))
  const completedApts    = apts.filter(a => a.status === 'completed')
  const totalRevenue     = completedApts.reduce((s, a) => s + applyCommission(a.price ?? 0), 0)
  const avgTicket        = completedApts.length ? totalRevenue / completedApts.length : 0
  const cancelledCount   = apts.filter(a => a.status === 'cancelled' || a.status === 'no_show').length
  const noShowRate       = apts.length ? cancelledCount / apts.length : 0

  const statusRevenue = {
    completed: completedApts.reduce((s, a) => s + applyCommission(a.price ?? 0), 0),
    pending:   apts.filter(a => a.status === 'pending').reduce((s, a) => s + applyCommission(a.price ?? 0), 0),
    confirmed: apts.filter(a => a.status === 'confirmed').reduce((s, a) => s + applyCommission(a.price ?? 0), 0),
  }
  const projectedRevenue = statusRevenue.completed + statusRevenue.pending + statusRevenue.confirmed

  const serviceRevMap = completedApts.reduce((acc, a) => {
    const name = serviceNameMap[a.serviceId] ?? a.serviceId
    acc[name] = (acc[name] ?? 0) + applyCommission(a.price ?? 0)
    return acc
  }, {} as Record<string, number>)
  const topServices = Object.entries(serviceRevMap).sort(([, a], [, b]) => b - a).slice(0, 5)

  const locationRevMap = completedApts.reduce((acc, a) => {
    acc[a.locationId] = (acc[a.locationId] ?? 0) + (a.price ?? 0)
    return acc
  }, {} as Record<string, number>)

  const PERIODS = [
    { key: 'day'   as const, label: 'Hoje'     },
    { key: 'week'  as const, label: 'Semana'    },
    { key: 'month' as const, label: 'Mês'       },
    { key: 'year'  as const, label: 'Ano'       },
  ]

  return (
    <div>
      <PageHeader title={t('nav.financial')} />

      {/* ── Location filter for super_admin ──────────────────────────────────── */}
      {isSuperAdmin && locations.length > 1 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <select
              value={finLocationId ?? 'all'}
              onChange={e => { setFinLocationId(e.target.value === 'all' ? undefined : e.target.value); setPeriod('month') }}
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

      {/* Period selector + navigation */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={cn('h-7 px-4 rounded-md text-xs font-body font-medium transition-all',
                period === p.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Navigation (month/year) */}
        {(period === 'month' || period === 'year') && (
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
            <button onClick={navigateLeft}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-display font-semibold text-foreground min-w-[100px] text-center select-none">
              {navLabel}
            </span>

            <button onClick={navigateRight}
              disabled={!canNavRight}
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center transition-all',
                canNavRight
                  ? 'text-muted-foreground hover:text-foreground hover:bg-background'
                  : 'text-muted-foreground/20 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Period label showing date/range */}
        <span className="text-xs font-body text-muted-foreground">
          {periodLabel}
        </span>
      </div>

      {loadingSummary ? <Spinner /> : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <Metric label={t('financial.totalRevenue')}  value={formatCurrency(totalRevenue)}  icon={Euro}         trend={12} color="text-green-400" />
            <Metric label={t('financial.avgTicket')}     value={formatCurrency(avgTicket)}     icon={ArrowUpRight} trend={5}  color="text-blue-400"  />
            <Metric label={t('financial.completedApts')} value={String(completedApts.length)}  icon={CalendarDays} sub={t('financial.ofTotal', { n: apts.length })} />
            <Metric label={t('financial.noShowRate')}    value={formatPercent(noShowRate)}     icon={Users}        trend={noShowRate > 0.1 ? -5 : 3} color="text-amber-400" />
          </div>

          {/* Chart + projection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card className="lg:col-span-2 min-w-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Receita</CardTitle>
                  {trendData.length > 0 && (
                    <span className="text-[11px] text-muted-foreground/40 font-body tabular-nums">
                      Total: {formatCurrency(trendData.reduce((s: number, d: RevenueDataPoint) => s + d.revenue, 0))}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative">
                {loadingTrend ? <Spinner /> : (
                  <div
                    onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => { setTooltipPos(null); setHoveredData(null) }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0]
                      if (touch) setTooltipPos({ x: touch.clientX, y: touch.clientY })
                    }}
                    onTouchEnd={() => {
                      // Dismiss on touchend with delay so user can see the value
                      setTimeout(() => { setTooltipPos(null); setHoveredData(null) }, 2000)
                    }}
                  >
                    <BarChart data={trendData} mode={trendMode} period={period} onHover={setHoveredData} />
                  </div>
                )}
                {/* Floating tooltip — position:fixed so NEVER clipped by any overflow */}
                {hoveredData && tooltipPos && (
                  <div
                    className="fixed pointer-events-none z-[9999]"
                    style={{
                      left: Math.min(tooltipPos.x + 12, window.innerWidth - 200),
                      top: Math.max(tooltipPos.y - 10, 20),
                      transform: 'translateY(-100%)',
                    }}
                  >
                    <div className="bg-popover border border-border/50 rounded-xl px-4 py-2 shadow-xl whitespace-nowrap backdrop-blur-sm">
                      <p className="text-sm font-display font-bold text-foreground">{formatCurrency(hoveredData.revenue)}</p>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                        {hoveredData.appointments} {hoveredData.appointments === 1 ? 'marcação' : 'marcações'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('financial.projectedRevenue')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: t('financial.completed'), value: statusRevenue.completed, color: 'bg-green-500' },
                  { label: t('financial.confirmed'), value: statusRevenue.confirmed, color: 'bg-blue-500'  },
                  { label: t('financial.pending'),   value: statusRevenue.pending,   color: 'bg-amber-500' },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-body text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-display font-semibold text-foreground">{formatCurrency(row.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className={cn('h-full rounded-full transition-all duration-500', row.color)}
                        style={{ width: `${projectedRevenue ? (row.value / projectedRevenue) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-body text-muted-foreground">{t('financial.totalProjected')}</span>
                  <span className="text-sm font-display font-bold text-foreground">{formatCurrency(projectedRevenue)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row */}
          <div className={cn('grid gap-4', showLocationChart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-lg')}>
            {/* Top services */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  {t('financial.topServices')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {topServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body text-center py-4">{t('common.noResults')}</p>
                ) : topServices.map(([svcName, rev], i) => {
                  const pct = (rev / (topServices[0]?.[1] ?? 1)) * 100
                  return (
                    <div key={svcName}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/50 w-4">#{i + 1}</span>
                          <span className="text-xs font-body text-foreground">{svcName}</span>
                        </div>
                        <span className="text-xs font-display font-semibold text-foreground">{formatCurrency(rev)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Revenue by location — super_admin with 2+ locations only */}
            {showLocationChart && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    {t('financial.revenueByLocation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {Object.entries(locationRevMap).length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body text-center py-4">{t('common.noResults')}</p>
                  ) : Object.entries(locationRevMap)
                    .sort(([, a], [, b]) => b - a)
                    .map(([locId, rev]) => {
                      const loc = locations.find(l => l.id === locId)
                      const pct = (rev / totalRevenue) * 100
                      return (
                        <div key={locId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-body text-foreground">{loc?.name ?? locId}</span>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">{formatPercent(pct / 100)}</Badge>
                              <span className="text-xs font-display font-semibold text-foreground">{formatCurrency(rev)}</span>
                            </div>
                          </div>
                          <div className="h-1 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}