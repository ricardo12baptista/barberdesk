import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { TrendingUp, CalendarCheck2, Users, AlertTriangle, Scissors, Star, ChevronsUpDown } from 'lucide-react'
import { useAnalyticsSummary, useRevenueTrend, useAppointments, useClientsFlat, useServices, useEmployees, useLocations } from '@/hooks'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  Card, CardContent, CardHeader, CardTitle,
  MetricCard, PageHeader, Avatar, Spinner
} from '@/components/ui'
import { formatCurrency, formatTime, formatPercent, cn } from '@/lib/utils'
import { format } from 'date-fns'

// ─── 3 visible statuses ───────────────────────────────────────────────────────
function toVisibleStatus(status: string) {
  const s = status?.toLowerCase?.() ?? ''
  if (s === 'completed')                       return 'completed' as const
  if (s === 'no_show' || s === 'cancelled') return 'no_show'  as const
  return 'confirmed' as const
}
const DASH_STATUS: Record<'confirmed' | 'completed' | 'no_show', { label: string; style: string }> = {
  confirmed: { label: 'Confirmado',     style: 'bg-blue-500/15  text-blue-400  border border-blue-500/30'  },
  completed: { label: 'Concluído',      style: 'bg-green-500/15 text-green-500 border border-green-500/30' },
  no_show:   { label: 'Não Compareceu', style: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' },
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { activeLocation } = useUIStore()
  const { data: locations = [] } = useLocations()

  // ── In-page location filter (super_admin only) ────────────────────────────────
  const [dashLocationId, setDashLocationId] = useState<string | undefined>(undefined)
  const effectiveLocationId = dashLocationId ?? activeLocation?.id ?? (user?.locationId ?? undefined)

  // ── Role flags ──────────────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === 'super_admin'
  const isPartner    = user?.role === 'partner'
  const isEmployee   = user?.role === 'employee'
  const isOwnOnly    = isPartner || isEmployee

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: clients   = [] } = useClientsFlat()
  const { data: services  = [] } = useServices()
  const { data: employees = [] } = useEmployees(effectiveLocationId)

  const clientMap  = useMemo(() => Object.fromEntries(clients.map(c  => [c.id, c])),  [clients])
  const serviceMap = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])),  [services])
  const empMap     = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees])

  const myEmployeeId = isOwnOnly
    ? employees.find(e => e.userId === user?.id)?.id
    : undefined

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(effectiveLocationId)
  const trendResponse = useRevenueTrend(effectiveLocationId)
  const trend = (trendResponse.data as any)?.data ?? []
  const { isLoading: trendLoading } = trendResponse
  const safeTrend = Array.isArray(trend) ? trend : []
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: todayApts, isLoading: aptsLoading } = useAppointments({
    startsAt: today, endsAt: today, locationId: effectiveLocationId, employeeId: myEmployeeId,
  })
  const safeTodayApts = Array.isArray(todayApts) ? todayApts : []

  // ── Subtitle with location filter (super_admin only) ──────────────────────────
  const subtitleEl = (
    <div className="flex items-center gap-2">
      {isSuperAdmin && locations.length > 1 ? (
        <div className="relative inline-flex">
          <select
            value={dashLocationId ?? 'all'}
            onChange={e => setDashLocationId(e.target.value === 'all' ? undefined : e.target.value)}
            className={cn(
              'h-6 rounded text-xs font-body appearance-none cursor-pointer pl-1 pr-5',
              'bg-transparent border-0 text-muted-foreground hover:text-foreground',
              'focus:outline-none focus:ring-0',
            )}
          >
            <option value="all">Visão Global — Todas as Lojas</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <ChevronsUpDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      ) : effectiveLocationId ? (
        <span className="text-muted-foreground">{locations.find(l => l.id === effectiveLocationId)?.name ?? ''}</span>
      ) : isSuperAdmin ? (
        <span className="text-muted-foreground">Visão Global — Todas as Lojas</span>
      ) : isPartner ? (
        <span className="text-muted-foreground">Os meus serviços</span>
      ) : null}
    </div>
  )

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={subtitleEl} />

      {summaryLoading ? <Spinner /> : (
        <>
          <div className={`grid gap-4 mb-6 ${isOwnOnly ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {!isOwnOnly && (
              <MetricCard
                title={t('dashboard.todayRevenue')}
                value={formatCurrency(summary?.revenue ?? 0)}
                icon={TrendingUp}
              />
            )}
            <MetricCard
              title={t('dashboard.todayAppointments')}
              value={summary?.appointments ?? 0}
              subtitle={isOwnOnly ? 'as tuas hoje' : `Ticket médio ${formatCurrency(summary?.averageTicket ?? 0)}`}
              icon={CalendarCheck2}
            />
            {!isOwnOnly && (
              <MetricCard
                title={t('dashboard.occupancyRate')}
                value={formatPercent(summary?.occupancyRate ?? 0)}
                icon={Users}
              />
            )}
            <MetricCard
              title={t('dashboard.noShowRate')}
              value={formatPercent(summary?.noShowRate ?? 0)}
              icon={AlertTriangle}
              iconColor="text-amber-500"
            />
          </div>

          {!isEmployee && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card className="lg:col-span-2 min-w-0 overflow-hidden">
                <CardHeader>
                  <CardTitle>{t('dashboard.revenueThisWeek')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendLoading ? <Spinner /> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={safeTrend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="hsl(25,90%,52%)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(25,90%,52%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans',
                          }}
                          formatter={(v: number) => [formatCurrency(v), 'Receita']}
                        />
                        <Area type="monotone" dataKey="revenue"
                          stroke="hsl(25,90%,52%)" strokeWidth={2} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Destaques</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-body">{t('dashboard.topEmployee')}</p>
                      <p className="text-sm font-semibold font-display text-foreground">{summary?.topEmployee}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-body">{t('dashboard.topService')}</p>
                      <p className="text-sm font-semibold font-display text-foreground">{summary?.topService}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground font-body mb-2">Marcações por dia</p>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={safeTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Bar dataKey="appointments" fill="hsl(25,90%,52%)" radius={[3, 3, 0, 0]} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {isOwnOnly ? 'As Minhas Próximas Marcações' : t('dashboard.upcomingAppointments')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aptsLoading ? <Spinner /> : safeTodayApts.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body py-4 text-center">
                  Sem marcações para hoje.
                </p>
              ) : (
                <div className="space-y-2">
                  {safeTodayApts.slice(0, 5).map((apt) => {
                    const client  = clientMap[apt.clientId]
                    const service = serviceMap[apt.serviceId]
                    const emp     = empMap[apt.employeeId]
                    const vs      = toVisibleStatus(apt.status)
                    const sc      = DASH_STATUS[vs]
                    return (
                      <div key={apt.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar name={client?.name ?? apt.clientId} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-body text-foreground truncate">
                            {client?.name ?? apt.clientId}
                          </p>
                          <p className="text-xs text-muted-foreground font-body">
                            {service?.name ?? apt.serviceId}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-mono text-foreground">{formatTime(apt.startsAt)}</p>
                          <p className="text-xs text-muted-foreground font-body">
                            {emp?.name ?? apt.employeeId}
                          </p>
                        </div>
                        <span className={`text-[11px] font-body font-medium px-2 py-0.5 rounded-full ${sc.style}`}>
                          {sc.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}