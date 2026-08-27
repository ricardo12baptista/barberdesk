import { useState, useEffect } from 'react'
import { Crown, CheckCircle2, ArrowUpCircle, Clock, Save, Link2, Copy, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useEmployees, useLocations } from '@/hooks'
import { useUIStore } from '@/stores/ui.store'
import { PLANS } from '@/lib/plans'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/plans'
import type { WorkingHours } from '@/models'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS: { dow: 0|1|2|3|4|5|6; label: string }[] = [
  { dow: 1, label: 'Segunda-feira' },
  { dow: 2, label: 'Terça-feira'   },
  { dow: 3, label: 'Quarta-feira'  },
  { dow: 4, label: 'Quinta-feira'  },
  { dow: 5, label: 'Sexta-feira'   },
  { dow: 6, label: 'Sábado'        },
  { dow: 0, label: 'Domingo'       },
]

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const inputCls = 'h-8 rounded-lg border border-input bg-muted/30 px-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

// ─── My Schedule Section (employee / partner) ─────────────────────────────────
function MySchedule({ employeeId }: { employeeId: string }) {
  const [hours,   setHours]   = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [dirty,   setDirty]   = useState(false)

  useEffect(() => {
    if (!employeeId) return
    fetch(`/api/employees/${employeeId}/working-hours`)
      .then(r => r.json())
      .then(d => { setHours(d); setLoading(false) })
  }, [employeeId])

  const update = (dow: number, patch: Partial<WorkingHours>) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dow ? { ...h, ...patch } : h))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/employees/${employeeId}/working-hours`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hours),
    })
    setSaving(false)
    setDirty(false)
  }

  const getDay = (dow: number) => hours.find(h => h.dayOfWeek === dow)

  if (loading) return <Spinner />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-muted-foreground" /> O meu horário
        </CardTitle>
        {dirty && (
          <Button size="sm" onClick={save} loading={saving}>
            <Save className="w-3.5 h-3.5" /> Guardar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-0.5">
        {DAYS.map(({ dow, label }) => {
          const day    = getDay(dow)
          const isOpen = day?.isWorking ?? false
          return (
            <div key={dow} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
              isOpen ? 'bg-muted/20' : 'opacity-40'
            )}>
              <button
                type="button"
                onClick={() => update(dow, { isWorking: !isOpen })}
                className={cn('relative w-10 h-5 rounded-full flex-shrink-0 transition-colors', isOpen ? 'bg-primary' : 'bg-muted')}
              >
                <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', isOpen ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
              <span className={cn('text-sm font-body w-32 flex-shrink-0', isOpen ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
              {isOpen ? (
                <div className="flex items-center gap-2 ml-auto">
                  <select value={day?.startTime ?? '09:00'} onChange={e => update(dow, { startTime: e.target.value })} className={inputCls}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground">–</span>
                  <select value={day?.endTime ?? '19:00'} onChange={e => update(dow, { endTime: e.target.value })} className={inputCls}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="ml-auto text-xs text-muted-foreground font-body">Folga</span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Subscription Section (super_admin / manager) ─────────────────────────────
function SubscriptionSettings() {
  const { organization } = useAuthStore()
  const { user } = useAuthStore()
  const { activeLocation } = useUIStore()
  const locationId = activeLocation?.id ?? user?.locationId ?? ''
  const { data: locations = [] } = useLocations()
  const { data: employees = [] } = useEmployees(locationId)

  const plan        = (organization?.plan ?? 'basic') as Plan
  const currentPlan = PLANS[plan]

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Subscrição Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">Plano {currentPlan.name}</p>
                <p className="text-sm text-muted-foreground font-body">
                  {currentPlan.price > 0 ? `€${currentPlan.price}/mês` : 'Preço personalizado'}
                </p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-0">Ativo</Badge>
          </div>

          <div className="space-y-3 mb-4">
            <UsageBar label="Barbeiros" current={employees.length} max={currentPlan.maxBarbers} />
            <UsageBar label="Lojas"     current={locations.length} max={currentPlan.maxLocations} />
          </div>

          <ul className="space-y-1.5">
            {currentPlan.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground font-body mt-4 pt-4 border-t border-border">
            Para fazer upgrade ou downgrade do teu plano, contacta o suporte BarberDesk.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Planos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {(Object.values(PLANS) as (typeof PLANS)[Plan][]).map(p => {
              const isCurrent  = p.id === plan
              const planOrder: Plan[] = ['basic', 'pro', 'premium', 'enterprise']
              const isUpgrade  = planOrder.indexOf(p.id) > planOrder.indexOf(plan)
              return (
                <div key={p.id} className={cn('flex items-center justify-between px-5 py-4 transition-colors', isCurrent && 'bg-primary/5')}>
                  <div className="flex items-center gap-3">
                    {isCurrent   && <CheckCircle2  className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    {isUpgrade   && <ArrowUpCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                    {!isCurrent && !isUpgrade && <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />}
                    <div>
                      <p className={cn('text-sm font-display font-semibold', isCurrent ? 'text-primary' : 'text-foreground')}>
                        {p.name}
                        {isCurrent && <span className="ml-2 text-[10px] font-body bg-primary/10 text-primary px-1.5 py-0.5 rounded">atual</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {p.maxBarbers   === -1 ? 'Barbeiros ilimitados' : `Até ${p.maxBarbers} barbeiro${p.maxBarbers === 1 ? '' : 's'}`}
                        {' · '}
                        {p.maxLocations === -1 ? 'Lojas ilimitadas' : `${p.maxLocations} loja${p.maxLocations === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-foreground flex-shrink-0">
                    {p.price > 0 ? `€${p.price}/mês` : 'Contacto'}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Booking Link Section ──────────────────────────────────────────────────────
// Link público de marcações (`/book/{orgSlug}`) que o dono pode partilhar com clientes.
function BookingLinkCard() {
  const { organization } = useAuthStore()
  const [justCopied, setJustCopied] = useState(false)

  const slug = organization?.slug
  const bookingUrl = slug ? `${window.location.origin}/book/${slug}` : ''

  if (!slug) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
    } catch {
      // Fallback para browsers sem clipboard API
      const ta = document.createElement('textarea')
      ta.value = bookingUrl
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setJustCopied(true)
    setTimeout(() => setJustCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4 text-primary" /> Link de Marcações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground font-body mb-3">
          Partilha este link com os teus clientes para marcarem online.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={bookingUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring truncate"
            aria-label="Link de marcações"
          />
          <Button size="sm" onClick={handleCopy}>
            {justCopied
              ? <><Check className="w-3.5 h-3.5" /> Copiado</>
              : <><Copy className="w-3.5 h-3.5" /> Copiar</>
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user }           = useAuthStore()
  const { activeLocation } = useUIStore()
  const locationId = activeLocation?.id ?? user?.locationId ?? ''

  const isEmployee  = user?.role === 'employee'
  const isPartner   = user?.role === 'partner'
  const isSelfScoped = isEmployee || isPartner

  // Find own employee record to get employeeId for working hours
  const { data: employees = [] } = useEmployees(locationId)
  const myEmployee = employees.find(e => e.userId === user?.id)

  const isManager    = user?.role === 'manager'

  // Employee / Partner — only see their own schedule
  if (isSelfScoped) {
    return (
      <div className="max-w-lg">
        <PageHeader
          title="O meu horário"
          subtitle="Define os dias e horas em que estás disponível"
        />
        {myEmployee
          ? <MySchedule employeeId={myEmployee.id} />
          : <p className="text-sm text-muted-foreground font-body">Não foi possível carregar o teu registo de barbeiro.</p>
        }
      </div>
    )
  }

  // Manager — show only their schedule, no subscription
  if (isManager) {
    return (
      <div className="max-w-lg">
        <PageHeader
          title="O meu horário"
          subtitle="Define os teus dias e horas de trabalho"
        />
        {myEmployee
          ? <MySchedule employeeId={myEmployee.id} />
          : <p className="text-sm text-muted-foreground font-body">Não foi possível carregar o teu registo.</p>
        }
      </div>
    )
  }

  // Owner / Super Admin — subscription info + shareable booking link
  return (
    <div>
      <PageHeader title="Configurações" />
      <div className="space-y-4">
        <BookingLinkCard />
        <SubscriptionSettings />
      </div>
    </div>
  )
}

// ─── Usage bar ────────────────────────────────────────────────────────────────
function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const unlimited   = max === -1
  const pct         = unlimited ? 0 : Math.min((current / max) * 100, 100)
  const isNearLimit = !unlimited && pct >= 80
  const isAtLimit   = !unlimited && current >= max

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-body text-muted-foreground">{label}</span>
        <span className={cn('text-xs font-mono font-medium',
          isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-foreground'
        )}>
          {current} / {unlimited ? '∞' : max}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full transition-all',
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
          )} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
