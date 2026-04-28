import { format, isSameMonth, isSameDay } from 'date-fns'
import { cn, statusColors } from '@/lib/utils'
import type { Appointment, Client } from '@/models'

interface Props {
  monthDays:    Date[]
  currentDate:  Date
  appointments: Appointment[]
  clientMap?:   Record<string, Client>
  onDayClick:   (date: Date) => void
  onAptClick:   (apt: Appointment) => void
}

const DAY_LABELS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

export function MonthView({ monthDays, currentDate, appointments, clientMap = {}, onDayClick, onAptClick }: Props) {
  const today = new Date()

  return (
    <div className="flex-1 overflow-auto">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 flex-1">
        {monthDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday     = isSameDay(day, today)
          const dayApts        = appointments.filter(a => isSameDay(new Date(a.startsAt), day))

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[100px] border-b border-r border-border p-1.5 cursor-pointer',
                'hover:bg-muted/30 transition-colors',
                !isCurrentMonth && 'opacity-40',
                isDayToday && 'bg-primary/5',
              )}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-display font-semibold',
                  isDayToday
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Appointments (max 3 shown) */}
              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map(apt => (
                  <div
                    key={apt.id}
                    onClick={e => { e.stopPropagation(); onAptClick(apt) }}
                    className={cn(
                      'text-[10px] font-body px-1.5 py-0.5 rounded truncate cursor-pointer',
                      'hover:opacity-80 transition-opacity border',
                      statusColors[apt.status]
                    )}
                  >
                    {format(new Date(apt.startsAt), 'HH:mm')} {clientMap[apt.clientId]?.name ?? apt.clientId}
                  </div>
                ))}
                {dayApts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground font-body pl-1">
                    +{dayApts.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
