import { useState } from 'react'
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, User, CheckCircle2, XCircle, PlayCircle, AlertCircle } from 'lucide-react'
import { cn, formatCurrency, statusColors } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { Appointment, Employee, Client, Service } from '@/models'

interface Props {
  currentDate:   Date
  appointments:  Appointment[]
  employees:     Employee[]
  clients:       Client[]
  services:      Service[]
  onDateChange:  (d: Date) => void
  onAptClick:    (apt: Appointment) => void
  onNewApt:      () => void
  onStatusChange:(aptId: string, status: Appointment['status']) => void
}

// Quick status actions per current status
const NEXT_ACTIONS: Record<string, { status: Appointment['status']; label: string; icon: typeof CheckCircle2; color: string }[]> = {
  pending:     [{ status: 'confirmed',   label: 'Confirmar',  icon: CheckCircle2, color: 'text-green-400' }],
  confirmed:   [{ status: 'in_progress', label: 'Iniciar',    icon: PlayCircle,   color: 'text-blue-400'  },
                { status: 'no_show',     label: 'Faltou',     icon: AlertCircle,  color: 'text-slate-400' }],
  in_progress: [{ status: 'completed',   label: 'Concluir',   icon: CheckCircle2, color: 'text-indigo-400'},
                { status: 'cancelled',   label: 'Cancelar',   icon: XCircle,      color: 'text-red-400'   }],
}

// Generate a 7-day strip centred around currentDate
function buildStrip(center: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(center, i - 3))
}

export function MobileAgenda({
  currentDate, appointments, employees, clients, services,
  onDateChange, onAptClick, onNewApt, onStatusChange,
}: Props) {
  const { t } = useTranslation()
  const [expandedApt, setExpandedApt] = useState<string | null>(null)

  const strip = buildStrip(currentDate)
  const todayApts = appointments
    .filter(a => isSameDay(new Date(a.startsAt), currentDate))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  const getClient  = (id: string) => clients.find(c => c.id === id)
  const getService = (id: string) => services.find(s => s.id === id)
  const getEmployee= (id: string) => employees.find(e => e.id === id)

  const statusDot: Record<string, string> = {
    pending:     'bg-amber-500',
    confirmed:   'bg-green-500',
    in_progress: 'bg-blue-500',
    completed:   'bg-indigo-500',
    cancelled:   'bg-red-500',
    no_show:     'bg-slate-500',
  }

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <button
          onClick={() => onDateChange(subDays(currentDate, 7))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <span className="font-display font-semibold text-sm text-foreground capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: pt })}
        </span>

        <button
          onClick={() => onDateChange(addDays(currentDate, 7))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Day strip ── */}
      <div className="flex items-center gap-1 px-2 pb-3 overflow-x-auto scrollbar-thin">
        {strip.map(day => {
          const isSelected = isSameDay(day, currentDate)
          const isTodayDay = isToday(day)
          const hasPts = appointments.some(a => isSameDay(new Date(a.startsAt), day))

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-[44px] py-2 px-1 rounded-xl transition-all flex-shrink-0',
                isSelected && 'bg-primary text-primary-foreground shadow-md shadow-primary/30',
                !isSelected && isTodayDay && 'border border-primary text-primary',
                !isSelected && !isTodayDay && 'text-muted-foreground hover:bg-muted'
              )}
            >
              <span className="text-[10px] font-body uppercase tracking-wider leading-none">
                {format(day, 'EEE', { locale: pt })}
              </span>
              <span className="text-base font-display font-bold leading-none">
                {format(day, 'd')}
              </span>
              {/* Appointment dot */}
              <div className={cn('w-1 h-1 rounded-full mt-0.5', hasPts ? (isSelected ? 'bg-white/70' : 'bg-primary') : 'bg-transparent')} />
            </button>
          )
        })}
      </div>

      {/* ── Day summary bar ── */}
      <div className="mx-4 mb-3 px-4 py-2.5 rounded-xl bg-muted/40 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-body">
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
          <p className="text-sm font-display font-semibold text-foreground mt-0.5">
            {todayApts.length === 0
              ? 'Sem marcações'
              : `${todayApts.length} marcaç${todayApts.length === 1 ? 'ão' : 'ões'}`}
          </p>
        </div>
        {todayApts.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-body">Receita prevista</p>
            <p className="text-sm font-display font-semibold text-primary">
              {formatCurrency(todayApts.filter(a => !['cancelled','no_show'].includes(a.status)).reduce((s, a) => s + a.price, 0))}
            </p>
          </div>
        )}
      </div>

      {/* ── Appointments list ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-24 space-y-2">
        {todayApts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-foreground">Dia livre</p>
            <p className="text-sm text-muted-foreground font-body mt-1">Sem marcações para este dia.</p>
            <button
              onClick={onNewApt}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-body font-medium"
            >
              + Criar marcação
            </button>
          </div>
        ) : (
          todayApts.map(apt => {
            const client  = getClient(apt.clientId)
            const service = getService(apt.serviceId)
            const employee= getEmployee(apt.employeeId)
            const isExpanded = expandedApt === apt.id
            const actions = NEXT_ACTIONS[apt.status] ?? []

            return (
              <div
                key={apt.id}
                className={cn(
                  'rounded-xl border bg-card overflow-hidden transition-all',
                  isExpanded ? 'border-primary/40' : 'border-border',
                  ['cancelled','no_show'].includes(apt.status) && 'opacity-60'
                )}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedApt(isExpanded ? null : apt.id)}
                >
                  {/* Time + status dot */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-12">
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                      {format(new Date(apt.startsAt), 'HH:mm')}
                    </span>
                    <div className={cn('w-2 h-2 rounded-full', statusDot[apt.status])} />
                    <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
                      {format(new Date(apt.endsAt), 'HH:mm')}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px self-stretch bg-border mx-1" />

                  {/* Client + service */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-display font-bold text-primary">
                          {client?.name.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-display font-semibold text-foreground truncate">
                          {client?.name ?? apt.clientId}
                        </p>
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {service?.name ?? apt.serviceId}
                          {employee && <span className="text-muted-foreground/50"> · {employee.name}</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price + chevron */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-display font-semibold text-foreground">
                      {formatCurrency(apt.price)}
                    </span>
                    <ChevronRight
                      className={cn('w-3.5 h-3.5 text-muted-foreground/50 transition-transform', isExpanded && 'rotate-90')}
                    />
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-border/50 bg-muted/20 animate-fade-in">
                    {/* Client details */}
                    {client && (
                      <div className="flex items-center gap-2 py-2.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-body">{client.phone}</p>
                          {client.email && <p className="text-xs text-muted-foreground font-body">{client.email}</p>}
                          {apt.notes && <p className="text-xs text-foreground/70 font-body mt-1 italic">"{apt.notes}"</p>}
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mb-3', statusColors[apt.status])}>
                      {t(`appointments.status.${apt.status}`)}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 flex-wrap">
                      {actions.map(action => (
                        <button
                          key={action.status}
                          onClick={() => { onStatusChange(apt.id, action.status); setExpandedApt(null) }}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium',
                            'bg-muted border border-border hover:bg-muted/80 transition-colors',
                            action.color
                          )}
                        >
                          <action.icon className="w-3.5 h-3.5" />
                          {action.label}
                        </button>
                      ))}
                      <button
                        onClick={() => { onAptClick(apt); setExpandedApt(null) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-6 right-4 z-30">
        <button
          onClick={onNewApt}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
