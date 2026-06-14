import { useState } from 'react'
import { Users, Plus, Percent, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEmployees, useServices, useDeleteEmployee } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader, Card, CardContent, Badge, Avatar, Button, EmptyState, Spinner } from '@/components/ui'
import { UpsellBanner } from '@/components/ui/PlanGate'
import { PLANS, canAddBarber } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { CreateEmployeeModal } from './components/CreateEmployeeModal'
import type { Employee } from '@/models'
import type { Plan } from '@/lib/plans'
import { can } from '@/permissions/abilities'
import type { Ability, Role } from '@/permissions/abilities'

export function EmployeesPage() {
  const { t } = useTranslation()
  const { user, organization } = useAuthStore()
  const { activeLocation } = useUIStore()
  const locationId = activeLocation?.id ?? user?.locationId ?? 'loc-1'
  const plan = (organization?.plan ?? 'basic') as Plan

  const { data: employees = [], isLoading } = useEmployees(locationId)
  const { data: services  = [] }            = useServices()
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s]))

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const atLimit = !canAddBarber(plan, employees.length)
  const planConfig = PLANS[plan]

  // Verificar se o user logado pode despedir employees
  const canManage = can((user?.role ?? 'employee') as Role, 'employees:manage' as Ability)

  return (
    <div>
      <PageHeader
        title={t('employees.title')}
        subtitle={`${employees.length} de ${planConfig.maxBarbers === -1 ? '∞' : planConfig.maxBarbers} barbeiros no plano ${planConfig.name}`}
        actions={
          <Button
            onClick={() => {
              if (atLimit) return
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
              canManage={canManage}
              onClick={() => { setSelectedEmployee(emp); setModalOpen(true) }}
            />
          ))}

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
function EmployeeCard({ employee, isSelf, onClick, canManage, serviceMap }: {
  employee: Employee; isSelf: boolean; onClick: () => void; canManage: boolean
  serviceMap: Record<string, { name: string; color: string }>
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const deleteEmployee = useDeleteEmployee()

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  const confirmDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteEmployee.mutateAsync(employee.id)
    } finally {
      setShowConfirm(false)
    }
  }

  const cancelDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(false)
  }

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
          {canManage && !isSelf && !showConfirm && (
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all"
              title="Despedir barbeiro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Confirmação de despedir */}
        {showConfirm && (
          <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-body text-red-400 mb-2">
              Tens a certeza que queres despedir <strong>{employee.name}</strong>?
              O barbeiro vai perder acesso ao sistema.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmDismiss}
                loading={deleteEmployee.isPending}
                className="h-7 text-xs"
              >
                Sim, despedir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelDismiss}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

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