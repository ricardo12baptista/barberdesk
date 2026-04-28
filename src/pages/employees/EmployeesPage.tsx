import { useState } from 'react'
import { Users, Plus, Phone, Percent, Star, MoreVertical, UserCheck, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEmployees, useServices, useCreateEmployee } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useAppStore } from '@/stores/app.store'
import { PageHeader, Card, CardContent, Badge, Avatar, Button, EmptyState, Spinner } from '@/components/ui'
import { PlanGate, UpsellBanner } from '@/components/ui/PlanGate'
import { PLANS, canAddBarber } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { CreateEmployeeModal } from './components/CreateEmployeeModal'
import type { Employee } from '@/models'
import type { Plan } from '@/lib/plans'

export function EmployeesPage() {
  const { t } = useTranslation()
  const { user, organization } = useAuthStore()
  const { activeLocation } = useUIStore()
  const { totalBarbers } = useAppStore()
  const locationId = activeLocation?.id ?? user?.locationId ?? 'loc-1'
  const plan = (organization?.plan ?? 'basic') as Plan

  const { data: employees = [], isLoading } = useEmployees(locationId)
  const { data: services  = [] }            = useServices()
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s]))

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const atLimit = !canAddBarber(plan, employees.length)
  const planConfig = PLANS[plan]

  return (
    <div>
      <PageHeader
        title={t('employees.title')}
        subtitle={`${employees.length} de ${planConfig.maxBarbers === -1 ? '∞' : planConfig.maxBarbers} barbeiros no plano ${planConfig.name}`}
        actions={
          <Button
            onClick={() => {
              if (atLimit) return   // PlanGate handles the UX
              setSelectedEmployee(null)
              setModalOpen(true)
            }}
            variant={atLimit ? 'outline' : 'primary'}
          >
            <Plus className="w-4 h-4" />
            {t('employees.new')}
          </Button>
        }
      />

      {/* Plan limit warning */}
      {atLimit && (
        <div className="mb-4">
          <UpsellBanner
            currentPlan={planConfig.name}
            upgradePlan={PLANS[plan === 'basic' ? 'pro' : plan === 'pro' ? 'premium' : 'enterprise']?.name}
            upgradePrice={PLANS[plan === 'basic' ? 'pro' : plan === 'pro' ? 'premium' : 'enterprise']?.price}
            limitType="barbers"
            currentLimit={planConfig.maxBarbers}
          />
        </div>
      )}

      {/* Employee grid */}
      {isLoading ? (
        <Spinner />
      ) : employees.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="Nenhum barbeiro ainda"
              description="Começa por te adicionares a ti próprio como barbeiro, ou adiciona a tua equipa."
              action={
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Adicionar Barbeiro
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <EmployeeCard
              serviceMap={serviceMap}
              key={emp.id}
              employee={emp}
              isSelf={emp.userId === user?.id}
              onClick={() => { setSelectedEmployee(emp); setModalOpen(true) }}
            />
          ))}

          {/* Add slot — shown but locked if at limit */}
          {!atLimit && (
            <button
              onClick={() => { setSelectedEmployee(null); setModalOpen(true) }}
              className={cn(
                'rounded-xl border-2 border-dashed border-border',
                'flex flex-col items-center justify-center gap-2 p-8',
                'text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30',
                'transition-all cursor-pointer min-h-[180px]'
              )}
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-body">{t('employees.new')}</span>
            </button>
          )}
        </div>
      )}

      <CreateEmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEmployee(null) }}
        employee={selectedEmployee}
        locationId={locationId}
      />
    </div>
  )
}

// ─── Employee Card ─────────────────────────────────────────────────────────────
function EmployeeCard({ employee, isSelf, onClick, serviceMap }: { employee: Employee; isSelf: boolean; onClick: () => void; serviceMap: Record<string, { name: string; color: string }> }) {
  const { t } = useTranslation()

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-display font-semibold text-foreground text-sm">{employee.name}</p>
                {isSelf && (
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Tu</Badge>
                )}
              </div>
              <Badge className={cn(
                'border-0 text-[10px] mt-0.5',
                employee.isActive
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-slate-500/10 text-slate-400'
              )}>
                {employee.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Services */}
        {(employee.serviceIds ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {(employee.serviceIds ?? []).map(id => {
              const svc = serviceMap[id]
              return svc ? (
                <span key={id} className="flex items-center gap-1 text-[10px] font-body px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
                  {svc.name}
                </span>
              ) : null
            })}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <Percent className="w-3 h-3" />
            {employee.commissionPercent}% comissão
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
