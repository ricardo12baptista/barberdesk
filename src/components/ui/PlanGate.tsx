import { ReactNode } from 'react'
import { Lock, ArrowUpCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { PLANS, getUpgradePlan } from '@/lib/plans'
import type { Plan } from '@/lib/plans'
import { cn } from '@/lib/utils'

interface PlanGateProps {
  // The minimum plan required to perform this action
  requiredPlan: Plan
  // What to check - 'barbers' | 'locations' | just 'plan' (feature gate)
  limitType?: 'barbers' | 'locations' | 'feature'
  children: ReactNode
  // If provided, render inline upsell instead of wrapping children
  inlineUpsell?: boolean
}

export function PlanGate({ requiredPlan, limitType = 'feature', children, inlineUpsell = false }: PlanGateProps) {
  const { organization } = useAuthStore()
  const { canAddBarber, canAddLocation } = useAppStore()
  const plan = (organization?.plan ?? 'basic') as Plan

  let allowed = true
  if (limitType === 'barbers')   allowed = canAddBarber(plan)
  if (limitType === 'locations') allowed = canAddLocation(plan)
  if (limitType === 'feature') {
    const planOrder: Plan[] = ['basic', 'pro', 'premium', 'enterprise']
    allowed = planOrder.indexOf(plan) >= planOrder.indexOf(requiredPlan)
  }

  if (allowed) return <>{children}</>

  const currentConfig = PLANS[plan]
  const upgradePlan   = getUpgradePlan(plan)
  const upgradeConfig = upgradePlan ? PLANS[upgradePlan] : null

  if (inlineUpsell) {
    return (
      <UpsellBanner
        currentPlan={currentConfig.name}
        upgradePlan={upgradeConfig?.name}
        upgradePrice={upgradeConfig?.price}
        limitType={limitType}
        currentLimit={limitType === 'barbers' ? currentConfig.maxBarbers : currentConfig.maxLocations}
      />
    )
  }

  // Wrap children with locked overlay
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <UpsellBadge upgradePlan={upgradeConfig?.name} upgradePrice={upgradeConfig?.price} />
      </div>
    </div>
  )
}

// ─── Upsell Banner (inline) ────────────────────────────────────────────────────
interface UpsellBannerProps {
  currentPlan: string
  upgradePlan?: string
  upgradePrice?: number
  limitType: string
  currentLimit: number
}

export function UpsellBanner({ currentPlan, upgradePlan, upgradePrice, limitType, currentLimit }: UpsellBannerProps) {
  const label = limitType === 'barbers' ? 'barbeiros' : 'lojas'

  return (
    <div className={cn(
      'rounded-xl border border-primary/30 bg-primary/5 p-4',
      'flex items-start gap-3'
    )}>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <ArrowUpCircle className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-foreground">
          Limite do plano {currentPlan} atingido
        </p>
        <p className="text-xs text-muted-foreground font-body mt-0.5">
          O teu plano permite até {currentLimit} {label}.
          {upgradePlan && ` Faz upgrade para ${upgradePlan} para adicionar mais.`}
        </p>
        {upgradePlan && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-body text-muted-foreground">
              Plano {upgradePlan} — {upgradePrice ? `€${upgradePrice}/mês` : 'contacta-nos'}
            </span>
            <span className="text-xs text-primary font-body font-medium">
              · Contacta o suporte para fazer upgrade
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upsell Badge (overlay) ────────────────────────────────────────────────────
function UpsellBadge({ upgradePlan, upgradePrice }: { upgradePlan?: string; upgradePrice?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
      <Lock className="w-4 h-4 text-primary flex-shrink-0" />
      <div>
        <p className="text-xs font-display font-semibold text-foreground">
          Funcionalidade {upgradePlan}
        </p>
        {upgradePrice && (
          <p className="text-[11px] text-muted-foreground font-body">
            A partir de €{upgradePrice}/mês
          </p>
        )}
      </div>
    </div>
  )
}
