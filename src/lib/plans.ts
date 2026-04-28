import type { Organization } from '@/models'

// ─── Plan definitions ─────────────────────────────────────────────────────────
export type Plan = 'basic' | 'pro' | 'premium' | 'enterprise'

export interface PlanConfig {
  id: Plan
  name: string
  price: number          // €/month
  maxBarbers: number     // -1 = unlimited
  maxLocations: number   // -1 = unlimited
  features: string[]
}

export const PLANS: Record<Plan, PlanConfig> = {
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 19,
    maxBarbers: 1,
    maxLocations: 1,
    features: [
      'Agenda online',
      'Gestão de clientes (até 200)',
      'Notificações por email',
      '1 barbeiro (tu próprio)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    maxBarbers: 3,
    maxLocations: 1,
    features: [
      'Tudo do Básico',
      'Até 3 barbeiros',
      'Relatórios avançados',
      'Notificações SMS (200/mês)',
      'Lista de espera',
      'Gestão de comissões',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 69,
    maxBarbers: 10,
    maxLocations: 3,
    features: [
      'Tudo do Pro',
      'Até 10 barbeiros',
      'Até 3 lojas',
      'SMS ilimitados',
      'Gestão de stock',
      'Suporte prioritário',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // negotiated
    maxBarbers: -1,
    maxLocations: -1,
    features: [
      'Tudo do Premium',
      'Lojas e barbeiros ilimitados',
      'Dashboard multi-loja',
      'White-label',
      'Account manager dedicado',
      'SLA garantido',
    ],
  },
}

// ─── Limit checks ─────────────────────────────────────────────────────────────
export function canAddBarber(plan: Plan, currentBarbers: number): boolean {
  const config = PLANS[plan]
  if (config.maxBarbers === -1) return true
  return currentBarbers < config.maxBarbers
}

export function canAddLocation(plan: Plan, currentLocations: number): boolean {
  const config = PLANS[plan]
  if (config.maxLocations === -1) return true
  return currentLocations < config.maxLocations
}

export function getUpgradePlan(plan: Plan): Plan | null {
  const order: Plan[] = ['basic', 'pro', 'premium', 'enterprise']
  const idx = order.indexOf(plan)
  return idx < order.length - 1 ? order[idx + 1] : null
}

export function barberLimitMessage(plan: Plan): string {
  const config = PLANS[plan]
  const next = getUpgradePlan(plan)
  const nextConfig = next ? PLANS[next] : null
  return nextConfig
    ? `O teu plano ${config.name} permite até ${config.maxBarbers} barbeiro${config.maxBarbers === 1 ? '' : 's'}. Faz upgrade para ${nextConfig.name} para adicionar mais.`
    : `Limite atingido para o plano ${config.name}.`
}
