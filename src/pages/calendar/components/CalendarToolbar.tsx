import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange, LayoutGrid, Users, Filter } from 'lucide-react'
import { Button } from '@/components/ui'
import { type CalendarView } from '../useCalendar'
import { cn } from '@/lib/utils'
import type { Employee } from '@/models'

interface Props {
  title:              string
  view:               CalendarView
  availableViews:     CalendarView[]
  onViewChange:       (v: CalendarView) => void
  onNavigate:         (dir: 'prev' | 'next' | 'today') => void
  onNewApt:           () => void
  employees?:         Employee[]
  selectedEmployeeId: string | 'all'
  onEmployeeChange:   (id: string | 'all') => void
  showEmployeeFilter: boolean
}

const ALL_VIEWS: { key: CalendarView; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { key: 'day',       label: 'Dia',          shortLabel: 'Dia',    icon: CalendarDays  },
  { key: 'multiBarb', label: 'Multi-barb.',  shortLabel: 'Multi',  icon: Users         },
  { key: 'week',      label: 'Semana',       shortLabel: 'Sem.',   icon: CalendarRange },
  { key: 'month',     label: 'Mês',          shortLabel: 'Mês',    icon: LayoutGrid    },
]

export function CalendarToolbar({
  title, view, availableViews, onViewChange, onNavigate, onNewApt,
  employees = [], selectedEmployeeId, onEmployeeChange, showEmployeeFilter,
}: Props) {
  const visibleViews = ALL_VIEWS.filter(v => availableViews.includes(v.key))

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-3 flex-wrap">

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('prev')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('today')}
            className="px-3 h-8 rounded-lg text-xs font-body font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
          >
            Hoje
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h2 className="font-display font-semibold text-foreground text-sm capitalize flex-1 min-w-0 truncate">
          {title}
        </h2>

        {/* View switcher */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          {visibleViews.map(v => (
            <button
              key={v.key}
              onClick={() => onViewChange(v.key)}
              title={v.label}
              className={cn(
                'flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-body font-medium transition-all',
                view === v.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <v.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{v.shortLabel}</span>
            </button>
          ))}
        </div>

        <Button size="sm" onClick={onNewApt}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Marcação</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Employee filter pills — only for week view with multiple employees */}
      {showEmployeeFilter && (
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onEmployeeChange('all')}
              className={cn(
                'px-3 h-7 rounded-lg text-xs font-body font-medium transition-all border',
                selectedEmployeeId === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              Todos
            </button>
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => onEmployeeChange(emp.id)}
                className={cn(
                  'px-3 h-7 rounded-lg text-xs font-body font-medium transition-all border',
                  selectedEmployeeId === emp.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {emp.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
