import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp, TrendingDown, Euro, CalendarDays,
  Users, Clock, BarChart3, ArrowUpRight,
} from 'lucide-react'
import {
  useAnalyticsSummary, useRevenueTrend, useLocations, useAllLocations,
  useAppointments, useServices, useAllServices, useEmployees,
} from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from '@/components/ui'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { RevenueDataPoint } from '@/models'

function BarChart({ data }: { data: RevenueDataPoint[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d, i) => {
        const pct = (d.revenue / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-popover border border-border rounded-lg px-2 py-1 text-[10px] font-body text-foreground whitespace-nowrap shadow-lg">
                  <p className="font-semibold">{formatCurrency(d.revenue)}</p>
                  <p className="text-muted-foreground">{d.appointments} marc.</p>
                </div>
              </div>
              <div className="w-full rounded-t-md bg-primary/60 hover:bg-primary transition-colors"
                style={{ height: `${Math.max(pct, 4)}%` }} />
            </div>
            <span className="text-[9px] font-body text-muted-foreground truncate w-full text-center">{d.date}</span>
          </div>
        )
      })}
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

  // ── Role flags ──────────────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === 'super_admin'
  const isPartner    = user?.role === 'partner'
  // employee never reaches this page (no nav item)

  const locationId = activeLocation?.id ?? user?.locationId ?? undefined

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: ownLocations = [] } = useLocations()
  const { data: allLocations = [] } = useAllLocations()
  const locations = isSuperAdmin ? allLocations : ownLocations

  const { data: ownServices = [] } = useServices()
  const { data: allServices = [] } = useAllServices()
  const services = isSuperAdmin ? allServices : ownServices

  // Partner: scope appointments to own employee record
  const { data: employees = [] } = useEmployees(locationId)
  const myEmployee   = isPartner ? employees.find(e => e.userId === user?.id) : undefined
  const myEmpId      = myEmployee?.id
  const commissionPct = myEmployee?.commissionPercent ?? 100   // 100% = full price (manager/super_admin)

  const showLocationChart = isSuperAdmin && locations.length > 1

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')

  const { isLoading: loadingSummary } = useAnalyticsSummary(locationId)
  const { data: trend = [], isLoading: loadingTrend } = useRevenueTrend(locationId)
  const { data: apts  = [] } = useAppointments({ locationId, employeeId: myEmpId })
  // For self-scoped roles, apply commission to get personal earnings
  const applyCommission = (price: number) => isPartner ? price * (commissionPct / 100) : price

  // ── Derived metrics ─────────────────────────────────────────────────────────
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
    { key: 'day'   as const, label: t('common.today')   },
    { key: 'week'  as const, label: t('common.week')    },
    { key: 'month' as const, label: t('common.month')   },
    { key: 'year'  as const, label: t('financial.year') },
  ]

  const subtitle = isPartner
    ? `Os meus ganhos (comissão ${commissionPct}%)`
    : isSuperAdmin && !locationId
    ? t('financial.globalView')
    : locations.find(l => l.id === locationId)?.name

  return (
    <div>
      <PageHeader title={t('nav.financial')} subtitle={subtitle} />

      {/* Period selector + date range label */}
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
        {/* Date range label */}
        {(() => {
          const now = new Date()
          let label = ''
          if (period === 'day') {
            label = format(now, "d 'de' MMMM 'de' yyyy", { locale: pt })
          } else if (period === 'week') {
            const s = startOfWeek(now, { weekStartsOn: 1 })
            const e = endOfWeek(now,   { weekStartsOn: 1 })
            label = `${format(s, "d MMM", { locale: pt })} – ${format(e, "d MMM yyyy", { locale: pt })}`
          } else if (period === 'month') {
            label = format(now, "MMMM 'de' yyyy", { locale: pt })
          } else if (period === 'year') {
            label = format(now, 'yyyy')
          }
          return (
            <span className="text-sm font-body text-muted-foreground capitalize">
              {label}
            </span>
          )
        })()}
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
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('financial.last7days')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTrend ? <Spinner /> : <BarChart data={trend} />}
              </CardContent>
            </Card>

            <Card>
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
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', row.color)}
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
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
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
                    <Clock className="w-4 h-4 text-muted-foreground" />
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
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
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
